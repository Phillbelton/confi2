# Evaluación de seguridad — Quelita (2026-07-06)

**Alcance:** código del repo (rama `dev`) + despliegue en vivo de la VM de test
`http://192.168.6.14` (Mongo local, config de producción, Caddy). **Tipo:**
caja gris — lectura de código + pruebas activas autorizadas sobre entorno
propio. **Autor:** Claude (Fable) con Phillbelton.

> **Conclusión general: la postura de seguridad es SÓLIDA.** El backend ya
> aplica las defensas correctas (JWT endurecido, sanitización NoSQL/XSS,
> validación Zod, rate limiting, IDOR con `canAccessOrder`, recálculo de
> precios server-side). **No se encontró ninguna vulnerabilidad crítica ni
> alta.** Lo que sigue son hallazgos **MEDIA / BAJA / INFO** — endurecimientos,
> no agujeros abiertos — con su remediación. Al final hay una lista de lo que
> se **verificó seguro** (y quedó cubierto por tests de regresión).

## Tabla de hallazgos

| # | Severidad | Hallazgo | Estado |
|---|-----------|----------|--------|
| 1 | 🟡 MEDIA | Páginas de usuario (front) sin headers de seguridad (CSP/X-Frame-Options/HSTS/nosniff) | Confirmado en vivo |
| 2 | 🟡 MEDIA | Bypass del rate-limit global vía claim `role` de un JWT no verificado | Confirmado en vivo |
| 3 | 🟡 MEDIA | Dependencias con CVEs (10: 5 high / 5 moderate), incluyendo el propio `dompurify` | Confirmado (`npm audit`) |
| 4 | 🔵 BAJA | Regex injection / potencial ReDoS en búsquedas con `$regex` sin escapar | Confirmado por test |
| 5 | 🔵 BAJA | Tokens (access + refresh 30d) en `localStorage` → robables por XSS | Confirmado en código |
| 6 | 🔵 BAJA | CORS: orígenes no permitidos devuelven 500; CORS permisivo latente en código | Confirmado en vivo |
| 7 | 🔵 BAJA | `/api/auth/refresh` sin rate limiter propio | Confirmado en código |
| 8 | 🔵 BAJA | `optionalAuth` confía en el `role` del JWT en vez de la DB | Confirmado en código |
| 9 | 🔵 BAJA | Divulgación de tecnología `X-Powered-By: Next.js` | Confirmado en vivo |
| 10 | ⚪ INFO | `xssSanitize` es fail-open ante error de DOMPurify | Confirmado en código |
| 11 | ⚪ INFO | `app.get('/health')` filtra `NODE_ENV` (NO expuesto tras Caddy) | Confirmado (no explotable hoy) |

---

## Detalle

### 1. 🟡 MEDIA — Las páginas del frontend no tienen headers de seguridad

**Evidencia (en vivo):**
```
$ curl -sI http://192.168.6.14/
# → sin Content-Security-Policy, sin X-Frame-Options, sin HSTS, sin X-Content-Type-Options
```
`helmet` está aplicado en el **backend Express** (`server.ts:31`), y sus headers
sí aparecen en `/api/*`. Pero el HTML de usuario lo sirve **Next.js/Caddy**, que
no pasa por helmet → las páginas que un usuario realmente visita quedan sin
protección.

**Impacto:** habilita **clickjacking** (la tienda y el admin se pueden embeber
en un `<iframe>` de un sitio atacante) y reduce la defensa contra XSS (sin CSP,
un script inyectado corre sin restricción). Se agrava con el hallazgo #5
(tokens en `localStorage`).

**Remediación (elegir una):**
- **En Caddy** (más simple, cubre todo): agregar un bloque `header { ... }` en el
  `Caddyfile` con `Content-Security-Policy`, `X-Frame-Options "DENY"`,
  `Strict-Transport-Security` (cuando haya HTTPS/dominio), `X-Content-Type-Options "nosniff"`,
  `Referrer-Policy "no-referrer"`.
- **En Next.js**: exportar `headers()` en `next.config.ts` con la misma lista.

