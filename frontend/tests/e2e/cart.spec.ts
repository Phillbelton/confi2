import { test, expect } from '@playwright/test';
import {
  goToCatalog,
  clearCart,
  openCartPage,
  addFirstProductToCart,
  requireProducts,
  getCartBadgeCount,
} from './helpers';

// ============================================================================
// CART — Add items, quantity management, página /carrito
//
// El sitio rediseñado NO tiene "cart sheet" ([role=dialog]): el carrito es la
// ruta /carrito (lista de [data-testid="cart-item"] + resumen + CTA "Ir a
// pagar"). El badge del header vive en el link a /carrito.
// ============================================================================

test.describe('Cart — Adding Products', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearCart(page);
  });

  test('adding product from catalog updates cart badge', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);
    await addFirstProductToCart(page);

    await expect
      .poll(() => getCartBadgeCount(page), { timeout: 5000 })
      .toBeGreaterThan(0);
  });

  test('adding product from detail page updates cart badge', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);

    // Navigate to first product detail
    const firstLink = page.locator('[data-testid="product-card"] a').first();
    await firstLink.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // El botón principal dice "Agregar al carrito" (o "Agregar N más")
    const addBtn = page.locator('button').filter({ hasText: /Agregar/ }).first();
    await addBtn.click();

    await expect
      .poll(() => getCartBadgeCount(page), { timeout: 5000 })
      .toBeGreaterThan(0);
  });

  test('adding same product twice increases quantity, not duplicates', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);
    await addFirstProductToCart(page);

    // Tras el primer add, la card cambia a stepper: el "+" (aria-label
    // "Agregar") suma sobre la MISMA línea.
    const plusBtn = page
      .locator('[data-testid="product-card"]')
      .first()
      .locator('button[aria-label="Agregar"]');
    await plusBtn.click();
    await page.waitForTimeout(300);

    await openCartPage(page);

    // Una sola línea, con cantidad acumulada (no dos líneas duplicadas).
    const items = page.locator('[data-testid="cart-item"]');
    await expect(items).toHaveCount(1);
    await expect(
      items.first().locator('span').filter({ hasText: /^\d+$/ }).first()
    ).toHaveText('2');
  });
});

// ============================================================================
// CART — Página /carrito
// ============================================================================

test.describe('Cart — Cart Page', () => {
  test('empty cart shows empty state message', async ({ page }) => {
    await page.goto('/');
    await clearCart(page);
    await page.goto('/carrito');

    await expect(page.getByText('Tu carrito está vacío')).toBeVisible({ timeout: 5000 });
  });

  test('cart page shows product info after adding item', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await clearCart(page);
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);
    await addFirstProductToCart(page);

    await openCartPage(page);

    const item = page.locator('[data-testid="cart-item"]').first();
    await expect(item).toBeVisible();
    // Muestra un precio con $
    await expect(item.locator('text=/\\$\\d/').first()).toBeVisible();
    // CTA a checkout ("Ir a pagar"; inline en desktop, barra sticky en mobile)
    await expect(page.locator('a[href="/checkout"]:visible').first()).toBeVisible();
  });

  test('quantity controls work inside cart page', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await clearCart(page);
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);
    await addFirstProductToCart(page);

    await openCartPage(page);

    const item = page.locator('[data-testid="cart-item"]').first();
    const qty = item.locator('span').filter({ hasText: /^\d+$/ }).first();
    const before = (await qty.textContent()) ?? '';

    await item.locator('button[aria-label="Agregar"]').click();

    // La cantidad sube en un paso (step depende del producto → solo != antes)
    await expect(qty).not.toHaveText(before);
  });

  test('remove button removes item from cart', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await clearCart(page);
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);
    await addFirstProductToCart(page);

    await openCartPage(page);

    await page
      .locator('[data-testid="cart-item"]')
      .first()
      .locator('button[aria-label="Eliminar"]')
      .click();

    // Era la única línea → vuelve el empty state
    await expect(page.getByText('Tu carrito está vacío')).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// CART — Persistence
// ============================================================================

test.describe('Cart — Persistence', () => {
  test('cart persists after page reload', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await clearCart(page);
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);
    await addFirstProductToCart(page);
    await page.waitForTimeout(1000);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect
      .poll(() => getCartBadgeCount(page), { timeout: 5000 })
      .toBeGreaterThan(0);
  });

  test('cart persists across navigation', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await clearCart(page);
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);
    await addFirstProductToCart(page);
    await page.waitForTimeout(500);

    // Navigate to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect
      .poll(() => getCartBadgeCount(page), { timeout: 5000 })
      .toBeGreaterThan(0);
  });
});

// ============================================================================
// CART — Navigation to Checkout
// ============================================================================

test.describe('Cart — Checkout Navigation', () => {
  test('checkout button navigates to /checkout', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await clearCart(page);
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);
    await addFirstProductToCart(page);
    await page.waitForTimeout(500);

    await openCartPage(page);

    // "Ir a pagar" (el visible según breakpoint) navega a /checkout
    await page.locator('a[href="/checkout"]:visible').first().click();
    await page.waitForURL('**/checkout', { timeout: 10000 });
    expect(page.url()).toContain('/checkout');
  });
});
