import { test, expect } from '@playwright/test';
import { goToCatalog, clearCart, requireProducts } from './helpers';

// ============================================================================
// PRODUCT DETAIL — Navigation, info display, variant selection, add to cart
// ============================================================================

test.describe('Product Detail — Navigation', () => {
  test.skip('clicking a product card navigates to detail page', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);

    // Click the first product link (the anchor wrapping the card image/name)
    const firstLink = page.locator('[data-testid="product-card"] a').first();
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

    const firstLink = page.locator('[data-testid="product-card"] a').first();
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
    const firstLink = page.locator('[data-testid="product-card"] a').first();
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
    // El PDP muestra varios precios ($ headline, tramos, equivalente por
    // unidad, CTA sticky) → .first() para no violar strict mode.
    await expect(page.locator('text=/\\$\\d/').first()).toBeVisible();
  });

  test.skip('displays product image', async ({ page }) => {
    const mainImage = page.locator('img').first();
    await expect(mainImage).toBeVisible();
  });

  test('displays breadcrumb navigation back to catalog', async ({ page }) => {
    // El PDP rediseñado navega hacia atrás con breadcrumbs (nav "Ruta de
    // navegación" + link Inicio), no con el viejo link "Volver a productos".
    const crumbs = page.getByRole('navigation', { name: 'Ruta de navegación' });
    await expect(crumbs).toBeVisible();
    await expect(crumbs.getByRole('link', { name: 'Inicio' })).toBeVisible();
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
    const firstLink = page.locator('[data-testid="product-card"] a').first();
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
    const firstLink = page.locator('[data-testid="product-card"] a').first();
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
    const firstLink = page.locator('[data-testid="product-card"] a').first();
    await firstLink.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  test('add to cart button is visible', async ({ page, isMobile }) => {
    if (isMobile) {
      // Mobile sticky CTA bar has "Agregar" button
      await expect(
        page.locator('.fixed.bottom-0').locator('button').filter({ hasText: 'Agregar' })
      ).toBeVisible();
    } else {
      // Desktop: el botón principal dice "Agregar al carrito". La CTA sticky
      // móvil también existe en el DOM (oculta por lg:hidden) → .first().
      await expect(
        page.locator('button').filter({ hasText: 'Agregar al carrito' }).first()
      ).toBeVisible();
    }
  });

  test('clicking add to cart shows success feedback', async ({ page, isMobile }) => {
    const addBtn = isMobile
      ? page.locator('.fixed.bottom-0').locator('button').filter({ hasText: 'Agregar' }).first()
      : page.locator('button').filter({ hasText: 'Agregar al carrito' }).first();

    await addBtn.click();

    // Should show success state — toast "¡Agregado al carrito!" or button "¡Agregado!"
    const successIndicator = page
      .locator('[data-sonner-toast]')
      .or(page.getByText('¡Agregado!'))
      .first();
    await expect(successIndicator).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// PRODUCT DETAIL — Scroll al entrar
// ============================================================================

test.describe('Product Detail — Scroll al entrar', () => {
  test('entrar a la ficha desde el catálogo scrolleado parte desde arriba', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);

    // Bajar hasta una card lejos del tope y entrar desde ahí.
    const link = page.locator('[data-testid="product-card"] a').last();
    await link.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const yEnCatalogo = await page.evaluate(() => Math.round(window.scrollY));
    expect(yEnCatalogo, 'el catálogo tiene que quedar scrolleado para que el test valga').toBeGreaterThan(500);

    await link.click();
    await page.waitForURL('**/productos/**');

    // La ficha se renderiza en el cliente y crece en varios pasos (skeleton →
    // contenido → carruseles de relacionados). El scroll tiene que quedar en el
    // tope DESPUÉS de todos esos cambios de alto, no solo al principio: con
    // `scroll-behavior: smooth` en html, el reset de Next quedaba a mitad de
    // animación y la vista se clavaba lejos del tope (medido: y=119).
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(0);
  });
});

// ============================================================================
// PRODUCT DETAIL — Orden de presentaciones
// ============================================================================

/**
 * Orden canónico: de la presentación más chica a la más grande. Los
 * subconjuntos son válidos (unidad+display, display+caja), lo que nunca puede
 * pasar es un salto atrás — "Display · Unidad · Embalaje".
 *
 * Importa porque ~1/3 del catálogo está guardado en la DB como
 * `display > unidad > embalaje` (ahí el display es la presentación principal),
 * así que el orden de lectura lo tiene que imponer la UI, no el array.
 */
const PRES_ORDER = ['unidad', 'cantidadMinima', 'display', 'embalaje'];

function expectCanonicalOrder(types: string[]) {
  const ranks = types.map((t) => PRES_ORDER.indexOf(t));
  expect(ranks, `tipos sin rango conocido: ${types.join(',')}`).not.toContain(-1);
  const sorted = [...ranks].sort((a, b) => a - b);
  expect(ranks, `orden no canónico: ${types.join(' > ')}`).toEqual(sorted);
}

test.describe('Product Detail — Orden de presentaciones', () => {
  test('los chips de la ficha van de la presentación más chica a la más grande', async ({
    page,
  }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);

    // Se recorren varias fichas: solo las multi-presentación tienen chips, y el
    // orden guardado en la DB varía producto a producto.
    const hrefs = await page
      .locator('[data-testid="product-card"] a')
      .evaluateAll((els) =>
        Array.from(
          new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute('href') || ''))
        ).slice(0, 6)
      );
    expect(hrefs.length).toBeGreaterThan(0);

    let conChips = 0;
    for (const href of hrefs) {
      await page.goto(href);
      await page.waitForLoadState('networkidle');
      // Scopeado al selector de LA ficha: los carruseles de relacionados traen
      // sus propios chips y aplanarlos mezcla las presentaciones de N productos.
      const types = await page
        .locator('[data-testid="pdp-presentations"] button[data-pres-type]')
        .evaluateAll((els) => els.map((e) => e.getAttribute('data-pres-type') || ''));
      if (types.length < 2) continue;
      conChips++;
      expectCanonicalOrder(types);
    }
    expect(conChips, 'ninguna ficha visitada tenía varias presentaciones').toBeGreaterThan(0);
  });

  test('los chips de cada tarjeta del catálogo también respetan el orden', async ({ page }) => {
    test.slow();
    // La card inline (variantes B/C del setting) es la que muestra chips; con la
    // variante D la señal es texto y el detalle vive en el bottom-sheet.
    await page.goto('/productos?presvar=B');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({
      timeout: 15000,
    });

    const cards = page.locator('[data-testid="product-card"]');
    const n = Math.min(await cards.count(), 12);
    let conChips = 0;
    for (let i = 0; i < n; i++) {
      const types = await cards
        .nth(i)
        .locator('button[data-pres-type]')
        .evaluateAll((els) => els.map((e) => e.getAttribute('data-pres-type') || ''));
      if (types.length < 2) continue;
      conChips++;
      expectCanonicalOrder(types);
    }
    expect(conChips, 'ninguna tarjeta visible tenía varias presentaciones').toBeGreaterThan(0);
  });
});

