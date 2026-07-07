import { Page, expect } from '@playwright/test';

// ============================================================================
// CONFITERIA QUELITA — E2E Test Helpers
// ============================================================================

/**
 * Wait for the product grid to finish loading (skeletons gone, cards visible).
 * Returns true if products were found, false if catalog is empty.
 */
export async function waitForProductGrid(page: Page): Promise<boolean> {
  // Wait for either product cards OR the "no products" message.
  // ⚠️ No usar `.group.relative`: el pill del buscador del navbar también lleva
  // esas clases y en desktop el primero del DOM está oculto → waitForSelector
  // (que mira el PRIMER match) se colgaba aunque la grilla estuviera cargada.
  try {
    await page.waitForSelector('[data-testid="product-card"]', {
      state: 'visible',
      timeout: 15000,
    });
    return true;
  } catch {
    // Check if catalog shows empty state
    const empty = await page.locator('text=/No encontramos productos/i').isVisible().catch(() => false);
    if (empty) return false;
    throw new Error('Product grid did not load and no empty state found');
  }
}

/**
 * Wait for page navigation to settle (Next.js client-side transition).
 */
export async function waitForNavigation(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 10000 });
}

/**
 * Get the current URL search params as a plain object.
 */
export function getSearchParams(page: Page): URLSearchParams {
  const url = new URL(page.url());
  return url.searchParams;
}

/**
 * Add a product to the cart from the catalog grid.
 * Clicks the first visible "Agregar" button on a product card.
 * The button has no aria-label — it's a <Button> with text "Agregar" and a ShoppingCart icon.
 */
export async function addFirstProductToCart(page: Page) {
  const addButton = page
    .locator('[data-testid="product-card"]')
    .first()
    .locator('button')
    .filter({ hasText: 'Agregar' });
  await addButton.waitFor({ state: 'visible', timeout: 10000 });
  await addButton.click();
}

/**
 * Get the cart item count from the header badge.
 * El header trae DOS markups del link Carrito (mobile y desktop; uno oculto
 * por breakpoint) → se busca el span numérico VISIBLE.
 */
export async function getCartBadgeCount(page: Page): Promise<number> {
  const badges = page
    .locator('header a[href="/carrito"] span')
    .filter({ hasText: /^\d+\+?$/ });
  const n = await badges.count();
  for (let i = 0; i < n; i++) {
    const badge = badges.nth(i);
    if (await badge.isVisible().catch(() => false)) {
      const parsed = parseInt((await badge.textContent()) ?? '', 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return 0;
}

/**
 * Open the cart PAGE via the header link. El "cart sheet" ([role=dialog]) ya
 * no existe: el carrito del sitio rediseñado es la ruta /carrito.
 */
export async function openCartPage(page: Page) {
  const links = page.locator('header a[href="/carrito"]');
  const n = await links.count();
  for (let i = 0; i < n; i++) {
    const link = links.nth(i);
    if (await link.isVisible().catch(() => false)) {
      await link.click();
      break;
    }
  }
  // 20s: en dev el primer hit a /carrito compila la ruta (Turbopack) y puede
  // demorar >10s, sobre todo con los proyectos desktop+mobile en paralelo.
  await page.waitForURL('**/carrito', { timeout: 20000 });
}

/**
 * Clear cart via localStorage (useful for test setup).
 */
export async function clearCart(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('quelita-cart'); // key legacy (carrito viejo)
    localStorage.removeItem('quelita-cart-m'); // key REAL del carrito actual
  });
}

/**
 * Clear auth state via localStorage (useful for test setup).
 */
export async function clearAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('client-storage');
    localStorage.removeItem('client-token');
    localStorage.removeItem('admin-token');
  });
}

/**
 * Loguea a un usuario vía API directa (sin pasar por el form de UI) e inyecta
 * el JWT + estado del store en `localStorage` antes de cargar ninguna página.
 * Devuelve el user para hacer asserts. Lanza si el backend responde no-200.
 *
 * Útil para tests que necesitan flow autenticado (mis-ordenes, perfil, etc).
 * Requiere que el backend esté corriendo en API_URL (default localhost:5000).
 */
export async function loginAsClient(
  page: Page,
  creds: { email: string; password: string }
) {
  const apiUrl = process.env.API_URL || 'http://localhost:5000/api';
  const res = await page.request.post(`${apiUrl}/auth/login`, {
    data: creds,
    headers: { 'Content-Type': 'application/json' },
  });
  expect(res.ok(), `login API falló: ${res.status()} ${await res.text()}`).toBeTruthy();
  const { data } = (await res.json()) as {
    data: { token: string; user: { id: string; name: string; email: string; role: string } };
  };

  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('client-token', token);
    localStorage.setItem(
      'client-storage',
      JSON.stringify({
        state: {
          user,
          isAuthenticated: true,
          isLoading: false,
          _hasHydrated: true,
        },
        version: 0,
      })
    );
  }, { token: data.token, user: data.user });

  return data.user;
}

/**
 * Navigate to catalog and wait for products to load.
 * Returns true if products exist, false if catalog is empty.
 */
export async function goToCatalog(page: Page): Promise<boolean> {
  await page.goto('/productos');
  return await waitForProductGrid(page);
}

/**
 * Count visible product cards on the page.
 */
export async function countProductCards(page: Page): Promise<number> {
  return page.locator('[data-testid="product-card"]').count();
}

/**
 * Check if catalog has products. If not, skip the test.
 * Use at the start of tests that require products.
 */
export async function requireProducts(page: Page, hasProducts: boolean) {
  if (!hasProducts) {
     
    console.warn('Catalog is empty (possibly rate-limited). Skipping test.');
  }
  expect(hasProducts, 'Catalog must have products (API may be rate-limited)').toBe(true);
}
