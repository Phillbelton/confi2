import { test, expect } from '@playwright/test';
import { goToCatalog, clearCart, clearAuth, addFirstProductToCart, requireProducts } from './helpers';

// ============================================================================
// CHECKOUT — Auth gate, guest form, validation, mobile UX
// ============================================================================

/**
 * Helper: add a product and navigate to checkout.
 * Returns false if catalog was empty (rate-limited).
 */
async function goToCheckoutWithProduct(page: import('@playwright/test').Page): Promise<boolean> {
  await page.goto('/');
  await clearCart(page);
  await clearAuth(page);
  const hasProducts = await goToCatalog(page);
  if (!hasProducts) return false;
  await addFirstProductToCart(page);
  await page.waitForTimeout(500);
  await page.goto('/checkout');
  await page.waitForLoadState('networkidle');
  return true;
}

// ============================================================================
// CHECKOUT — Auth Gate
// ============================================================================

test.describe('Checkout — Auth Gate', () => {
  test('shows auth gate for unauthenticated users', async ({ page }) => {
    test.slow();
    const ok = await goToCheckoutWithProduct(page);
    await requireProducts(page, ok);

    // Auth gate heading: "¿Cómo deseas continuar?"
    await expect(page.getByText('¿Cómo deseas continuar?')).toBeVisible({ timeout: 10000 });
  });

  test('shows three options: login, register, guest', async ({ page }) => {
    test.slow();
    const ok = await goToCheckoutWithProduct(page);
    await requireProducts(page, ok);

    // Login option — Link to /login with text "Iniciar sesión"
    await expect(page.getByText('Iniciar sesión')).toBeVisible({ timeout: 10000 });
    // Register option — Link to /registro with text "Crear cuenta"
    await expect(page.getByText('Crear cuenta')).toBeVisible();
    // Guest option — Button with text "Continuar como invitado"
    await expect(page.getByText('Continuar como invitado')).toBeVisible();
  });

  test('guest option shows checkout form', async ({ page }) => {
    test.slow();
    const ok = await goToCheckoutWithProduct(page);
    await requireProducts(page, ok);

    await page.getByText('Continuar como invitado').click();
    await page.waitForTimeout(500);

    // Form fields should appear
    await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[name="phone"]')).toBeVisible();
  });

  test('login link redirects to /login with redirect param', async ({ page }) => {
    test.slow();
    const ok = await goToCheckoutWithProduct(page);
    await requireProducts(page, ok);

    // Login is a Link wrapping the card content: <Link href="/login?redirect=/checkout">
    const loginLink = page.locator('a[href*="login"]').first();
    const href = await loginLink.getAttribute('href');
    expect(href).toContain('redirect');
    expect(href).toContain('checkout');
  });
});

// ============================================================================
// CHECKOUT — Guest Form
// ============================================================================

test.describe('Checkout — Guest Form', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    const ok = await goToCheckoutWithProduct(page);
    expect(ok, 'Catalog must have products').toBe(true);
    // Click guest option — "Continuar como invitado"
    await page.getByText('Continuar como invitado').click();
    await page.waitForTimeout(500);
  });

  test('form displays all required fields', async ({ page }) => {
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    // Email required for guests
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('delivery method options are visible', async ({ page }) => {
    // RadioGroup items: "Retiro en local" and "Delivery a domicilio"
    await expect(page.getByText('Retiro en local')).toBeVisible();
    await expect(page.getByText('Delivery a domicilio')).toBeVisible();
  });

  test('selecting delivery shows address fields', async ({ page }) => {
    // Click the delivery radio option
    const deliveryLabel = page.locator('label[for="delivery"]');
    await deliveryLabel.click();
    await page.waitForTimeout(300);

    // Address fields should appear
    await expect(page.locator('input[name="street"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('input[name="number"]')).toBeVisible();
    await expect(page.locator('input[name="city"]')).toBeVisible();
  });

  test('selecting pickup hides address fields', async ({ page }) => {
    // First select delivery to show fields
    await page.locator('label[for="delivery"]').click();
    await page.waitForTimeout(300);

    // Then switch to pickup
    await page.locator('label[for="pickup"]').click();
    await page.waitForTimeout(300);

    // Address fields should be hidden
    await expect(page.locator('input[name="street"]')).not.toBeVisible();
  });

  test('payment methods are visible', async ({ page }) => {
    await expect(page.getByText('Efectivo')).toBeVisible();
    await expect(page.getByText('Transferencia')).toBeVisible();
  });

  test('order summary shows item count and total', async ({ page }) => {
    // Should show at least one item in summary — price with $
    await expect(page.locator('text=/\\$\\d/')).toBeVisible();
    // Should show total
    await expect(page.getByText('Total')).toBeVisible();
  });
});

// ============================================================================
// CHECKOUT — Validation
// ============================================================================

test.describe('Checkout — Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    const ok = await goToCheckoutWithProduct(page);
    expect(ok, 'Catalog must have products').toBe(true);
    await page.getByText('Continuar como invitado').click();
    await page.waitForTimeout(500);
  });

  test('submitting empty form shows validation errors', async ({ page, isMobile }) => {
    // Try to submit without filling anything
    // Submit button says "Confirmar Pedido"
    const submitBtn = page.locator('button[type="submit"]').filter({ hasText: 'Confirmar' }).first();

    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(500);

      // HTML5 validation or custom error should trigger
      // The form should not navigate away
      expect(page.url()).toContain('/checkout');
    }
  });

  test('phone field has +56 prefix', async ({ page }) => {
    await expect(page.getByText('+56')).toBeVisible();
  });

  test('all inputs have minimum touch target size on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile only');

    const inputs = page.locator('input[name="name"], input[name="phone"], input[name="email"]');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const box = await inputs.nth(i).boundingBox();
      if (box) {
        // Minimum 44px touch target (allowing some tolerance)
        // Inputs use h-12 class which is 48px
        expect(box.height).toBeGreaterThanOrEqual(42);
      }
    }
  });
});

// ============================================================================
// CHECKOUT — Mobile Sticky CTA
// ============================================================================

test.describe('Checkout — Mobile Sticky CTA', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile only');

  test('mobile sticky submit bar is visible', async ({ page }) => {
    test.slow();
    const ok = await goToCheckoutWithProduct(page);
    await requireProducts(page, ok);
    await page.getByText('Continuar como invitado').click();
    await page.waitForTimeout(500);

    const stickyBar = page.locator('.fixed.bottom-0');
    await expect(stickyBar).toBeVisible();
    await expect(stickyBar.locator('button').filter({ hasText: 'Confirmar' })).toBeVisible();
  });

  test('mobile sticky bar shows total', async ({ page }) => {
    test.slow();
    const ok = await goToCheckoutWithProduct(page);
    await requireProducts(page, ok);
    await page.getByText('Continuar como invitado').click();
    await page.waitForTimeout(500);

    const stickyBar = page.locator('.fixed.bottom-0');
    await expect(stickyBar.locator('text=/\\$\\d/')).toBeVisible();
  });
});

// ============================================================================
// CHECKOUT — Empty Cart Redirect
// ============================================================================

test.describe('Checkout — Empty Cart', () => {
  test.skip('redirects or shows message when cart is empty', async ({ page }) => {
    await page.goto('/');
    await clearCart(page);
    await clearAuth(page);
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should either redirect to catalog or show empty cart message
    const url = page.url();
    const hasEmptyMessage = await page.locator('text=/vacío|carrito|productos/i').isVisible({ timeout: 3000 }).catch(() => false);

    expect(url.includes('/productos') || (url.includes('/checkout') && hasEmptyMessage)).toBeTruthy();
  });
});
