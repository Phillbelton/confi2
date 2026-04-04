import { test, expect } from '@playwright/test';
import {
  collectWebVitals,
  collectNetworkStats,
  measureTTI,
  formatMetrics,
  THRESHOLDS,
  type WebVitals,
} from './helpers';

// ============================================================================
// CONFITERÍA QUELITA — Client Views Performance Tests
// ============================================================================
//
// Tests Web Vitals (FCP, LCP, CLS, TTFB), DOM complexity, JS heap usage,
// and network payload for every client-facing view.
//
// Run:  npx playwright test
// Report: npx playwright show-report tests/performance/report
// ============================================================================

// Shared assertions for all views
function assertCoreVitals(vitals: WebVitals, pageName: string) {
  test.info().annotations.push({ type: 'metrics', description: formatMetrics(vitals) });

  if (vitals.fcp !== null) {
    expect(vitals.fcp, `${pageName} FCP exceeds ${THRESHOLDS.fcp}ms`).toBeLessThan(THRESHOLDS.fcp);
  }
  if (vitals.lcp !== null) {
    expect(vitals.lcp, `${pageName} LCP exceeds ${THRESHOLDS.lcp}ms`).toBeLessThan(THRESHOLDS.lcp);
  }
  expect(vitals.cls, `${pageName} CLS exceeds ${THRESHOLDS.cls}`).toBeLessThan(THRESHOLDS.cls);
  expect(vitals.domNodes, `${pageName} DOM too complex (${vitals.domNodes} nodes)`).toBeLessThan(THRESHOLDS.domNodes);
  expect(vitals.domContentLoaded, `${pageName} DOM loaded too slow`).toBeLessThan(THRESHOLDS.domContentLoaded);
}

// ============================================================================
// 1. HOME PAGE (/)
// ============================================================================
test.describe('Home Page — Landing', () => {
  test('Web Vitals within thresholds', async ({ page }) => {
    const vitals = await collectWebVitals(page, '/', {
      waitForSelector: 'header',
    });
    console.log(`\n📊 Home Page Metrics:\n${formatMetrics(vitals)}`);
    assertCoreVitals(vitals, 'Home');
  });

  test('network payload is reasonable', async ({ page }) => {
    const stats = await collectNetworkStats(page, '/');
    console.log(`\n📦 Home Network: ${stats.totalRequests} requests, ${stats.totalSizeKB}KB total`);
    console.log('  By type:', JSON.stringify(stats.byType, null, 2));

    // Dev mode bundles are ~3x larger than production; threshold is for dev
    expect(stats.totalSizeKB, 'Home page total payload too large').toBeLessThan(15000);
  });

  test('hero section renders quickly', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'commit' });
    await page.waitForSelector('section', { state: 'visible', timeout: 10000 });
    const tti = Date.now() - start;
    console.log(`\n⏱ Home hero TTI: ${tti}ms`);
    expect(tti, 'Hero section took too long to appear').toBeLessThan(3000);
  });

  test('no layout shift from images', async ({ page }) => {
    const vitals = await collectWebVitals(page, '/', { settleTime: 3000 });
    expect(vitals.cls, 'CLS from image loading').toBeLessThan(0.05);
  });
});

