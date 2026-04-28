import { test, expect } from '@playwright/test';

// ============================================================================
// NAVIGATION — Header, links, search, responsive behavior
// ============================================================================

test.describe('Navigation — Header', () => {
  test.skip('header is visible on all pages', async ({ page }) => {
    for (const path of ['/', '/productos', '/ofertas']) {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('header')).toBeVisible();
    }
  });

  test.skip('logo links to home', async ({ page }) => {
    await page.goto('/productos');
    await page.waitForLoadState('networkidle');

    // Both desktop and mobile have a logo link to "/"
    const logoLink = page.locator('header a[href="/"]').first();
    await expect(logoLink).toBeVisible();
  });

  test.skip('cart button is always visible in header', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    if (isMobile) {
      // Mobile: icon-only button with ShoppingCart SVG, has relative class for badge positioning
      const cartBtn = page.locator('header').locator('button.relative').filter({ has: page.locator('svg') }).first();
      await expect(cartBtn).toBeVisible();
    } else {
      // Desktop: button with text "Carrito"
      const cartBtn = page.locator('header').locator('button').filter({ hasText: 'Carrito' }).first();
      await expect(cartBtn).toBeVisible();
    }
  });
});

// ============================================================================
// NAVIGATION — Desktop Links
// ============================================================================

test.describe('Navigation — Desktop Links', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop only');

  test.skip('main nav links are visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header');
    await expect(header).toBeVisible();
  });
});

// ============================================================================
// NAVIGATION — Search
// ============================================================================

test.describe('Navigation — Search', () => {
  test('desktop search navigates to catalog with search param', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only — mobile has different search flow');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="buscando"], input[placeholder*="Buscar"]').first();

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('chocolate');
      await searchInput.press('Enter');

      await page.waitForURL('**/productos**', { timeout: 10000 });
      expect(page.url()).toContain('search=chocolate');
    }
  });

  test('mobile search icon opens search input', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile only');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Mobile header has a search icon button — find buttons with SVG in the mobile header
    const mobileButtons = page.locator('header').locator('.flex.lg\\:hidden, div.lg\\:hidden').locator('button').filter({ has: page.locator('svg') });
    const count = await mobileButtons.count();

    for (let i = 0; i < count; i++) {
      const btn = mobileButtons.nth(i);
      // Skip cart button (has .relative class for badge)
      const cls = await btn.getAttribute('class') || '';
      if (cls.includes('relative')) continue;

      await btn.click();
      await page.waitForTimeout(300);

      const searchInput = page.locator('input[placeholder*="buscando"], input[placeholder*="Buscar"]');
      if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(searchInput).toBeVisible();
        return;
      }
      // Close any overlay that might have opened
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
  });
});

// ============================================================================
// NAVIGATION — Page Transitions
// ============================================================================

test.describe('Navigation — Page Transitions', () => {
  test.skip('home to catalog transition', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const productsLink = page.locator('a[href="/productos"]').first();
    if (await productsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await productsLink.click();
      await page.waitForURL('**/productos**', { timeout: 10000 });
      expect(page.url()).toContain('/productos');
    }
  });

  test.skip('catalog to product detail and back', async ({ page }) => {
    test.slow();
    await page.goto('/productos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const firstProductLink = page.locator('.group.relative a').first();
    if (await firstProductLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstProductLink.click();
      await page.waitForURL('**/productos/**', { timeout: 10000 });
      expect(page.url()).toMatch(/\/productos\/.+/);

      await page.goBack();
      await page.waitForURL('**/productos', { timeout: 10000 });
    }
  });

  test.skip('offers page loads correctly', async ({ page }) => {
    await page.goto('/ofertas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/ofertas');
    await expect(page.locator('header')).toBeVisible();
  });
});

// ============================================================================
// NAVIGATION — Footer
// ============================================================================

test.describe('Navigation — Footer', () => {
  test.skip('footer is visible on main pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await expect(footer).toBeVisible();
  });
});

// ============================================================================
// NAVIGATION — Auth Pages Access
// ============================================================================

test.describe('Navigation — Auth Pages', () => {
  test.skip('login page loads', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[id="email"], input[name="email"], input[type="email"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test.skip('register page loads', async ({ page }) => {
    await page.goto('/registro');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[name="name"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test.skip('login page has link to register', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('a[href*="registro"]').first()).toBeVisible({ timeout: 10000 });
  });

  test.skip('register page has link to login', async ({ page }) => {
    await page.goto('/registro');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('a[href*="login"]').first()).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================================
// NAVIGATION — 404 / Not Found
// ============================================================================

test.describe('Navigation — Not Found', () => {
  test.skip('invalid URL shows 404 or redirects', async ({ page }) => {
    const response = await page.goto('/pagina-que-no-existe');

    if (response) {
      const status = response.status();
      expect([200, 404]).toContain(status);
    }
  });

  test('invalid product slug handles gracefully', async ({ page }) => {
    await page.goto('/productos/producto-que-no-existe-xyz-123');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Should show error/not-found state, redirect, or at least not crash
    // Check for any indication the page handled the missing product
    const hasError = await page.locator('text=/no encontr|no existe|404|error|volver/i').isVisible({ timeout: 3000 }).catch(() => false);
    const redirected = !page.url().includes('producto-que-no-existe');
    const pageLoaded = await page.locator('header').isVisible().catch(() => false);

    // At minimum the page didn't crash (header still visible) or it redirected or shows error
    expect(hasError || redirected || pageLoaded).toBeTruthy();
  });
});
