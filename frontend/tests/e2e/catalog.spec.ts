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
    const firstCard = page.locator('[data-testid="product-card"]').first();
    // Nombre del producto
    await expect(firstCard.locator('h3')).toBeVisible();
    // Precio con $ (la card puede tener varios: precio, tramo, $/u → first)
    await expect(firstCard.locator('text=/\\$\\d/').first()).toBeVisible();
    // CTA: "Agregar" (mono-presentación / inline) o "Ver presentaciones" (sheet)
    await expect(
      firstCard.locator('button').filter({ hasText: /Agregar|Ver presentaciones/ }).first()
    ).toBeVisible();
  });

  test.skip('shows breadcrumb or back link with "Productos" context', async ({ page }) => {
    await goToCatalog(page);
    // This should work even without products
    await expect(page.locator('text=/[Pp]roductos/')).toBeVisible();
  });

  test('shows result count', async ({ page }) => {
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);
    // El conteo aparece en el hero Y en la fila de controles → first
    await expect(page.locator('text=/\\d+ producto/').first()).toBeVisible();
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
    await page.locator('[role="option"]').filter({ hasText: 'Precio: menor' }).click();

    await expect
      .poll(() => getSearchParams(page).get('sort'), { timeout: 5000 })
      .toBe('price_asc');
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
    await goToCatalog(page);
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
  });

  test.skip('price filter section exists', async ({ page }) => {
    await goToCatalog(page);
    // Price section uses a slider — look for the slider role
    await expect(page.locator('aside').locator('span[role="slider"]').first()).toBeVisible();
  });

  test.skip('categories section is visible', async ({ page }) => {
    await goToCatalog(page);
    // CollapsibleSection with title "Categorías"
    await expect(page.locator('aside').getByText('Categorías')).toBeVisible();
  });

  // El sidebar ya no tiene sección "Categorías" (la navegación de categorías
  // vive en el navbar y en los chips de subcategoría). El filtro single-select
  // representativo hoy es el rango de PRECIO (radio).
  test('selecting a price range updates URL and shows filter pill', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);

    // FilterList "Precio": opciones button[role="radio"], siempre desplegadas
    await page.locator('aside').getByRole('radio', { name: 'Hasta $1.000' }).click();

    await expect
      .poll(() => getSearchParams(page).get('maxPrice'), { timeout: 5000 })
      .toBe('1000');
    // Chip de filtro activo (botón removible; el radio del aside no tiene
    // role button, así que no colisiona)
    await expect(
      page.getByRole('button', { name: /Precio: Hasta \$1\.000/ })
    ).toBeVisible();
  });

  test('selecting brand checkbox updates filters', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);

    // Opciones de "Marcas": button[role="checkbox"], siempre desplegadas.
    // La primera checkbox del aside es una marca (Marcas va antes que Promos).
    await page.locator('aside').getByRole('checkbox').first().click();

    await expect
      .poll(() => getSearchParams(page).get('brands'), { timeout: 5000 })
      .toBeTruthy();
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
    await goToCatalog(page);

    await page.locator('button').filter({ hasText: 'Filtros' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5000 });

    // Sheet should have filter content
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog.getByText('Filtros').first()).toBeVisible();
    // Los filtros aplican al instante: el footer es "Ver N productos" (cierra
    // el sheet), ya no existe "Aplicar filtros".
    await expect(
      dialog.locator('button').filter({ hasText: /Ver \d+ producto/ })
    ).toBeVisible();
  });

  // El sheet ya NO tiene filtros "pendientes": cada opción aplica al instante
  // (mismos FilterList del sidebar desktop) y "Ver N productos" solo cierra.
  test('selecting a filter in the sheet applies immediately', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);

    // Open filters
    await page.locator('button').filter({ hasText: 'Filtros' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    const dialog = page.locator('[role="dialog"]');

    // Elegir un rango de precio (radio) → la URL cambia sin botón "Aplicar"
    await dialog.getByRole('radio', { name: 'Hasta $1.000' }).click();
    await expect
      .poll(() => getSearchParams(page).get('maxPrice'), { timeout: 5000 })
      .toBe('1000');

    // "Ver N productos" cierra el sheet y la grilla queda filtrada
    await dialog.locator('button').filter({ hasText: /Ver \d+ producto/ }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('"Limpiar todo" in sheet clears active filters', async ({ page }) => {
    await page.goto('/productos?maxPrice=1000');
    const hasProducts = await waitForProductGrid(page);
    await requireProducts(page, hasProducts);

    await page.locator('button').filter({ hasText: 'Filtros' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // "Limpiar todo" (visible porque hay un filtro activo) limpia la URL al tiro
    await page
      .locator('[role="dialog"]')
      .locator('button')
      .filter({ hasText: 'Limpiar todo' })
      .click();

    await expect
      .poll(() => getSearchParams(page).get('maxPrice'), { timeout: 5000 })
      .toBeNull();
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

// La paginación numerada no existe: el catálogo usa scroll infinito con un
// botón "Cargar más productos" de respaldo, y nunca ensucia la URL con ?page.
test.describe('Catalog — Pagination (scroll infinito)', () => {
  test('"Cargar más" appends products without a page param in the URL', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);

    const before = await countProductCards(page);
    const loadMore = page.locator('button').filter({ hasText: 'Cargar más productos' });
    if (!(await loadMore.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Una sola página de resultados — no hay más que cargar');
    }

    await loadMore.click();
    await expect
      .poll(() => countProductCards(page), { timeout: 15000 })
      .toBeGreaterThan(before);
    expect(getSearchParams(page).get('page')).toBeNull();
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
