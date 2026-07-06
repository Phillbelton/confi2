import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// ============================================================================
// ADMIN — Creación de productos con todas las combinaciones de presentaciones
//
// Recorre el form real (/admin/productos/nuevo) creando un producto por cada
// combinación de presentaciones y SIEMPRE con 2 imágenes:
//   1. solo unidad          2. solo display          3. solo embalaje
//   4. unidad + display     5. unidad + embalaje     6. display + embalaje
//   7. unidad + display + embalaje (las tres)
//
// Verifica contra la API que el producto quedó con las presentaciones,
// cantidades, precios e imágenes correctas, y BORRA el producto al final
// (cleanup en afterEach, corre incluso si el test falla a mitad).
//
// Credenciales: E2E_ADMIN_EMAIL / E2E_ADMIN_PASS. Si no están seteadas, en
// local se leen DEFAULT_ADMIN_EMAIL/PASSWORD de ../backend/.env (el mismo
// admin que crea seed:admin). Sin credenciales, los tests se saltan.
//
// Correr:  npx playwright test admin-product-create --project=e2e-desktop
// (requiere backend en :5000 y frontend en :3000)
// ============================================================================

// 127.0.0.1 explícito: en Node reciente `localhost` puede resolver a ::1
// (IPv6) y el backend escucha solo IPv4 → ECONNREFUSED intermitente.
const API_URL = process.env.API_URL || 'http://127.0.0.1:5000/api';

const FIXTURES = [
  path.join(__dirname, 'fixtures', 'producto-1.png'),
  path.join(__dirname, 'fixtures', 'producto-2.png'),
];

type PresType = 'unidad' | 'display' | 'embalaje';

interface PresSpec {
  type: PresType;
  quantity: number;
  price: number;
}

interface Combo {
  id: string;
  titulo: string;
  principal: PresSpec;
  extras: PresSpec[];
}

const UNIDAD: PresSpec = { type: 'unidad', quantity: 1, price: 990 };
const DISPLAY: PresSpec = { type: 'display', quantity: 6, price: 5490 };
const EMBALAJE: PresSpec = { type: 'embalaje', quantity: 24, price: 19990 };

const COMBOS: Combo[] = [
  { id: 'solo-unidad', titulo: 'solo unidad', principal: UNIDAD, extras: [] },
  { id: 'solo-display', titulo: 'solo display', principal: DISPLAY, extras: [] },
  { id: 'solo-embalaje', titulo: 'solo embalaje', principal: EMBALAJE, extras: [] },
  { id: 'unidad-display', titulo: 'unidad + display', principal: UNIDAD, extras: [DISPLAY] },
  { id: 'unidad-embalaje', titulo: 'unidad + embalaje', principal: UNIDAD, extras: [EMBALAJE] },
  { id: 'display-embalaje', titulo: 'display + embalaje', principal: DISPLAY, extras: [EMBALAJE] },
  {
    id: 'unidad-display-embalaje',
    titulo: 'unidad + display + embalaje',
    principal: UNIDAD,
    extras: [DISPLAY, EMBALAJE],
  },
];

/** Etiquetas visibles de cada tipo (botones del bloque principal y opciones
 *  del select de presentaciones extra). */
const TYPE_LABELS: Record<PresType, string> = {
  unidad: 'Unidad',
  display: 'Display',
  embalaje: 'Embalaje',
};

// ── Credenciales ────────────────────────────────────────────────────────────

function resolveAdminCreds(): { email: string; password: string } | null {
  if (process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASS) {
    return { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASS };
  }
  // Fallback local: el admin por defecto del backend (seed:admin).
  try {
    const env = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'backend', '.env'), 'utf8');
    const get = (k: string) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]?.trim();
    const email = get('DEFAULT_ADMIN_EMAIL');
    const password = get('DEFAULT_ADMIN_PASSWORD');
    if (email && password) return { email, password };
  } catch {
    /* sin backend/.env — se salta la suite */
  }
  return null;
}

const ADMIN_CREDS = resolveAdminCreds();

interface AdminSession {
  token: string;
  user: Record<string, unknown>;
}

