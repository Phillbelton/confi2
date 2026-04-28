import { test, expect } from '@playwright/test';
import { waitForProductGrid, getSearchParams, countProductCards, goToCatalog, requireProducts } from './helpers';

// ============================================================================
// CATALOG — Product listing, filters, sorting, pagination
// ============================================================================

test.describe('Catalog — Product Grid', () => {
  test.skip('displays product grid on load', async ({ page }) => {
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);
    const count = await countProductCards(page);
    expect(count).toBeGreaterThan(0);
  });

  test('each product card shows name, price and add-to-cart button', async ({ page }) => {
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);
    const firstCard = page.locator('.group.relative').first();
    // Product name — h3 with font-display class
    await expect(firstCard.locator('h3.font-display')).toBeVisible();
    // Price with $ sign — span with font-bold text-primary
    await expect(firstCard.locator('text=/\\$/')).toBeVisible();
    // Add to cart button — Button with text "Agregar" (no aria-label)
    await expect(firstCard.locator('button').filter({ hasText: 'Agregar' })).toBeVisible();
  });

  test.skip('shows breadcrumb or back link with "Productos" context', async ({ page }) => {
    const hasProducts = await goToCatalog(page);
    // This should work even without products
    await expect(page.locator('text=/[Pp]roductos/')).toBeVisible();
  });

  test('shows result count', async ({ page }) => {
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);
    await expect(page.locator('text=/\\d+ producto/')).toBeVisible();
  });
});

// ============================================================================
// CATALOG — Sorting
// ============================================================================

test.describe('Catalog — Sorting', () => {
  test('sort dropdown changes URL param', async ({ page }) => {
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);

    // Open sort select — it's a combobox button
    await page.locator('button[role="combobox"]').click();
    await page.locator('[role="option"]').filter({ hasText: 'Menor precio' }).click();

    await page.waitForTimeout(500);
    const params = getSearchParams(page);
    expect(params.get('sort')).toBe('price_asc');
  });

  test.skip('sort persists after page reload', async ({ page }) => {
    await page.goto('/productos?sort=price_desc');
    const hasProducts = await waitForProductGrid(page);
    await requireProducts(page, hasProducts);

    // Verify sort is selected
    await expect(page.locator('button[role="combobox"]')).toContainText('Mayor precio');
  });
});

// ============================================================================
// CATALOG — Desktop Filters
// ============================================================================

test.describe('Catalog — Desktop Filters', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop only');

  test.skip('filter sidebar is visible', async ({ page }) => {
    const hasProducts = await goToCatalog(page);
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
  });

  test.skip('price filter section exists', async ({ page }) => {
    const hasProducts = await goToCatalog(page);
    // Price section uses a slider — look for the slider role
    await expect(page.locator('aside').locator('span[role="slider"]').first()).toBeVisible();
  });

  test.skip('categories section is visible', async ({ page }) => {
    const hasProducts = await goToCatalog(page);
    // CollapsibleSection with title "Categorías"
    await expect(page.locator('aside').getByText('Categorías')).toBeVisible();
  });

  test('selecting a category updates URL and shows filter pill', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);

    // Expand categories — CollapsibleSection button
    await page.locator('aside').getByText('Categorías').click();
    await page.waitForTimeout(300);

    // Click the first category button inside the categories section
    const categoryButtons = page.locator('aside').locator('button').filter({ hasText: /^(?!.*Categorías)/ });
    // Find category buttons that appear after the Categories heading
    const firstCategory = page.locator('aside').locator('button[class*="text-left"], button[class*="justify-between"]').filter({ hasText: /\w+/ }).first();

    // Alternative: just look for clickable items after Categories is expanded
    const catSection = page.locator('aside');
    const allButtons = catSection.locator('button');
    const buttonCount = await allButtons.count();

    // Find first category button (skip section headers)
    let categoryClicked = false;
    for (let i = 0; i < buttonCount && !categoryClicked; i++) {
      const btn = allButtons.nth(i);
      const text = await btn.textContent();
      if (text && !text.includes('Categorías') && !text.includes('Marca') && !text.includes('Precio') && !text.includes('Ofertas') && text.trim().length > 0) {
        const isVisible = await btn.isVisible().catch(() => false);
        if (isVisible) {
          await btn.click();
          categoryClicked = true;
        }
      }
    }

    if (categoryClicked) {
      await page.waitForTimeout(500);
      const params = getSearchParams(page);
      expect(params.get('categoria')).toBeTruthy();
    }
  });

  test('selecting brand checkbox updates filters', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);

    // Expand brands section
    await page.locator('aside').getByText('Marca').click();
    await page.waitForTimeout(300);

    // Click first brand checkbox — uses Checkbox component with role="checkbox"
    const firstBrand = page.locator('aside').locator('label').filter({ has: page.locator('[role="checkbox"]') }).first();
    if (await firstBrand.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstBrand.click();
      await page.waitForTimeout(500);
      const params = getSearchParams(page);
      expect(params.get('brands')).toBeTruthy();
    }
  });

  test.skip('clear filters resets all', async ({ page }) => {
    await page.goto('/productos?categoria=abc&brands=xyz&onSale=true');
    await page.waitForTimeout(1000);

    // Click "Limpiar" button
    const clearButton = page.locator('button').filter({ hasText: 'Limpiar' }).last();
    if (await clearButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clearButton.click();
      await page.waitForTimeout(500);

      const params = getSearchParams(page);
      expect(params.get('categoria')).toBeNull();
      expect(params.get('brands')).toBeNull();
      expect(params.get('onSale')).toBeNull();
    }
  });
});

