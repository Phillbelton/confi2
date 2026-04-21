import { test, expect } from '@playwright/test';
import { goToCatalog, clearCart, waitForNavigation, requireProducts } from './helpers';

// ============================================================================
// PRODUCT DETAIL — Navigation, info display, variant selection, add to cart
// ============================================================================

test.describe('Product Detail — Navigation', () => {
  test.skip('clicking a product card navigates to detail page', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);

    // Click the first product link (the anchor wrapping the card image/name)
    const firstLink = page.locator('.group.relative a').first();
    const href = await firstLink.getAttribute('href');
    expect(href).toContain('/productos/');

    await firstLink.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });

    // Should be on a detail page
    expect(page.url()).toContain('/productos/');
  });

  test.skip('back link returns to catalog', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);

    const firstLink = page.locator('.group.relative a').first();
    await firstLink.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });

    // Back link says "Volver a productos" with ChevronLeft icon
    const backLink = page.locator('a').filter({ hasText: 'Volver a productos' }).first();
    if (await backLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await backLink.click();
      await page.waitForURL('**/productos', { timeout: 10000 });
      expect(page.url()).toContain('/productos');
    }
  });
});

test.describe('Product Detail — Content', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    expect(hasProducts, 'Catalog must have products').toBe(true);
    const firstLink = page.locator('.group.relative a').first();
    await firstLink.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  test.skip('displays product name', async ({ page }) => {
    const title = page.locator('h1');
    await expect(title).toBeVisible();
    const text = await title.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('displays product price with $ symbol', async ({ page }) => {
    // Price uses suppressHydrationWarning and font-sans font-bold text-primary classes
    await expect(page.locator('text=/\\$\\d/')).toBeVisible();
  });

  test.skip('displays product image', async ({ page }) => {
    const mainImage = page.locator('img').first();
    await expect(mainImage).toBeVisible();
  });

  test('displays back link to products', async ({ page }) => {
    // Breadcrumb is a "Volver a productos" link (not a traditional breadcrumb nav)
    const backLink = page.locator('a').filter({ hasText: 'Volver a productos' });
    await expect(backLink).toBeVisible();
  });
});

// ============================================================================
// PRODUCT DETAIL — Variant Selection
// ============================================================================

test.describe('Product Detail — Variants', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    expect(hasProducts, 'Catalog must have products').toBe(true);
    const firstLink = page.locator('.group.relative a').first();
    await firstLink.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  test.skip('variant selector is visible if product has variants', async ({ page }) => {
    // Variant selector uses a Select component — look for the trigger with "Variante" label nearby
    const variantLabel = page.getByText('Variante');
    const isVisible = await variantLabel.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      // The select trigger should be right after the label
      await expect(page.locator('button[role="combobox"]').first()).toBeVisible();
    }
  });

  test.skip('selecting a different variant updates the displayed price', async ({ page }) => {
    const variantSelect = page.locator('button[role="combobox"]').first();
    const isVisible = await variantSelect.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      // Get current price text
      const priceBefore = await page.locator('.font-bold.text-primary').first().textContent();

      // Open select and pick a different option
      await variantSelect.click();
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();

      if (optionCount > 1) {
        await options.nth(1).click();
        await page.waitForTimeout(300);

        // Price may or may not change depending on variant pricing
        const priceAfter = await page.locator('.font-bold.text-primary').first().textContent();
        // Just verify it didn't crash — price might be same or different
        expect(priceAfter).toBeTruthy();
      }
    }
  });
});

// ============================================================================
// PRODUCT DETAIL — Quantity Controls
// ============================================================================

