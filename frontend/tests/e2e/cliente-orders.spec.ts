/**
 * E2E del flow autenticado de cliente:
 *  - listar pedidos en /mis-ordenes (caza el bug de "Error al cargar pedidos"
 *    que aparecía cuando un admin se logueaba por /login)
 *  - rechazo de roles incorrectos (admin/funcionario no pueden usar el
 *    storefront, ni desde /login ni con un token contaminado en localStorage)
 *  - botón "Cerrar sesión" en /perfil
 *
 * Requiere backend corriendo en API_URL (default http://localhost:5000/api) y
 * un cliente E2E ya seeded. Por defecto:
 *   E2E_CLIENT_EMAIL=testcliente.misordenes@quelita.cl
 *   E2E_CLIENT_PASS=TestPass123!
 *
 * Si no existe, registralo con:
 *   curl -X POST http://localhost:5000/api/auth/register \
 *     -H 'Content-Type: application/json' \
 *     -d '{"name":"E2E Cliente","email":"testcliente.misordenes@quelita.cl","phone":"+56912345678","password":"TestPass123!","role":"cliente"}'
 */

import { test, expect } from '@playwright/test';
import { loginAsClient, clearAuth } from './helpers';

const CLIENT_CREDS = {
  email: process.env.E2E_CLIENT_EMAIL || 'testcliente.misordenes@quelita.cl',
  password: process.env.E2E_CLIENT_PASS || 'TestPass123!',
};

// Opcional: para los tests de rechazo de admin. Si no se setea, esos tests
// se skipean (no rompen la suite por falta de credencial).
const ADMIN_CREDS = process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASS
  ? { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASS }
  : null;

test.describe('Cliente — /mis-ordenes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/'); // página neutra para poder limpiar storage
    await clearAuth(page);
  });

  test('logueado: NO muestra "Error al cargar pedidos"', async ({ page }) => {
    await loginAsClient(page, CLIENT_CREDS);
    await page.goto('/mis-ordenes');

    // El bug que originó esta suite: este texto NO debería aparecer nunca
    // para un cliente legítimo (haya órdenes o no).
    await expect(
      page.getByText(/Error al cargar pedidos/i)
    ).not.toBeVisible({ timeout: 8_000 });

    // Estado válido: o el empty state, o el listado real.
    const empty = page.getByText(/Aún no tienes pedidos|Sin resultados/i);
    const card = page.locator('a[href^="/mis-ordenes/"]').first();
    await expect(empty.or(card)).toBeVisible({ timeout: 10_000 });
  });

  test('respuesta de /orders/my-orders es 200 con shape esperado', async ({ page }) => {
    await loginAsClient(page, CLIENT_CREDS);

    const respPromise = page.waitForResponse(
      (r) => r.url().includes('/api/orders/my-orders') && r.request().method() === 'GET',
      { timeout: 10_000 }
    );
    await page.goto('/mis-ordenes');
    const resp = await respPromise;

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data?.orders)).toBe(true);
  });

  test('sin token → /mis-ordenes redirige a /login', async ({ page }) => {
    await page.goto('/mis-ordenes');
    await page.waitForURL(/\/login/, { timeout: 5_000 });
  });
});

test.describe('Cliente — guard de rol en /login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAuth(page);
  });

  test('admin que intenta loguearse por /login es rechazado', async ({ page }) => {
    test.skip(!ADMIN_CREDS, 'E2E_ADMIN_EMAIL/PASS no configuradas');

    await page.goto('/login');
    await page.fill('input[type=email]', ADMIN_CREDS!.email);
    await page.fill('input[type=password]', ADMIN_CREDS!.password);
    await page.click('button[type=submit]');

    // Capa 1: useClientLogin rechaza y muestra toast
    await expect(
      page.getByText(/cuenta es de administrador|cuenta de administrador/i)
    ).toBeVisible({ timeout: 5_000 });

    // No debió guardar el token
    const hasClientToken = await page.evaluate(
      () => !!localStorage.getItem('client-token')
    );
    expect(hasClientToken).toBe(false);

    // Sigue en /login (no redirigió al perfil)
    expect(page.url()).toMatch(/\/login/);
  });

  test('token contaminado de admin en localStorage → kicked con ?error=role', async ({ page, request }) => {
    test.skip(!ADMIN_CREDS, 'E2E_ADMIN_EMAIL/PASS no configuradas');

    // Obtener token admin vía API
    const apiUrl = process.env.API_URL || 'http://localhost:5000/api';
    const res = await request.post(`${apiUrl}/auth/login`, {
      data: ADMIN_CREDS!,
      headers: { 'Content-Type': 'application/json' },
    });
    const { data } = await res.json();

    // Inyectar el token admin en `client-token` (simula el bug)
    await page.addInitScript(({ token, user }) => {
      localStorage.setItem('client-token', token);
      localStorage.setItem(
        'client-storage',
        JSON.stringify({
          state: { user, isAuthenticated: true, isLoading: false, _hasHydrated: true },
          version: 0,
        })
      );
    }, { token: data.token, user: data.user });

    // Capa 2: layout debe detectar role !== 'cliente' y patear con flag
    await page.goto('/mis-ordenes');
    await page.waitForURL(/\/login\?error=role/, { timeout: 5_000 });
    await expect(
      page.getByText(/no tiene acceso al portal de clientes/i)
    ).toBeVisible();

    // Y limpió el storage
    const tokenAfter = await page.evaluate(
      () => localStorage.getItem('client-token')
    );
    expect(tokenAfter).toBeNull();
  });
});

test.describe('Cliente — /perfil logout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAuth(page);
  });

  test('botón "Cerrar sesión" cierra y patea a la home', async ({ page }) => {
    await loginAsClient(page, CLIENT_CREDS);
    await page.goto('/perfil');

    const logoutBtn = page.getByRole('button', { name: /cerrar sesión/i });
    await expect(logoutBtn).toBeVisible({ timeout: 8_000 });
    await logoutBtn.click();

    // Logout redirige a /
    await page.waitForURL((url) => url.pathname === '/', { timeout: 5_000 });

    // Y limpió el token
    const tokenAfter = await page.evaluate(
      () => localStorage.getItem('client-token')
    );
    expect(tokenAfter).toBeNull();
  });
});