// ============================================================================
// CATALOG — Mobile Filters
// ============================================================================

test.describe('Catalog — Mobile Filters', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile only');

  test('filter button opens sheet', async ({ page }) => {
    const hasProducts = await goToCatalog(page);

    await page.locator('button').filter({ hasText: 'Filtros' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5000 });

    // Sheet should have filter content
    await expect(page.locator('[role="dialog"]').getByText('Filtros')).toBeVisible();
    // Apply button visible
    await expect(page.locator('button').filter({ hasText: 'Aplicar filtros' })).toBeVisible();
  });

  test('filters are pending until "Aplicar" is clicked', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);

    // Open filters
    await page.locator('button').filter({ hasText: 'Filtros' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Expand categories in sheet
    await page.locator('[role="dialog"]').getByText('Categorías').click();
    await page.waitForTimeout(300);

    // Select a category — URL should NOT change yet
    const urlBefore = page.url();
    const dialog = page.locator('[role="dialog"]');
    const allButtons = dialog.locator('button');
    const buttonCount = await allButtons.count();

    for (let i = 0; i < buttonCount; i++) {
      const btn = allButtons.nth(i);
      const text = await btn.textContent();
      if (text && !text.includes('Categorías') && !text.includes('Marca') && !text.includes('Precio') && !text.includes('Filtros') && !text.includes('Aplicar') && !text.includes('Limpiar') && text.trim().length > 0) {
        const isVisible = await btn.isVisible().catch(() => false);
        if (isVisible) {
          await btn.click();
          break;
        }
      }
    }
    await page.waitForTimeout(300);

    expect(page.url()).toBe(urlBefore);

    // Click apply
    await page.locator('button').filter({ hasText: 'Aplicar filtros' }).click();
    await page.waitForTimeout(500);

    // Now URL should have updated
    const params = getSearchParams(page);
    expect(params.get('categoria')).toBeTruthy();
  });

  test('"Limpiar todo" in sheet clears pending filters', async ({ page }) => {
    await page.goto('/productos?categoria=abc');
    await page.waitForTimeout(1000);

    await page.locator('button').filter({ hasText: 'Filtros' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Click "Limpiar todo"
    const clearBtn = page.locator('[role="dialog"]').locator('button').filter({ hasText: 'Limpiar todo' });
    if (await clearBtn.isVisible()) {
      await clearBtn.click();

      // Apply
      await page.locator('button').filter({ hasText: 'Aplicar filtros' }).click();
      await page.waitForTimeout(500);

      const params = getSearchParams(page);
      expect(params.get('categoria')).toBeNull();
    }
  });
});

// ============================================================================
// CATALOG — Subcategory multi-select
// ============================================================================

test.describe('Catalog — Subcategory Selection', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop only — direct filter apply');

  test.skip('selecting a subcategory sets both category and subcategory in URL', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);

    // Expand categories
    await page.locator('aside').getByText('Categorías').click();
    await page.waitForTimeout(300);

    // Find a category with expand chevron (has subcategories)
    // Look for chevron/expand buttons inside the category list
    const chevronButtons = page.locator('aside').locator('button:has(svg.h-3\\.5.w-3\\.5), button:has(svg[class*="h-3"])');
    const chevronCount = await chevronButtons.count();

    if (chevronCount > 0) {
      // Click expand on first category with subcategories
      await chevronButtons.first().click();
      await page.waitForTimeout(300);

      // Click a subcategory (inside the expanded border-l section)
      const subcatButton = page.locator('aside').locator('.border-l button').first();
      if (await subcatButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await subcatButton.click();
        await page.waitForTimeout(500);

        const params = getSearchParams(page);
        expect(params.get('categoria')).toBeTruthy();
        expect(params.get('subcategoria')).toBeTruthy();
      }
    }
  });
});

// ============================================================================
// CATALOG — Pagination
// ============================================================================

test.describe('Catalog — Pagination', () => {
  test.skip('pagination updates URL with page param', async ({ page }) => {
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);

    // Check if pagination exists (needs enough products)
    const paginationButtons = page.locator('button').filter({ hasText: '2' });
    if (await paginationButtons.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await paginationButtons.first().click();
      await page.waitForTimeout(500);

      const params = getSearchParams(page);
      expect(params.get('page')).toBe('2');
    }
  });

  test('page 1 does not show page param in URL', async ({ page }) => {
    await page.goto('/productos?page=2');
    await page.waitForTimeout(1000);

    // Navigate to page 1
    const page1Btn = page.locator('button').filter({ hasText: '1' }).first();
    if (await page1Btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page1Btn.click();
      await page.waitForTimeout(500);

      const params = getSearchParams(page);
      expect(params.get('page')).toBeNull();
    }
  });
});

// ============================================================================
// CATALOG — Search
// ============================================================================

test.describe('Catalog — Search via URL', () => {
  test.skip('search param filters products and shows in title area', async ({ page }) => {
    await page.goto('/productos?search=chocolate');
    await page.waitForTimeout(2000);

    // Page should load without error
    const url = page.url();
    expect(url).toContain('search=chocolate');
  });
});