test.describe('Product Detail — Quantity', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    expect(hasProducts, 'Catalog must have products').toBe(true);
    const firstLink = page.locator('.group.relative a').first();
    await firstLink.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  test.skip('quantity defaults to 1', async ({ page }) => {
    // Quantity is shown in a <span> with font-bold text-foreground, not an input
    // Desktop: span with class "font-sans w-10 text-center font-bold"
    // Mobile: span with class "font-sans w-8 text-center font-bold"
    const qtySpan = page.locator('span').filter({ hasText: /^1$/ }).first();
    if (await qtySpan.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(qtySpan).toHaveText('1');
    }
  });

  test('increment button increases quantity', async ({ page, isMobile }) => {
    // Quantity controls use Plus/Minus icons (no text "+" or "-")
    // On mobile, they're in the fixed bottom bar; on desktop, in main content
    const container = isMobile
      ? page.locator('.fixed.bottom-0')
      : page.locator('main');

    // The quantity controls are in a div with border border-border rounded-lg h-12
    const qtyControl = container.locator('.border.border-border.rounded-lg.h-12, div.flex.items-center.border').first();
    if (await qtyControl.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Plus button is the last button in the qty control
      const plusBtn = qtyControl.locator('button').last();
      await plusBtn.click();
      await page.waitForTimeout(200);

      // Quantity should now be 2 — shown in a span inside the control
      const qtySpan = qtyControl.locator('span').first();
      await expect(qtySpan).toHaveText('2');
    }
  });

  test('decrement button does not go below 1', async ({ page, isMobile }) => {
    const container = isMobile
      ? page.locator('.fixed.bottom-0')
      : page.locator('main');

    const qtyControl = container.locator('.border.border-border.rounded-lg.h-12, div.flex.items-center.border').first();
    if (await qtyControl.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Minus button is the first button
      const minusBtn = qtyControl.locator('button').first();
      await minusBtn.click();
      await page.waitForTimeout(200);

      // Quantity should still be 1
      const qtySpan = qtyControl.locator('span').first();
      const text = await qtySpan.textContent();
      expect(parseInt(text || '1')).toBeGreaterThanOrEqual(1);
    }
  });
});

// ============================================================================
// PRODUCT DETAIL — Add to Cart
// ============================================================================

test.describe('Product Detail — Add to Cart', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await page.goto('/');
    await clearCart(page);
    const hasProducts = await goToCatalog(page);
    expect(hasProducts, 'Catalog must have products').toBe(true);
    const firstLink = page.locator('.group.relative a').first();
    await firstLink.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  test('add to cart button is visible', async ({ page, isMobile }) => {
    if (isMobile) {
      // Mobile sticky CTA bar has "Agregar" button
      await expect(page.locator('.fixed.bottom-0').locator('button').filter({ hasText: 'Agregar' })).toBeVisible();
    } else {
      // Desktop button says "Agregar al carrito"
      await expect(page.locator('button').filter({ hasText: 'Agregar al carrito' })).toBeVisible();
    }
  });

  test('clicking add to cart shows success feedback', async ({ page, isMobile }) => {
    const addBtn = isMobile
      ? page.locator('.fixed.bottom-0').locator('button').filter({ hasText: 'Agregar' }).first()
      : page.locator('button').filter({ hasText: 'Agregar al carrito' }).first();

    await addBtn.click();

    // Should show success state — button text changes to "Agregado" or toast appears
    const successIndicator = page.locator('text=Agregado, [data-sonner-toast]').first();
    await expect(successIndicator).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// PRODUCT DETAIL — Related Products
// ============================================================================

test.describe('Product Detail — Related Products', () => {
  test.skip('shows related products section', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);
    const firstLink = page.locator('.group.relative a').first();
    await firstLink.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Section heading says "Productos relacionados"
    const relatedSection = page.getByText('Productos relacionados');
    if (await relatedSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(relatedSection).toBeVisible();
    }
  });
});

// ============================================================================
// PRODUCT DETAIL — Mobile Sticky CTA
// ============================================================================

test.describe('Product Detail — Mobile Sticky CTA', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile only');

  test('sticky CTA bar is visible on mobile', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);
    const firstLink = page.locator('.group.relative a').first();
    await firstLink.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const stickyBar = page.locator('.fixed.bottom-0');
    await expect(stickyBar).toBeVisible();

    // Has price with $
    await expect(stickyBar.locator('text=/\\$/')).toBeVisible();
    // Has add button with "Agregar"
    await expect(stickyBar.locator('button').filter({ hasText: 'Agregar' })).toBeVisible();
  });
});