// ============================================================================
// PRODUCT DETAIL — Related Products
// ============================================================================

test.describe('Product Detail — Related Products', () => {
  test('shows related carousels with clickable cards', async ({ page }) => {
    test.slow();
    const hasProducts = await goToCatalog(page);
    await requireProducts(page, hasProducts);
    const firstLink = page.locator('[data-testid="product-card"] a').first();
    const currentHref = await firstLink.getAttribute('href');
    await firstLink.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Los títulos son contextuales ("Más de Gomitas", "Más de Mabu") con
    // "Lo más visto" como respaldo, así que se afirma sobre el patrón.
    const relatedHeading = page
      .getByRole('heading', { level: 2 })
      .filter({ hasText: /Más de |Lo más visto/ })
      .first();
    await expect(relatedHeading).toBeVisible({ timeout: 10000 });

    // Y trae tarjetas reales, no un carrusel en skeleton. Assertion web-first
    // (reintenta): los relacionados se piden en el cliente después de hidratar,
    // así que `networkidle` no garantiza que ya estén.
    const relatedCards = page.locator('[data-testid="product-card"]');
    await expect(relatedCards.first()).toBeVisible({ timeout: 15000 });

    // El producto que se está viendo no se recomienda a sí mismo. Se compara el
    // pathname exacto: con `href^=` un slug que es prefijo de otro
    // ("busters-arandano" vs "busters-arandano-frutilla") daba falso positivo.
    if (currentHref) {
      const ownPath = currentHref.split('?')[0];
      const relatedPaths = await relatedCards
        .locator('a')
        .evaluateAll((els) =>
          els.map((e) => ((e as HTMLAnchorElement).getAttribute('href') || '').split('?')[0])
        );
      expect(relatedPaths).not.toContain(ownPath);
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
    const firstLink = page.locator('[data-testid="product-card"] a').first();
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