/**
 * Login por API — UNA sola vez por suite (beforeAll). El endpoint de login
 * tiene rate-limit agresivo (~5 intentos/15min por IP): loguearse por test
 * revienta el límite a mitad de la suite.
 */
async function getAdminSession(request: APIRequestContext): Promise<AdminSession> {
  const res = await request.post(`${API_URL}/auth/login`, {
    data: ADMIN_CREDS!,
    headers: { 'Content-Type': 'application/json' },
  });
  expect(res.ok(), `login admin falló: ${res.status()} ${await res.text()}`).toBeTruthy();
  const { data } = await res.json();
  expect(data.user.role).toBe('admin');
  return { token: data.token, user: data.user };
}

/** Inyecta la sesión admin (token + store zustand) antes de cargar la página.
 *  No llama a la API: reusa la sesión obtenida en beforeAll. */
async function loginAsAdmin(page: Page, session: AdminSession) {
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem('admin-token', token);
      localStorage.setItem(
        'admin-storage',
        JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 })
      );
    },
    session
  );
}

// ── Interacciones del form ──────────────────────────────────────────────────

/** Selecciona la primera categoría L1 disponible y la agrega como chip. */
async function pickFirstCategory(page: Page) {
  const clasif = page.locator('[data-slot="card"]', { hasText: 'Clasificación' });
  // Primer combobox del card = select L1 de categorías (la marca/formato van después)
  await clasif.getByRole('combobox').first().click();
  const firstOption = page.getByRole('option').first();
  const optionName = (await firstOption.textContent())?.trim() || '';
  await firstOption.click();
  // "Agregar" (exact) es el del selector de categorías; los otros botones del
  // form son "Agregar tramo" / "Agregar presentación".
  await clasif.getByRole('button', { name: 'Agregar', exact: true }).click();
  // Chip visible con la categoría agregada
  await expect(clasif.getByText(optionName).first()).toBeVisible();
}

/** Configura la presentación PRINCIPAL (bloque "Venta y precios"). */
async function fillPrincipal(page: Page, pres: PresSpec) {
  const venta = page.locator('[data-slot="card"]', { hasText: 'Venta y precios' });
  // Precio por unidad: primer input numérico del card
  await venta.locator('input[type="number"]').first().fill(String(pres.price));
  // Tipo de venta
  await venta.getByRole('button', { name: TYPE_LABELS[pres.type], exact: true }).click();
  // Cantidad de unidades (aparece solo para tipos distintos de "unidad")
  if (pres.type !== 'unidad') {
    const qty = venta.locator('input[placeholder="6"]');
    await expect(qty).toBeVisible();
    await qty.fill(String(pres.quantity));
  }
}

/** Agrega una presentación EXTRA en el repetidor "Otras presentaciones". */
async function addExtraPresentation(page: Page, index: number, pres: PresSpec) {
  await page.getByRole('button', { name: /Agregar presentación/ }).click();
  // Ojo: el selector incluye `space-y-3` para NO matchear el Card contenedor
  // (que también tiene rounded-xl + border y contiene el mismo texto).
  const block = page
    .locator('div.space-y-3.rounded-xl.border', { hasText: `Presentación ${index + 2}` })
    .first();
  await expect(block).toBeVisible();

  // Tipo (select Radix)
  await block.getByRole('combobox').first().click();
  await page.getByRole('option', { name: TYPE_LABELS[pres.type], exact: true }).click();

  // Unidades y precio: 1º y 2º input numérico del bloque
  const numbers = block.locator('input[type="number"]');
  if (pres.type !== 'unidad') {
    await numbers.nth(0).fill(String(pres.quantity));
  }
  await numbers.nth(1).fill(String(pres.price));
}

// ── Suite ───────────────────────────────────────────────────────────────────

