#!/usr/bin/env node
/**
 * live-scan.mjs — Escáner de seguridad activo (caja negra) para Quelita.
 *
 * Corre una batería de comprobaciones no-mutantes contra un despliegue en vivo
 * (por defecto la VM de test) y emite un resumen rankeado + un JSON de evidencia.
 *
 * Uso:
 *   node security/live-scan.mjs [BASE_URL] [--deep] [--json ruta]
 *   node security/live-scan.mjs http://192.168.6.14
 *   node security/live-scan.mjs http://192.168.6.14 --deep    # incluye pruebas que CREAN datos
 *
 * Requiere Node 18+ (usa fetch global). Sin dependencias externas.
 *
 * NO es un reemplazo de un pentest profesional: cubre los vectores web más
 * comunes (headers, CORS, authz, inyección, rate-limit, info disclosure) de
 * forma automatizada y reproducible para un entorno de testing propio.
 */

import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const BASE = (args.find((a) => a.startsWith('http')) || 'http://192.168.6.14').replace(/\/$/, '');
const DEEP = args.includes('--deep');
const jsonIdx = args.indexOf('--json');
const JSON_OUT = jsonIdx !== -1 ? args[jsonIdx + 1] : new URL('./scan-results.json', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const SEV = { CRIT: 'CRÍTICA', HIGH: 'ALTA', MED: 'MEDIA', LOW: 'BAJA', INFO: 'INFO', OK: 'OK' };
const findings = [];
const add = (sev, title, detail, evidence) => findings.push({ sev, title, detail, evidence });

// ── helpers ───────────────────────────────────────────────────────────────
const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
/** Forja un JWT NO firmado (firma basura). Sirve para probar endpoints que
 *  hacen jwt.decode() sin verificar (p.ej. el keyGenerator del rate limiter). */
const forgeToken = (payload, alg = 'HS256') =>
  `${b64url({ alg, typ: 'JWT' })}.${b64url(payload)}.${alg === 'none' ? '' : 'ZmFrZXNpZw'}`;

async function req(path, { method = 'GET', headers = {}, body, redirect = 'manual' } = {}) {
  const url = path.startsWith('http') ? path : BASE + path;
  const t0 = performance.now();
  try {
    const res = await fetch(url, {
      method,
      headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
      redirect,
    });
    const ms = performance.now() - t0;
    const text = await res.text().catch(() => '');
    return { status: res.status, headers: res.headers, text, ms, ok: res.ok };
  } catch (e) {
    return { status: 0, headers: new Headers(), text: String(e), ms: performance.now() - t0, error: true };
  }
}

const h = (r, name) => r.headers.get(name);
const short = (s, n = 160) => (s || '').replace(/\s+/g, ' ').slice(0, n);

// ── 1. Security headers ─────────────────────────────────────────────────────
async function checkHeaders() {
  const front = await req('/');
  const api = await req('/api/categories');

  // Frontend (páginas HTML)
  const missingFront = [];
  if (!h(front, 'content-security-policy')) missingFront.push('CSP');
  if (!h(front, 'x-frame-options') && !/frame-ancestors/i.test(h(front, 'content-security-policy') || '')) missingFront.push('X-Frame-Options/frame-ancestors');
  if (!h(front, 'strict-transport-security')) missingFront.push('HSTS');
  if (!h(front, 'x-content-type-options')) missingFront.push('X-Content-Type-Options(nosniff)');
  if (missingFront.length) {
    add('MED', 'Páginas de usuario sin headers de seguridad',
      `El HTML servido por el frontend (Next/Caddy) no envía: ${missingFront.join(', ')}. Habilita clickjacking y reduce defensa XSS en las páginas que más importan.`,
      { url: BASE + '/', status: front.status, headersPresentes: [...front.headers.keys()] });
  } else {
    add('OK', 'Frontend con headers de seguridad', 'El HTML trae CSP/XFO/HSTS/nosniff.', {});
  }

  // X-Powered-By
  const xpb = h(front, 'x-powered-by') || h(api, 'x-powered-by');
  if (xpb) add('LOW', 'Divulgación de tecnología (X-Powered-By)', `Header X-Powered-By presente: "${xpb}". Revela el stack/framework.`, { xPoweredBy: xpb });

  // API (helmet)
  const apiMissing = [];
  for (const hd of ['content-security-policy', 'x-content-type-options', 'strict-transport-security', 'x-frame-options']) {
    if (!h(api, hd)) apiMissing.push(hd);
  }
  if (apiMissing.length === 0) add('OK', 'API con headers helmet', 'CSP/nosniff/HSTS/XFO presentes en /api.', { csp: short(h(api, 'content-security-policy')) });
  else add('LOW', 'API sin algunos headers helmet', `Faltan en /api: ${apiMissing.join(', ')}`, {});
}

// ── 2. CORS con orígenes maliciosos ─────────────────────────────────────────
async function checkCors() {
  const origins = [
    'https://evil.com',
    'https://quelita.evil.com',
    'https://seenode.com.evil.com',   // intento de bypass por sufijo
    'https://random-attacker.trycloudflare.com', // dominio de túnel compartido
    'http://192.168.6.99',            // IP LAN arbitraria
  ];
  for (const origin of origins) {
    const r = await req('/api/categories', { headers: { Origin: origin } });
    const acao = h(r, 'access-control-allow-origin');
    const acac = h(r, 'access-control-allow-credentials');
    const reflected = acao === origin || acao === '*';
    if (reflected && acac === 'true') {
      const sev = /trycloudflare|192\.168/.test(origin) ? 'MED' : 'HIGH';
      add(sev, `CORS refleja origen no confiable con credenciales`,
        `El backend permitió Origin "${origin}" con Access-Control-Allow-Credentials: true. Permite requests con credenciales desde ese origen.`,
        { origin, acao, acac, status: r.status });
    } else {
      add('OK', `CORS bloquea ${origin}`, `ACAO="${acao ?? '(ausente)'}", credenciales="${acac ?? '(ausente)'}"`, { origin, acao, acac });
    }
  }
}

// ── 3. Bypass de rate-limit vía claim role de JWT no verificado ─────────────
async function checkRateLimitBypass() {
  const anon = await req('/api/categories');
  const limitAnon = h(anon, 'ratelimit-limit');

  const adminTok = forgeToken({ id: 'aaaaaaaaaaaaaaaaaaaaaaaa', email: 'x@x', role: 'admin', tv: 0 });
  const asAdmin = await req('/api/categories', { headers: { Authorization: `Bearer ${adminTok}` } });
  const limitAdmin = h(asAdmin, 'ratelimit-limit');

  // Rol arbitrario nuevo → ¿bucket fresco?
  const rndRole = 'zz' + Math.random().toString(36).slice(2, 8);
  const rndTok = forgeToken({ id: 'bbbbbbbbbbbbbbbbbbbbbbbb', email: 'y@y', role: rndRole, tv: 0 });
  const asRnd = await req('/api/categories', { headers: { Authorization: `Bearer ${rndTok}` } });
  const remainingRnd = h(asRnd, 'ratelimit-remaining');
  const limitRnd = h(asRnd, 'ratelimit-limit');

  const bumped = limitAdmin && limitAnon && Number(limitAdmin) > Number(limitAnon);
  if (bumped) {
    add('MED', 'Bypass de rate-limit con token admin forjado (no verificado)',
      `Un token con { role: "admin" } y firma inválida eleva el límite de ${limitAnon} a ${limitAdmin} req/ventana. El keyGenerator/max del rate limiter usa jwt.decode() sin verificar la firma, así que un anónimo obtiene el cupo privilegiado sin credenciales válidas. Además cada valor de "role" distinto crea un bucket independiente (rol aleatorio "${rndRole}" → límite ${limitRnd}, remaining ${remainingRnd}), permitiendo rotar el claim para multiplicar el cupo.`,
      { limitAnon, limitAdmin, rolAleatorio: rndRole, limitRnd, remainingRnd });
  } else {
    add('INFO', 'Rate-limit no elevado por token forjado', `anon=${limitAnon}, admin=${limitAdmin} (no se observó bump; revisar manualmente).`, { limitAnon, limitAdmin });
  }
}

// ── 4. Acceso no autenticado a rutas protegidas ─────────────────────────────
async function checkAuthz() {
  const protectedRoutes = [
    ['GET', '/api/users'],
    ['GET', '/api/users/funcionarios'],
    ['GET', '/api/audit-logs'],
    ['GET', '/api/admin/dashboard/stats'],
    ['GET', '/api/stock-movements'],
    ['GET', '/api/orders'],                 // listar órdenes (admin/funcionario)
    ['GET', '/api/users/me/addresses'],     // requiere auth
  ];
  for (const [method, path] of protectedRoutes) {
    const r = await req(path, { method });
    if (r.status === 200) {
      add('HIGH', `Ruta protegida accesible sin autenticación: ${method} ${path}`,
        `Devolvió 200 sin token. Posible exposición de datos sensibles.`, { status: r.status, sample: short(r.text) });
    } else if (r.status === 401 || r.status === 403) {
      add('OK', `Protegida ${path} exige auth`, `status ${r.status}`, {});
    } else {
      add('INFO', `Respuesta inesperada en ${path}`, `status ${r.status}`, { sample: short(r.text) });
    }
  }

  // Token con alg:none intentando escalar a admin
  const noneTok = forgeToken({ id: 'aaaaaaaaaaaaaaaaaaaaaaaa', email: 'x@x', role: 'admin', tv: 0 }, 'none');
  const rNone = await req('/api/auth/me', { headers: { Authorization: `Bearer ${noneTok}` } });
  if (rNone.status === 200) add('CRIT', 'JWT alg:none aceptado', 'Un token sin firma fue aceptado en /api/auth/me → bypass total de auth.', { status: rNone.status });
  else add('OK', 'JWT alg:none rechazado', `status ${rNone.status}`, {});

  // Token basura
  const rGarbage = await req('/api/auth/me', { headers: { Authorization: 'Bearer not.a.jwt' } });
  add(rGarbage.status === 401 ? 'OK' : 'INFO', 'Token inválido en /auth/me', `status ${rGarbage.status}`, {});
}

// ── 5. Inyección NoSQL en login ─────────────────────────────────────────────
async function checkNoSqlInjection() {
  const payloads = [
    { email: { $gt: '' }, password: { $gt: '' } },
    { email: { $ne: null }, password: { $ne: null } },
    { email: 'admin@x.com', password: { $gt: '' } },
  ];
  for (const body of payloads) {
    const r = await req('/api/auth/login', { method: 'POST', body });
    if (r.status === 200 && /token/i.test(r.text)) {
      add('CRIT', 'Inyección NoSQL en login exitosa', `El operador ${JSON.stringify(body)} devolvió un token → bypass de autenticación.`, { status: r.status, sample: short(r.text) });
    } else {
      add('OK', 'Login resiste operador NoSQL', `${JSON.stringify(body)} → status ${r.status}`, {});
    }
  }
}

// ── 6. Info disclosure / verbosidad de errores ──────────────────────────────
async function checkInfoDisclosure() {
  const health = await req('/api/health');
  const health2 = await req('/health');
  const envLeak = /"env"\s*:/.test(health.text) || /"env"\s*:/.test(health2.text);
  if (envLeak) add('LOW', 'Health check divulga entorno', 'El endpoint /health o /api/health expone NODE_ENV u otra metadata.', { sample: short(health.text || health2.text) });

  // 404 y error shape
  const notFound = await req('/api/ruta-inexistente-xyz');
  const leakStack = /at\s+\w+.*\(.*:\d+:\d+\)/.test(notFound.text) || /Error:.*\n\s+at /.test(notFound.text);
  if (leakStack) add('MED', 'Stack trace en respuesta de error', 'Una respuesta de error incluyó un stack trace (útil para un atacante).', { sample: short(notFound.text, 300) });
  else add('OK', 'Errores sin stack trace', `404 shape: ${short(notFound.text)}`, {});
}

// ── 7. /uploads: path traversal + sniffing ──────────────────────────────────
async function checkUploads() {
  const traversals = [
    '/uploads/../../../../etc/passwd',
    '/uploads/..%2f..%2f..%2f..%2fetc%2fpasswd',
    '/uploads/%2e%2e/%2e%2e/etc/passwd',
    '/uploads/....//....//etc/passwd',
  ];
  for (const p of traversals) {
    const r = await req(p);
    if (r.status === 200 && /root:.*:0:0:/.test(r.text)) {
      add('CRIT', 'Path traversal en /uploads', `${p} devolvió /etc/passwd.`, { status: r.status, sample: short(r.text, 120) });
    }
  }
  // nosniff en assets subidos: probar un archivo real si existe
  const listing = await req('/uploads/');
  add('INFO', 'Comprobación /uploads/', `GET /uploads/ → status ${listing.status} (200 = directory listing habilitado, revisar).`, { status: listing.status });
}

// ── 8. Enumeración de usuarios (timing + oracle) ────────────────────────────
async function checkEnumeration() {
  // check-phone es un oráculo explícito {exists:bool}; validar throttling
  const cp = await req('/api/auth/check-phone', { method: 'POST', body: { phone: '+56900000000' } });
  if (cp.status === 200 && /exists/.test(cp.text)) {
    add('LOW', 'check-phone es un oráculo de enumeración', 'POST /api/auth/check-phone devuelve {exists:bool}. Tiene rate-limit (10/15min) pero sigue permitiendo enumerar teléfonos registrados.', { sample: short(cp.text) });
  }
}

// ── deep: IDOR (crea datos) ─────────────────────────────────────────────────
async function checkDeepIdor() {
  // Trae un producto para armar una orden guest y verificar controles de lectura
  const prods = await req('/api/products/parents?limit=1');
  let productId;
  try { productId = JSON.parse(prods.text)?.data?.data?.[0]?._id || JSON.parse(prods.text)?.data?.[0]?._id; } catch { /* noop */ }
  if (!productId) { add('INFO', '[deep] No se pudo obtener un producto', 'Se omite la prueba de IDOR de órdenes.', {}); return; }

  const order = await req('/api/orders', {
    method: 'POST',
    body: {
      customer: { name: 'Scan Test', phone: '+56911111111' },
      items: [{ productId, quantity: 1 }],
      deliveryMethod: 'pickup',
      paymentMethod: 'cash',
    },
  });
  let orderId, orderNumber;
  try { const d = JSON.parse(order.text)?.data; orderId = d?.order?._id || d?._id; orderNumber = d?.order?.orderNumber || d?.orderNumber; } catch { /* noop */ }
  add('INFO', '[deep] Orden de prueba creada', `status ${order.status}, id=${orderId}, number=${orderNumber}`, { status: order.status });

  if (orderId) {
    const readNoAuth = await req(`/api/orders/${orderId}`);
    if (readNoAuth.status === 200) add('HIGH', '[deep] IDOR: orden legible sin auth por ID', `GET /api/orders/${orderId} devolvió 200 sin token.`, { status: readNoAuth.status });
    else add('OK', '[deep] GET /orders/:id exige control', `status ${readNoAuth.status}`, {});
  }
}

// ── run ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔎 Escaneo de seguridad activo → ${BASE}  ${DEEP ? '(--deep)' : ''}\n`);
  const up = await req('/api/health');
  if (up.error || up.status === 0) {
    console.error(`❌ No se pudo alcanzar ${BASE}. ¿La VM está encendida y la IP es correcta?`);
    process.exit(1);
  }
  await checkHeaders();
  await checkCors();
  await checkRateLimitBypass();
  await checkAuthz();
  await checkNoSqlInjection();
  await checkInfoDisclosure();
  await checkUploads();
  await checkEnumeration();
  if (DEEP) await checkDeepIdor();

  // ── report ──
  const order = ['CRIT', 'HIGH', 'MED', 'LOW', 'INFO', 'OK'];
  findings.sort((a, b) => order.indexOf(a.sev) - order.indexOf(b.sev));
  const icon = { CRIT: '🟥', HIGH: '🟧', MED: '🟨', LOW: '🟦', INFO: '⬜', OK: '✅' };
  const counts = {};
  for (const f of findings) counts[f.sev] = (counts[f.sev] || 0) + 1;

  console.log('─'.repeat(72));
  for (const f of findings) {
    if (f.sev === 'OK') continue; // resumen: ocultar OKs (van en el JSON)
    console.log(`${icon[f.sev]} [${SEV[f.sev]}] ${f.title}`);
    console.log(`   ${short(f.detail, 280)}`);
  }
  console.log('─'.repeat(72));
  console.log('Resumen:', order.filter((s) => counts[s]).map((s) => `${SEV[s]}=${counts[s]}`).join('  '));

  writeFileSync(JSON_OUT, JSON.stringify({ base: BASE, deep: DEEP, at: new Date().toISOString(), counts, findings }, null, 2));
  console.log(`\n📄 Evidencia completa (incluye OKs): ${JSON_OUT}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
