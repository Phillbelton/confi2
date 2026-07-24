// Auditoría UX del panel admin: captura screenshots (desktop + mobile,
// viewport y página completa) de TODAS las vistas de /admin/** y
// /funcionario/**, con sesión real vía API, y registra errores de consola
// y requests fallidas por ruta en _audit-log.json.
//
// Uso: node scripts/admin-audit-shots.mjs
// Env: BASE_URL (front), API_URL (back), OUT_DIR (carpeta destino)
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || 'http://localhost:53750';
const API = process.env.API_URL || 'http://localhost:5000/api';
const OUT = process.env.OUT_DIR || path.join(__dirname, '..', 'audit-shots');

// Usuario funcionario de pruebas (se crea si no existe; queda para e2e de RBAC)
const FUNC_EMAIL = 'funcionario.e2e@quelita.cl';
const FUNC_PASS = 'Funci0nario.E2E!2026';

fs.mkdirSync(OUT, { recursive: true });
const SESSION_CACHE = path.join(OUT, '.audit-session.json');

function readAdminCreds() {
  const envFile = fs.readFileSync(path.join(__dirname, '..', '..', 'backend', '.env'), 'utf8');
  const get = (k) => envFile.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]?.trim();
  const email = get('DEFAULT_ADMIN_EMAIL');
  const password = get('DEFAULT_ADMIN_PASSWORD');
  if (!email || !password) throw new Error('backend/.env sin DEFAULT_ADMIN_EMAIL/PASSWORD');
  return { email, password };
}

async function api(pathname, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function login(creds) {
  const { status, json } = await api('/auth/login', { method: 'POST', body: creds });
  if (status !== 200) {
    throw new Error(`login ${creds.email} → ${status}: ${JSON.stringify(json).slice(0, 200)}`);
  }
  return json.data; // { token, user }
}

// El login tiene rate-limit agresivo → cachear sesiones entre corridas.
async function getSessions() {
  try {
    const cached = JSON.parse(fs.readFileSync(SESSION_CACHE, 'utf8'));
    if (Date.now() - cached.at < 1000 * 60 * 60 * 6) {
      const me = await api('/auth/me', { token: cached.admin.token });
      if (me.status === 200) return cached;
    }
  } catch { /* sin caché */ }

  const admin = await login(readAdminCreds());

  let func = null;
  try {
    func = await login({ email: FUNC_EMAIL, password: FUNC_PASS });
  } catch {
    const create = await api('/users', {
      method: 'POST',
      token: admin.token,
      body: { name: 'Funcionario E2E', email: FUNC_EMAIL, password: FUNC_PASS, role: 'funcionario' },
    });
    if (create.status < 400) {
      func = await login({ email: FUNC_EMAIL, password: FUNC_PASS });
    } else {
      console.warn(`No se pudo crear funcionario E2E: ${create.status} ${JSON.stringify(create.json).slice(0, 200)}`);
    }
  }

  const sessions = { at: Date.now(), admin, func };
  fs.writeFileSync(SESSION_CACHE, JSON.stringify(sessions, null, 2));
  return sessions;
}

// Extrae el primer elemento de las formas de respuesta paginada del backend
function firstOf(json) {
  const d = json?.data ?? json;
  if (Array.isArray(d)) return d[0];
  for (const k of ['data', 'products', 'orders', 'banners', 'items', 'users', 'docs']) {
    if (Array.isArray(d?.[k])) return d[k][0];
  }
  return undefined;
}

async function resolveIds(adminToken) {
  const ids = {};
  // Producto: preferir el demo con 3 presentaciones para auditar el form de edición
  const demo = await api('/products/slug/cabrita-caramelo-fruna-200gr');
  ids.product = demo.json?.data?._id ?? demo.json?.data?.product?._id;
  if (!ids.product) {
    const list = await api('/products?limit=1');
    ids.product = firstOf(list.json)?._id;
  }
  const orders = await api('/orders?limit=1', { token: adminToken });
  ids.order = firstOf(orders.json)?._id;
  const banners = await api('/banners', { token: adminToken });
  ids.banner = firstOf(banners.json)?._id;
  return ids;
}

const VIEWPORTS = {
  d: { viewport: { width: 1440, height: 900 } },
  m: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

// session: 'admin' | 'func' | 'anon' | 'func-en-admin' (probe RBAC: token de
// funcionario inyectado en las claves del portal ADMIN)
const ROUTES = (ids) => [
  ['01-dashboard', '/admin', 'admin'],
  ['02-productos', '/admin/productos', 'admin'],
  ['03-productos-nuevo', '/admin/productos/nuevo', 'admin'],
  ids.product && ['04-productos-editar', `/admin/productos/${ids.product}/editar`, 'admin'],
  ['05-productos-v2', '/admin/productos-v2', 'admin'],
  ['06-productos-nuevo-v2', '/admin/productos/nuevo-v2', 'admin'],
  ['07-ordenes', '/admin/ordenes', 'admin'],
  ids.order && ['08-ordenes-detalle', `/admin/ordenes/${ids.order}`, 'admin'],
  ['09-categorias', '/admin/categorias', 'admin'],
  ['10-marcas', '/admin/marcas', 'admin'],
  ['11-colecciones', '/admin/colecciones', 'admin'],
  ['12-banners', '/admin/banners', 'admin'],
  ['13-banners-new', '/admin/banners/new', 'admin'],
  ids.banner && ['14-banners-edit', `/admin/banners/${ids.banner}`, 'admin'],
  ['15-apariencia', '/admin/apariencia', 'admin'],
  ['16-usuarios', '/admin/usuarios', 'admin'],
  ['17-reportes', '/admin/reportes', 'admin'],
  ['18-importar', '/admin/importar', 'admin'],
  ['19-auditoria', '/admin/auditoria', 'admin'],
  ['20-formatos-huerfana', '/admin/formatos', 'admin'],
  ['21-sabores-huerfana', '/admin/sabores', 'admin'],
  ['22-admin-login', '/admin/login', 'anon'],
  ['23-func-login', '/funcionario/login', 'anon'],
  ['24-func-dashboard', '/funcionario', 'func'],
  ['25-func-ordenes', '/funcionario/ordenes', 'func'],
  ['26-func-pendientes', '/funcionario/ordenes/pendientes', 'func'],
  ids.order && ['27-func-orden-detalle', `/funcionario/ordenes/${ids.order}`, 'func'],
  ['28-rbac-func-en-admin', '/admin/productos', 'func-en-admin'],
].filter(Boolean);

// Abortar temprano si el frontend no está arriba (evita 50 capturas vacías)
await fetch(BASE, { method: 'HEAD' }).catch(() => {
  throw new Error(`frontend no responde en ${BASE}`);
});

const sessions = await getSessions();
if (!sessions.admin) throw new Error('sin sesión admin');
const ids = await resolveIds(sessions.admin.token);
console.log('ids resueltos:', ids);

const browser = await chromium.launch();
const log = [];

// Un contexto por combinación sesión×viewport (reusa página → 2ª visita rápida)
const ctxCache = new Map();
async function getPage(sessionKind, vp) {
  const key = `${sessionKind}-${vp}`;
  if (ctxCache.has(key)) return ctxCache.get(key);
  const ctx = await browser.newContext(VIEWPORTS[vp]);

  const inject = [];
  if (sessionKind === 'admin') inject.push(['admin', sessions.admin]);
  if (sessionKind === 'func' && sessions.func) inject.push(['funcionario', sessions.func]);
  if (sessionKind === 'func-en-admin' && sessions.func) inject.push(['admin', sessions.func]);
  for (const [prefix, session] of inject) {
    await ctx.addInitScript(
      ({ prefix, token, user }) => {
        localStorage.setItem(`${prefix}-token`, token);
        localStorage.setItem(
          `${prefix}-storage`,
          JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 })
        );
      },
      { prefix, token: session.token, user: session.user }
    );
  }

  const page = await ctx.newPage();
  const entry = { errors: [], failed: [] };
  page.on('console', (msg) => {
    if (msg.type() === 'error') entry.errors.push(msg.text().slice(0, 300));
  });
  page.on('pageerror', (err) => entry.errors.push(`pageerror: ${String(err).slice(0, 300)}`));
  page.on('response', (res) => {
    const url = res.url();
    if (res.status() >= 400 && !url.includes('_next') && !url.includes('favicon')) {
      entry.failed.push(`${res.status()} ${res.request().method()} ${url.replace(API, 'API')}`);
    }
  });
  const handle = { page, entry };
  ctxCache.set(key, handle);
  return handle;
}