test.describe('Admin — crear producto en todas las combinaciones de presentaciones', () => {
  test.skip(!ADMIN_CREDS, 'Sin credenciales admin (E2E_ADMIN_EMAIL/PASS o backend/.env)');
  // El form del admin es desktop-first; en mobile cambia el layout (sheet de
  // preview flotante) y no es el target de esta suite.
  test.skip(({ isMobile }) => !!isMobile, 'Suite solo desktop');

  let session: AdminSession;
  const createdIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    session = await getAdminSession(request);
  });

  test.afterEach(async ({ request }) => {
    // Cleanup: borrar los productos creados aunque el test haya fallado.
    while (createdIds.length > 0) {
      const id = createdIds.pop()!;
      const res = await request.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (!res.ok()) {
        console.warn(`⚠️  cleanup: no se pudo borrar el producto ${id} (${res.status()})`);
      }
    }
  });

  for (const combo of COMBOS) {
    test(`crea producto "${combo.titulo}" con 2 imágenes`, async ({ page, request }) => {
      test.setTimeout(90_000);
      await loginAsAdmin(page, session);

      await page.goto('/admin/productos/nuevo');
      await expect(page.locator('#name')).toBeVisible({ timeout: 15_000 });

      // ── Identificación ──
      const productName = `[E2E] ${combo.titulo} ${Date.now()}`;
      await page.locator('#name').fill(productName);
      await page
        .locator('#description')
        .fill(`Producto de prueba e2e (${combo.titulo}), creado automáticamente. Se borra solo.`);

      // ── Clasificación: primera categoría disponible ──
      await pickFirstCategory(page);

      // ── Presentación principal ──
      await fillPrincipal(page, combo.principal);

      // ── Presentaciones extra ──
      for (let i = 0; i < combo.extras.length; i++) {
        await addExtraPresentation(page, i, combo.extras[i]);
      }

      // ── 2 imágenes ──
      await page.locator('input[type="file"]').setInputFiles(FIXTURES);
      await expect(page.getByText('Imágenes (2/5)')).toBeVisible();

      // ── Guardar: esperar create + upload de imágenes + redirect ──
      const createRespPromise = page.waitForResponse(
        (r) =>
          r.url().includes('/api/products') &&
          !r.url().includes('/images') &&
          r.request().method() === 'POST',
        { timeout: 30_000 }
      );
      const uploadRespPromise = page.waitForResponse(
        (r) => /\/api\/products\/[^/]+\/images/.test(r.url()) && r.request().method() === 'POST',
        { timeout: 45_000 }
      );

      await page.getByRole('button', { name: /Crear producto/ }).click();

      const createResp = await createRespPromise;
      expect(createResp.status(), await createResp.text()).toBe(201);
      const createJson = await createResp.json();
      const product = createJson.data?.product ?? createJson.data;
      expect(product?._id, 'la respuesta de creación debe traer el producto').toBeTruthy();
      createdIds.push(product._id);

      const uploadResp = await uploadRespPromise;
      expect(uploadResp.ok(), await uploadResp.text()).toBeTruthy();

      // Redirige a la lista al terminar (create + upload OK)
      await page.waitForURL(/\/admin\/productos(\?|$)/, { timeout: 20_000 });

      // ── Verificación por API: presentaciones e imágenes persistidas ──
      const getResp = await request.get(`${API_URL}/products/${product._id}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      expect(getResp.ok(), await getResp.text()).toBeTruthy();
      const getJson = await getResp.json();
      const saved = getJson.data?.product ?? getJson.data;

      // Imágenes: exactamente las 2 subidas
      expect(saved.images, 'el producto debe tener 2 imágenes').toHaveLength(2);

      // Presentaciones: principal + extras, en tipos/cantidades/precios
      const presentaciones = saved.presentaciones ?? [];
      const expected = [combo.principal, ...combo.extras];
      expect(presentaciones).toHaveLength(expected.length);

      const principal = presentaciones.find((p: { principal?: boolean }) => p.principal);
      expect(principal, 'debe existir una presentación principal').toBeTruthy();
      expect(principal.type).toBe(combo.principal.type);
      expect(principal.quantity).toBe(combo.principal.quantity);
      expect(principal.unitPrice).toBe(combo.principal.price);

      for (const extra of combo.extras) {
        const match = presentaciones.find(
          (p: { type: string; principal?: boolean }) => p.type === extra.type && !p.principal
        );
        expect(match, `falta la presentación extra "${extra.type}"`).toBeTruthy();
        expect(match.quantity).toBe(extra.quantity);
        expect(match.unitPrice).toBe(extra.price);
      }

      // El nombre quedó como lo escribimos (sanity del form completo)
      expect(saved.name).toBe(productName);
    });
  }
});
