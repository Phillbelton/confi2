import { test, expect, type Page, type Locator } from '@playwright/test';
import { clearAuth } from './helpers';

// ============================================================================
// CHECKOUT — E2E HAPPY PATH COMPLETO (crea la orden de verdad)
//
// A diferencia de checkout.spec.ts (sólo UI del form), este spec recorre el
// flujo entero de un invitado hasta que el backend crea la orden y el sitio
// muestra la confirmación en /pedido/<orderNumber>.
//
// Usa selectores robustos propios (el catálogo rediseñado —ProductCardM— dejó
// obsoleto el `.group.relative` del helper compartido, que ahora matchea otros
// elementos como el pill del buscador).
//
// ⚠️ Crea órdenes reales en la DB del entorno (BASE_URL). Nombres con "E2E
// Test" para identificarlas/limpiarlas después.
// ============================================================================

/** Click en el primer match VISIBLE (hay 2 botones "Confirmar Pedido": el de
 *  desktop en el resumen y el sticky de mobile; sólo uno es visible). */
async function clickFirstVisible(locator: Locator): Promise<boolean> {
  const n = await locator.count();
  for (let i = 0; i < n; i++) {
    const el = locator.nth(i);
    if (await el.isVisible().catch(() => false)) {
      await el.click();
      return true;
    }
  }
  return false;
}

/** Va al catálogo, agrega el primer producto y entra a /checkout como invitado
 *  navegando SIEMPRE por clicks (client-side): el store del carrito vive en
 *  memoria entre navegaciones SPA, así se evita la race de hidratación que
 *  hace que un hard-load de /checkout redirija a /productos (ver reporte).
 *  Devuelve false si el catálogo está vacío. */
async function startGuestCheckout(page: Page): Promise<boolean> {
  await page.goto('/productos', { waitUntil: 'domcontentloaded' });
  // Arrancar de carrito/sesión limpios (la key real del carrito es 'quelita-cart-m').
  await page.evaluate(() => {
    localStorage.removeItem('quelita-cart');
    localStorage.removeItem('quelita-cart-m');
  });
  await clearAuth(page);
  await page.reload({ waitUntil: 'domcontentloaded' });

  const productLink = page.locator('a[href^="/productos/"]');
  try {
    await productLink.first().waitFor({ state: 'visible', timeout: 20000 });
  } catch {
    return false; // catálogo vacío (rate-limit u otro)
  }

  // Agregar el primer producto con botón "Agregar" directo.
  const added = await clickFirstVisible(page.getByRole('button', { name: 'Agregar', exact: true }));
  expect(added, 'Debe haber un botón "Agregar" en el catálogo').toBe(true);
  await page.waitForTimeout(800);

  // Navegación cliente: header "Carrito" → /carrito
  expect(await clickFirstVisible(page.locator('a[href="/carrito"]')), 'Link a /carrito en el header').toBe(true);
  await page.waitForURL(/\/carrito/, { timeout: 10000 });
  await page.waitForTimeout(500);

  // Navegación cliente: "Ir a pagar" → /checkout (store preservado en memoria)
  expect(await clickFirstVisible(page.getByRole('link', { name: /Ir a pagar/ })), 'CTA "Ir a pagar" en /carrito').toBe(true);
  await page.waitForURL(/\/checkout/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  expect(page.url(), 'Debe llegar a /checkout con el carrito cargado').toContain('/checkout');

  await page.getByText('Continuar como invitado').click();
  await page.waitForTimeout(400);
  return true;
}

/** Envía el form y valida la pantalla de confirmación. Devuelve el orderNumber. */
async function submitAndExpectConfirmation(page: Page): Promise<string> {
  const clicked = await clickFirstVisible(page.getByRole('button', { name: /Confirmar Pedido/ }));
  expect(clicked, 'Debe haber un botón "Confirmar Pedido" visible').toBe(true);

  await page.waitForURL(/\/pedido\/.+/, { timeout: 25000 });
  await expect(page.getByText('¡Pedido recibido!')).toBeVisible({ timeout: 10000 });

  const orderNumber = decodeURIComponent(new URL(page.url()).pathname.split('/').pop() || '');
  expect(orderNumber.length, 'La URL de confirmación debe traer un orderNumber').toBeGreaterThan(0);
  await expect(page.getByText(orderNumber, { exact: false }).first()).toBeVisible();
  return orderNumber;
}

test.describe('Checkout E2E — happy path completo', () => {
  test('invitado · retiro en local + efectivo → orden creada', async ({ page }) => {
    test.slow();
    const ok = await startGuestCheckout(page);
    expect(ok, 'El catálogo debe tener productos').toBe(true);

    await page.locator('input[name="name"]').fill('E2E Test Retiro');
    await page.locator('input[name="phone"]').fill('912345678'); // pickup + cash = defaults

    // El resumen muestra un total con formato CLP antes de enviar
    await expect(page.getByText('Total', { exact: true })).toBeVisible();
    await expect(page.locator('text=/\\$\\d/').first()).toBeVisible();

    const orderNumber = await submitAndExpectConfirmation(page);
    console.log('✅ orden creada (retiro/efectivo):', orderNumber);
  });

  test('invitado · delivery + transferencia (con dirección) → orden creada', async ({ page }) => {
    test.slow();
    const ok = await startGuestCheckout(page);
    expect(ok, 'El catálogo debe tener productos').toBe(true);

    await page.locator('input[name="name"]').fill('E2E Test Delivery');
    await page.locator('input[name="phone"]').fill('987654321');

    // Delivery → aparecen los campos de dirección (obligatorios)
    await page.locator('label[for="delivery"]').click();
    await expect(page.locator('input[name="street"]')).toBeVisible({ timeout: 3000 });
    await page.locator('input[name="street"]').fill('Av. Siempreviva');
    await page.locator('input[name="number"]').fill('742');
    await page.locator('input[name="city"]').fill('Santiago');

    // Pago por transferencia
    await page.locator('label[for="transfer"]').click();

    const orderNumber = await submitAndExpectConfirmation(page);
    console.log('✅ orden creada (delivery/transferencia):', orderNumber);
  });
});
