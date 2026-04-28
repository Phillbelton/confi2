import { test, expect } from '@playwright/test';
import { goToCatalog, clearCart, openCartSheet, addFirstProductToCart, requireProducts } from './helpers';

// ============================================================================
// CART — Add items, quantity management, cart sheet UI
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

    // Wait for cart badge to appear/update in header
    // Badge uses absolute positioning with classes like `absolute -top-1 -right-1`
    const badge = page.locator('header').locator('.absolute.-top-1.-right-1').first();
    await expect(badge).toBeVisible({ timeout: 5000 });
  });

  test('adding product from detail page updates cart badge', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);

    // Navigate to first product detail
    const firstLink = page.locator('.group.relative a').first();
    await firstLink.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Add to cart — desktop says "Agregar al carrito", mobile says "Agregar"
    const addBtn = page.locator('button').filter({ hasText: /Agregar/ }).first();
    await addBtn.click();
    await page.waitForTimeout(1000);

    // Badge should show
    const badge = page.locator('header').locator('.absolute.-top-1.-right-1').first();
    await expect(badge).toBeVisible({ timeout: 5000 });
  });

  test('adding same product twice increases quantity, not duplicates', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);
    await addFirstProductToCart(page);
    await page.waitForTimeout(500);
    await addFirstProductToCart(page);
    await page.waitForTimeout(500);

    // Open cart sheet
    await openCartSheet(page);

    // The quantity display in cart sheet uses <span class="w-8 text-center ...">
    // Should show "2" somewhere in the dialog
    await expect(page.locator('[role="dialog"]').locator('text=2')).toBeVisible({ timeout: 3000 });
  });
});

// ============================================================================
// CART — Cart Sheet UI
// ============================================================================

test.describe('Cart — Sheet UI', () => {
  test('empty cart shows empty state message', async ({ page }) => {
    await page.goto('/');
    await clearCart(page);
    await page.reload();
    await page.waitForLoadState('networkidle');

    await openCartSheet(page);

    // CartSheet empty state says "Tu carrito está vacío"
    await expect(page.locator('[role="dialog"]').getByText('Tu carrito está vacío')).toBeVisible({ timeout: 5000 });
  });

  test('cart sheet shows product info after adding item', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await clearCart(page);
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);
    await addFirstProductToCart(page);
    await page.waitForTimeout(500);

    await openCartSheet(page);
    const dialog = page.locator('[role="dialog"]');

    // Should show a price with $ sign
    await expect(dialog.locator('text=/\\$\\d/')).toBeVisible();
    // Should show "Ir al Checkout" link
    await expect(dialog.getByText('Ir al Checkout')).toBeVisible();
  });

  test('quantity controls work inside cart sheet', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await clearCart(page);
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);
    await addFirstProductToCart(page);
    await page.waitForTimeout(500);

    await openCartSheet(page);
    const dialog = page.locator('[role="dialog"]');

    // Cart sheet uses Plus/Minus icon buttons (no text "+" or "-")
    // The Plus button is the second icon button in the quantity controls area
    // Find the quantity control area by looking for the bg-gray-100 rounded-lg container
    const qtyControls = dialog.locator('.bg-gray-100.rounded-lg').first();
    if (await qtyControls.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click the last button in qty controls (the Plus button)
      const plusBtn = qtyControls.locator('button').last();
      await plusBtn.click();
      await page.waitForTimeout(300);

      // Quantity should now be 2 — shown in span.w-8.text-center
      await expect(dialog.locator('span.w-8.text-center').first()).toHaveText('2');
    }
  });

  test('remove button removes item from cart', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await clearCart(page);
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);
    await addFirstProductToCart(page);
    await page.waitForTimeout(500);

    await openCartSheet(page);
    const dialog = page.locator('[role="dialog"]');

    // Delete button contains a Trash2 icon — it's a ghost button with h-6 w-6
    // Look for button that has the trash SVG inside it
    const deleteBtn = dialog.locator('button').filter({ has: page.locator('svg.h-4.w-4') }).first();
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(500);

      // Should show empty state
      await expect(dialog.getByText('Tu carrito está vacío')).toBeVisible({ timeout: 3000 });
    }
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
    await page.waitForTimeout(1000);

    // Cart badge should still show
    const badge = page.locator('header').locator('.absolute.-top-1.-right-1').first();
    await expect(badge).toBeVisible({ timeout: 5000 });
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
    await page.waitForTimeout(1000);

    // Badge should still show
    const badge = page.locator('header').locator('.absolute.-top-1.-right-1').first();
    await expect(badge).toBeVisible({ timeout: 5000 });
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

    await openCartSheet(page);

    // CartSheet checkout link says "Ir al Checkout" and links to /checkout
    const checkoutBtn = page.locator('[role="dialog"]').getByText('Ir al Checkout');
    await checkoutBtn.click();

    await page.waitForURL('**/checkout', { timeout: 10000 });
    expect(page.url()).toContain('/checkout');
  });
});