Empezar con `X-Frame-Options: DENY` + `X-Content-Type-Options: nosniff` (bajo
riesgo de romper nada) y luego una CSP en modo `Report-Only` para ajustarla.

---

### 2. 🟡 MEDIA — Bypass del rate-limit global con un JWT forjado (no verificado)

El rate limiter global (`middleware/rateLimiter.ts`) decide el cupo y el bucket
leyendo el `role` del token con **`jwt.decode()` sin verificar la firma**
(`extractRoleFromToken`, línea 44). El middleware `authenticate` sí verifica —
pero corre **después** del limiter, así que para endpoints públicos el token
forjado nunca se valida.

**Evidencia (en vivo, `security/live-scan.mjs`):**
```
anónimo (sin token)         → RateLimit-Limit: 300
Bearer {role:"admin"}(fake) → RateLimit-Limit: 1000   ← cupo privilegiado sin credenciales
Bearer {role:"zz3ipn0z"}    → RateLimit-Limit: 500, Remaining: 499  ← bucket NUEVO por cada rol
```

**Impacto:** un atacante anónimo obtiene el cupo de admin (1000) con un token
inválido, y —peor— **rotando el valor de `role` consigue un bucket fresco por
cada string**, anulando en la práctica el límite en los endpoints públicos
(scraping del catálogo, martilleo general). No afecta el login: `/auth/login`
tiene su propio limiter por IP+email (`authRoutes.ts:37`) que no usa este truco.

**Remediación:** no confiar en un claim sin verificar para decidir el cupo. Opciones:
- Keyear el limiter global **solo por IP** (ignorar el rol) y dejar los cupos
  diferenciados para un segundo limiter **después** de `authenticate` (con
  `req.user` ya verificado).
- O verificar la firma en `extractRoleFromToken` (try `jwt.verify`; si falla,
  tratar como anónimo).

---

### 3. 🟡 MEDIA — Dependencias con vulnerabilidades conocidas

`npm audit` (backend, prod) reporta **10 vulnerabilidades (5 high, 5 moderate)**:

| Paquete | Sev | Problema |
|---------|-----|----------|
| `dompurify` ≤3.4.10 | moderate | **Varios bypasses de sanitización XSS** (es la librería que usa `xssSanitize`) |
| `nodemailer` ≤9.0.0 | high | Inyección de comandos SMTP, lectura de archivos, SSRF |
| `xlsx` (SheetJS) | high | Prototype pollution + ReDoS — **sin fix disponible en npm** |
| `ws` 8.x | high | Divulgación de memoria / DoS |
| `form-data` | high | CRLF injection |
| `cloudinary` <2.7.0 | high | Argument injection |
| `qs`/`express`, `uuid`/`exceljs` | moderate | DoS / bounds |