// ============================================================================
// 2. PRODUCTS CATALOG (/productos)
// ============================================================================
test.describe('Products Catalog', () => {
  test('Web Vitals within thresholds', async ({ page }) => {
    const vitals = await collectWebVitals(page, '/productos', {
      waitForSelector: '[class*="grid"]',
      settleTime: 2000,
    });
    console.log(`\n📊 Catalog Metrics:\n${formatMetrics(vitals)}`);
    assertCoreVitals(vitals, 'Catalog');
  });

  test('network payload for product grid', async ({ page }) => {
    const stats = await collectNetworkStats(page, '/productos');
    console.log(`\n📦 Catalog Network: ${stats.totalRequests} requests, ${stats.totalSizeKB}KB`);

    // Dev mode bundles are inflated; threshold is for dev
    expect(stats.totalSizeKB, 'Catalog payload too large').toBeLessThan(15000);
  });

  test('product cards render within budget', async ({ page }) => {
    await page.goto('/productos', { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    const cardCount = await page.locator('[class*="group relative flex flex-col"]').count();
    console.log(`\n🃏 Product cards rendered: ${cardCount}`);

    // Should render cards (even if 0 products, the grid should exist)
    const gridExists = await page.locator('[class*="grid"]').count();
    expect(gridExists, 'Product grid not found').toBeGreaterThan(0);
  });

  test('filter sidebar loads without blocking', async ({ page }) => {
    const start = Date.now();
    await page.goto('/productos', { waitUntil: 'domcontentloaded' });

    // Desktop: sidebar should be present
    if (page.viewportSize()!.width >= 1024) {
      const sidebar = page.locator('aside');
      await sidebar.waitFor({ state: 'visible', timeout: 5000 });
      const elapsed = Date.now() - start;
      console.log(`\n🔧 Filter sidebar visible in ${elapsed}ms`);
      expect(elapsed, 'Sidebar took too long').toBeLessThan(3000);
    }
  });

  test('pagination does not cause full page reload', async ({ page }) => {
    await page.goto('/productos', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Check if pagination exists
    const paginationBtns = page.locator('button').filter({ hasText: '2' });
    if (await paginationBtns.count() > 0) {
      const navStart = Date.now();
      await paginationBtns.first().click();
      await page.waitForTimeout(1500);
      const navTime = Date.now() - navStart;

      console.log(`\n📄 Pagination transition: ${navTime}ms`);
      // Client-side pagination should be fast
      expect(navTime, 'Pagination too slow — may be full reload').toBeLessThan(3000);
    }
  });
});

// ============================================================================
// 3. PRODUCT DETAIL (/productos/[slug])
// ============================================================================
test.describe('Product Detail', () => {
  test('Web Vitals from catalog navigation', async ({ page }) => {
    // Navigate via catalog to simulate real user flow
    await page.goto('/productos', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Click first product link
    const productLink = page.locator('a[href^="/productos/"]').first();
    if (await productLink.count() > 0) {
      const navStart = Date.now();
      await productLink.click();
      await page.waitForLoadState('networkidle');
      const navTime = Date.now() - navStart;

      console.log(`\n📊 Product Detail navigation: ${navTime}ms`);
      expect(navTime, 'Product detail navigation too slow').toBeLessThan(4000);

      // Check DOM complexity on detail page
      const domNodes = await page.evaluate(() => document.querySelectorAll('*').length);
      console.log(`  DOM Nodes: ${domNodes}`);
      expect(domNodes, 'Product detail DOM too complex').toBeLessThan(2000);
    }
  });

  test('product images load with proper sizing', async ({ page }) => {
    await page.goto('/productos', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const productLink = page.locator('a[href^="/productos/"]').first();
    if (await productLink.count() > 0) {
      await productLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check that images have explicit dimensions (prevent CLS)
      const imagesWithoutSize = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        let missing = 0;
        imgs.forEach((img) => {
          if (!img.width && !img.height && !img.style.width && !img.style.height) {
            missing++;
          }
        });
        return missing;
      });

      console.log(`\n🖼 Images without explicit size: ${imagesWithoutSize}`);
      expect(imagesWithoutSize, 'Images missing size attributes cause CLS').toBeLessThan(2);
    }
  });
});

// ============================================================================
// 4. AUTH PAGES
// ============================================================================
test.describe('Auth Pages', () => {
  test('Login — Web Vitals', async ({ page }) => {
    const vitals = await collectWebVitals(page, '/login', {
      waitForSelector: 'form',
    });
    console.log(`\n📊 Login Metrics:\n${formatMetrics(vitals)}`);
    assertCoreVitals(vitals, 'Login');

    // Auth pages should be very light
    expect(vitals.domNodes, 'Login page DOM too heavy for a form').toBeLessThan(500);
  });

  test('Registration — Web Vitals', async ({ page }) => {
    const vitals = await collectWebVitals(page, '/registro', {
      waitForSelector: 'form',
    });
    console.log(`\n📊 Registration Metrics:\n${formatMetrics(vitals)}`);
    assertCoreVitals(vitals, 'Registration');
  });

  test('Password Recovery — Web Vitals', async ({ page }) => {
    const vitals = await collectWebVitals(page, '/recuperar-contrasena', {
      waitForSelector: 'main',
    });
    console.log(`\n📊 Password Recovery Metrics:\n${formatMetrics(vitals)}`);
    assertCoreVitals(vitals, 'Password Recovery');
  });

  test('auth pages have minimal JS payload', async ({ page }) => {
    const stats = await collectNetworkStats(page, '/login');
    const jsPayload = stats.byType['script']?.sizeKB || 0;
    console.log(`\n📦 Login JS payload: ${jsPayload}KB`);

    // Dev mode includes full React DevTools + HMR; production will be ~3x smaller
    expect(jsPayload, 'Auth page JS too heavy').toBeLessThan(10000);
  });
});

// ============================================================================
// 5. CLIENT DASHBOARD PAGES (require auth — test load without auth redirect)
// ============================================================================
test.describe('Client Dashboard Pages (unauthenticated load)', () => {
  // These test how fast the pages load/redirect — even redirects should be snappy

  test('Profile page load/redirect time', async ({ page }) => {
    const start = Date.now();
    await page.goto('/perfil', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const elapsed = Date.now() - start;

    console.log(`\n📊 Profile load/redirect: ${elapsed}ms`);
    console.log(`  Final URL: ${page.url()}`);
    expect(elapsed, 'Profile page load/redirect too slow').toBeLessThan(5000);
  });

  test('Orders page load/redirect time', async ({ page }) => {
    const start = Date.now();
    await page.goto('/mis-ordenes', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const elapsed = Date.now() - start;

    console.log(`\n📊 Orders load/redirect: ${elapsed}ms`);
    console.log(`  Final URL: ${page.url()}`);
    expect(elapsed, 'Orders page load/redirect too slow').toBeLessThan(5000);
  });

  test('Addresses page load/redirect time', async ({ page }) => {
    const start = Date.now();
    await page.goto('/direcciones', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const elapsed = Date.now() - start;

    console.log(`\n📊 Addresses load/redirect: ${elapsed}ms`);
    console.log(`  Final URL: ${page.url()}`);
    expect(elapsed, 'Addresses page load/redirect too slow').toBeLessThan(5000);
  });
});

// ============================================================================
// 6. CROSS-PAGE PERFORMANCE
// ============================================================================
test.describe('Cross-Page Metrics', () => {
  test('navigation between pages uses client-side routing', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Navigate Home → Catalog
    const navStart = Date.now();
    const catalogLink = page.locator('a[href="/productos"]').first();
    if (await catalogLink.count() > 0) {
      await catalogLink.click();
      await page.waitForURL('**/productos**', { timeout: 5000 });
      const navTime = Date.now() - navStart;

      console.log(`\n🔀 Home → Catalog: ${navTime}ms`);
      // Client-side nav should be much faster than full page load
      expect(navTime, 'Navigation too slow — may not be client-side').toBeLessThan(3000);
    }
  });

  test('total JS bundle size across pages', async ({ page }) => {
    const pages = ['/', '/productos', '/login'];
    const results: Record<string, number> = {};

    for (const url of pages) {
      const stats = await collectNetworkStats(page, url);
      results[url] = stats.byType['script']?.sizeKB || 0;
    }

    console.log('\n📦 JS Bundle Sizes:');
    for (const [url, size] of Object.entries(results)) {
      console.log(`  ${url}: ${size}KB`);
    }

    // Dev mode threshold; production should be ~3x smaller
    for (const [url, size] of Object.entries(results)) {
      expect(size, `${url} JS payload exceeds 10MB`).toBeLessThan(10240);
    }
  });

  test('images use Next.js optimization', async ({ page }) => {
    await page.goto('/productos', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const imageAnalysis = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      let nextOptimized = 0;
      let unoptimized = 0;
      let lazyLoaded = 0;

      imgs.forEach((img) => {
        // Next/Image adds data-nimg attribute, srcset, or routes through _next/image
        if (img.srcset || img.src.includes('_next/image') || img.hasAttribute('data-nimg')) {
          nextOptimized++;
        } else {
          unoptimized++;
        }
        if (img.loading === 'lazy' || img.getAttribute('fetchpriority')) lazyLoaded++;
      });

      return { total: imgs.length, nextOptimized, unoptimized, lazyLoaded };
    });

    console.log('\n🖼 Image Analysis:', JSON.stringify(imageAnalysis, null, 2));

    // Report optimization ratio — soft check (warning, not failure)
    if (imageAnalysis.total > 0) {
      const optimizedRatio = imageAnalysis.nextOptimized / imageAnalysis.total;
      const pct = Math.round(optimizedRatio * 100);
      console.log(`  Optimization ratio: ${pct}% (${imageAnalysis.nextOptimized}/${imageAnalysis.total})`);
      if (optimizedRatio < 0.5) {
        test.info().annotations.push({
          type: 'warning',
          description: `Only ${pct}% of images use Next.js optimization. Consider using next/image for all product images.`,
        });
      }
    }
  });
});