for (const [slug, route, sessionKind] of ROUTES(ids)) {
  if ((sessionKind === 'func' || sessionKind === 'func-en-admin') && !sessions.func) {
    console.warn(`saltando ${slug} (sin sesión funcionario)`);
    continue;
  }
  for (const vp of ['d', 'm']) {
    const { page, entry } = await getPage(sessionKind, vp);
    entry.errors.length = 0;
    entry.failed.length = 0;
    const record = { slug, vp, route, finalUrl: '', title: '', errors: [], failed: [] };
    try {
      await page.goto(BASE + route, { waitUntil: 'load', timeout: 120_000 });
      await page.waitForTimeout(1500);
      // Esperar a que desaparezcan skeletons (shadcn usa animate-pulse)
      await page
        .waitForFunction(() => document.querySelectorAll('.animate-pulse').length === 0, { timeout: 12_000 })
        .catch(() => {});
      await page.waitForTimeout(800);
      record.finalUrl = page.url().replace(BASE, '');
      record.title = await page.title();
      await page.screenshot({ path: path.join(OUT, `${slug}--${vp}.jpg`), type: 'jpeg', quality: 60 });
      await page.screenshot({ path: path.join(OUT, `${slug}--${vp}-full.jpg`), type: 'jpeg', quality: 60, fullPage: true });
    } catch (err) {
      record.errors.push(`CAPTURA FALLÓ: ${String(err).slice(0, 300)}`);
    }
    record.errors.push(...entry.errors);
    record.failed.push(...entry.failed);
    log.push(record);
    const flags = [
      record.finalUrl && record.finalUrl !== route ? `→ ${record.finalUrl}` : '',
      record.errors.length ? `${record.errors.length} err` : '',
      record.failed.length ? `${record.failed.length} req✗` : '',
    ].filter(Boolean).join(' · ');
    console.log(`${slug} [${vp}] ok ${flags}`);
  }
}

fs.writeFileSync(path.join(OUT, '_audit-log.json'), JSON.stringify(log, null, 2));
console.log(`\nListo: ${log.length} capturas × 2 formatos en ${OUT}`);
await browser.close();