**Impacto:** el más relevante es **`dompurify`**, porque es exactamente la
defensa XSS en la que se apoya la app (#10). `nodemailer` es serio pero su
superficie depende de si se exponen inputs al envío de correo.

**Remediación:**
- `npm audit fix` (no-breaking) resuelve `dompurify`, `form-data`, `ws`, `qs`.
- `nodemailer@9` y `cloudinary@2` son breaking: planificar el upgrade + probar
  el envío de emails y la subida a Cloudinary (hoy `USE_CLOUDINARY=false`).
- `xlsx` no tiene fix: como solo se usa en importación de catálogo desde el
  admin (input confiable), el riesgo es acotado; migrar a `exceljs` (ya está
  instalado) o a la build oficial de SheetJS (fuera de npm) a mediano plazo.

---

### 4. 🔵 BAJA — Regex injection / potencial ReDoS en búsquedas

`userController.getUsers` (y otros buscadores) arman `{ $regex: search }` con el
input crudo del usuario (`controllers/userController.ts:29-32`).

**Evidencia (test `injection.test.ts`):** un `search=.*` matchea todos los
usuarios → confirma que los metacaracteres de regex **no se escapan**. Un
patrón de catastrophic backtracking (`(a+)+$`) hoy responde rápido porque el
dataset de test es chico.

**Impacto:** con una colección grande, un patrón malicioso puede causar **ReDoS**
(CPU al 100%, DoS). Es admin-only en `getUsers`, pero conviene revisar los
buscadores públicos de productos. Riesgo real bajo hoy, crece con el volumen.

**Remediación:** escapar el input antes de `$regex` (helper de escape de regex),
anclar con `^` para prefijo, o usar el índice de texto de Mongo
(`$text`/`searchText`, que el proyecto ya mantiene para el buscador).

---

### 5. 🔵 BAJA — Tokens en `localStorage`

El frontend guarda el access token **y el refresh token (30 días)** en
`localStorage` (documentado en `frontend/middleware.ts`; el `authController`
los devuelve en el body). Cualquier XSS puede exfiltrarlos, y el refresh largo
amplía la ventana.

**Impacto:** robo de sesión ante un XSS. Mitigado en parte porque la API ya
sanitiza XSS, pero **las páginas no tienen CSP** (#1) → la mitigación es
incompleta.

**Remediación:** preferir cookies `httpOnly` + `SameSite` para el token (el
código ya las emite en producción; el bloqueo era el deploy cross-domain de
Seenode, que con Caddy en un solo origen ya no aplica). Como mínimo, acortar el
refresh y priorizar el fix de CSP (#1).

---

### 6. 🔵 BAJA — Comportamiento de CORS

**En vivo:** un `Origin` no permitido devuelve **HTTP 500** (no un rechazo
limpio) porque el callback de `cors` lanza `new Error('Not allowed by CORS')`
que cae al error handler:
```
Origin: https://evil.com                 → 500
Origin: http://localhost:3000 (permitido) → 200 + ACAO reflejado
```
Además, la política permite cualquier IP LAN privada y cualquier
`*.trycloudflare.com` **con `credentials:true`** (`server.ts:47-84`).

> **⚠️ Actualización 2026-07-06 (post-redeploy de `main`):** tras redeployar,
> esto pasó de latente a **activo y confirmado en vivo** por `live-scan`:
> `Origin: https://random-attacker.trycloudflare.com` → `ACAO` reflejado +
> `Access-Control-Allow-Credentials: true`; ídem cualquier IP LAN
> (`http://192.168.6.99`). `trycloudflare.com` es un dominio de túnel
> **compartido y público**: cualquiera obtiene un subdominio y haría requests
> con credenciales cross-origin. (El redeploy **arregló el login** — ese era el
> objetivo — pero activó esta CORS permisiva.)

**Impacto:** ⚠️ **NO es cosmético — rompe funcionalidad.** El navegador manda
`Origin` en los POST **incluso al mismo origen**, así que cuando la IP de la VM
no está en la allowlist (build desplegado sin el fix `isPrivateLanHost`), el
`Origin: http://<ip>` dispara el 500 y **el login del admin falla con "error
interno del servidor"** (reproducido 2026-07-06: login sin Origin → 200; con
`Origin: http://192.168.6.14` → 500). Los GET de navegación siguen funcionando
porque no llevan `Origin`. Además, la política permisiva latente en el código
es un riesgo aparte: `*.trycloudflare.com` es un dominio de túnel **compartido y
público** — cualquiera podría hacer requests con credenciales cross-origin.

**Fix inmediato del login (VM, sin rebuild):** en `backend/.env.production`
poner `FRONTEND_URL=http://192.168.6.14` y `docker compose restart backend`
(agrega esa IP a la allowlist). **Fix definitivo:** redeployar el código actual
del repo (ya trae `isPrivateLanHost`, acepta cualquier IP LAN privada sin tocar
config). Y responder los orígenes no permitidos con 403 limpio en vez de lanzar
(que un origen desconocido no derribe la request con 500).

**Remediación:** responder los orígenes no permitidos con un 403 limpio (o
simplemente sin headers CORS) en vez de lanzar. Quitar `*.trycloudflare.com` de
la allowlist con `credentials:true` (o restringir a la URL de túnel vigente).

---

### 7. 🔵 BAJA — `/api/auth/refresh` sin rate limiter

`routes/authRoutes.ts:112` monta `/refresh` sin limiter propio (a diferencia de
login/registro/reset). No es brute-forceable (el refresh es un JWT firmado),
pero permite abusar de la emisión de access tokens.

**Remediación:** agregar un `createTestAwareRateLimiter` (p.ej. 20/15min por IP),
como ya se hace con los demás endpoints de auth.

---

### 8. 🔵 BAJA — `optionalAuth` usa el `role` del JWT

`middleware/auth.ts:156-160`: a diferencia de `authenticate` (que relee el rol
desde la DB), `optionalAuth` toma `role` directo del token. En rutas que lo usan
(creación de orden) un rol desactualizado persiste hasta que expira el token.

**Impacto:** bajo (esas rutas no toman decisiones sensibles según el rol).
**Remediación:** por consistencia, resolver el estado desde la DB (o al menos no
usar `role` de `optionalAuth` para autorización).

---

### 9. 🔵 BAJA — `X-Powered-By: Next.js`

El front expone la tecnología. **Remediación:** `poweredByHeader: false` en
`next.config.ts`.

---

### 10. ⚪ INFO — `xssSanitize` es fail-open

`middleware/xssSanitize.ts:28-33`: si DOMPurify lanza, el `catch` hace `next()`
sin sanitizar (fail-open). Un input que rompa DOMPurify pasaría crudo.
**Remediación:** en producción, fail-closed (rechazar con 400) o al menos loguear
y vaciar el campo.

### 11. ⚪ INFO — `app.get('/health')` filtra `NODE_ENV`

`server.ts:143-150` devuelve `env`. **No es explotable en el despliegue actual**
porque Caddy enruta `/health` (sin `/api`) al frontend, no al backend; solo
`/api/health` es alcanzable y ese **no** filtra el entorno. Queda como nota para
no exponerlo si cambia el ruteo.

---

## ✅ Verificado seguro (con tests de regresión)

Estas defensas se probaron y quedaron fijadas en `backend/src/__tests__/security/`:

- **Price tampering imposible** — el total se recalcula desde el `Product` en DB; los montos del cliente se ignoran. (`mass-assignment.test.ts`)
- **IDOR en órdenes y direcciones** — un cliente no puede leer/cancelar la orden de otro (404), ni tocar direcciones ajenas. (`object-idor.test.ts`)
- **Inyección NoSQL neutralizada** — operadores `$gt`/`$ne` en login y query params no bypassean auth ni ejecutan. (`injection.test.ts` + live-scan)
- **XSS almacenado sanitizado** — tags y handlers (`<script>`, `onerror`) se remueven antes de persistir. (`injection.test.ts`)
- **Mass-assignment bloqueado** — un cliente no se auto-promueve a admin ni cambia su email vía perfil. (`mass-assignment.test.ts`)
- **Headers helmet + CORS** en la API; orígenes maliciosos no se reflejan. (`headers-cors.test.ts`)
- **JWT endurecido** — rechaza `alg:none` (verificado en vivo y en `hardening.test.ts`), `tokenVersion` revoca sesiones.
- **Login sin enumeración** + defensa de timing (bcrypt siempre) + lockout por intentos.
- **Escalada de privilegios por `/register` bloqueada** (rol forzado a `cliente`).

## Entregables generados

| Archivo | Qué es |
|---------|--------|
| `security/live-scan.mjs` | Escáner activo de caja negra (headers, CORS, rate-limit, authz, inyección, enumeración). Reejecutable: `node security/live-scan.mjs http://192.168.6.14` |
| `security/scan-results.json` | Evidencia del último escaneo |
| `backend/src/__tests__/security/{injection,object-idor,mass-assignment,headers-cors}.test.ts` | Suites de regresión (23 tests, verdes) |
| `PERF-VM-REPORT.md` | Reporte de tiempos de carga / UX |
| `frontend/tests/performance/vm-report.spec.ts` | Spec Playwright de Web Vitals contra la VM |

## Priorización sugerida

1. **#2 (rate-limit)** y **#3 (`npm audit fix`)** — cambios chicos, alto valor.
2. **#1 (headers de front)** — un bloque en el `Caddyfile`; cierra clickjacking y refuerza #5.
3. **#4, #6, #7, #8, #9** — endurecimientos rápidos.
4. Reevaluar **#5** (cookies httpOnly) junto con #1.
