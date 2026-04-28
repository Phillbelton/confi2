import { Page, expect } from '@playwright/test';

// ============================================================================
// CONFITERIA QUELITA — E2E Test Helpers
// ============================================================================

/**
 * Wait for the product grid to finish loading (skeletons gone, cards visible).
 * Returns true if products were found, false if catalog is empty.
 */
export async function waitForProductGrid(page: Page): Promise<boolean> {
  // Wait for either product cards OR the "no products" message
  try {
    await page.waitForSelector('.group.relative, [data-testid="product-card"]', {
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
  const addButton = page.locator('.group.relative').first().locator('button').filter({ hasText: 'Agregar' });
  await addButton.waitFor({ state: 'visible', timeout: 10000 });
  await addButton.click();
}

/**
 * Get the cart item count from the header badge.
 * Badge is a <Badge> component with classes `absolute -top-1 -right-1 h-5 min-w-5`.
 */
export async function getCartBadgeCount(page: Page): Promise<number> {
  const badge = page.locator('header').locator('.absolute.-top-1.-right-1').first();
  try {
    await badge.waitFor({ state: 'visible', timeout: 3000 });
    const text = await badge.textContent();
    return text ? parseInt(text, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Open the cart sheet via header button.
 * Desktop: button with text "Carrito"; Mobile: ShoppingCart icon button (no text).
 * Both are inside the header.
 */
export async function openCartSheet(page: Page) {
  // Try desktop button first (has "Carrito" text), then fall back to mobile icon button
  const desktopCartBtn = page.locator('header').locator('button').filter({ hasText: 'Carrito' }).first();
  const mobileCartBtn = page.locator('header').locator('button.relative').filter({ has: page.locator('svg') }).first();

  if (await desktopCartBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await desktopCartBtn.click();
  } else {
    // On mobile, the cart button is the one with ShoppingCart icon and relative positioning (for badge)
    // It's inside the mobile header's button group
    await mobileCartBtn.click();
  }

  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5000 });
}

/**
 * Clear cart via localStorage (useful for test setup).
 */
export async function clearCart(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('quelita-cart');
  });
}

/**
 * Clear auth state via localStorage (useful for test setup).
 */
export async function clearAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('client-storage');
  });
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
  return page.locator('.group.relative').count();
}

/**
 * Check if catalog has products. If not, skip the test.
 * Use at the start of tests that require products.
 */
export async function requireProducts(page: Page, hasProducts: boolean) {
  if (!hasProducts) {
    // eslint-disable-next-line no-console
    console.warn('Catalog is empty (possibly rate-limited). Skipping test.');
  }
  expect(hasProducts, 'Catalog must have products (API may be rate-limited)').toBe(true);
}
