import { Page } from '@playwright/test';

/**
 * Web Vitals metrics collected via PerformanceObserver
 */
export interface WebVitals {
  /** First Contentful Paint (ms) */
  fcp: number | null;
  /** Largest Contentful Paint (ms) */
  lcp: number | null;
  /** Cumulative Layout Shift */
  cls: number;
  /** Time to First Byte (ms) */
  ttfb: number | null;
  /** DOM Content Loaded (ms) */
  domContentLoaded: number;
  /** Full page load (ms) */
  load: number;
  /** DOM node count */
  domNodes: number;
  /** Total JS heap size (MB) */
  jsHeapMB: number | null;
}

/**
 * Performance thresholds based on Google's "Good" Web Vitals
 * https://web.dev/vitals/
 */
export const THRESHOLDS = {
  fcp: 1800,          // ms — "Good" < 1.8s
  lcp: 2500,          // ms — "Good" < 2.5s
  cls: 0.1,           // score — "Good" < 0.1
  ttfb: 800,          // ms — "Good" < 0.8s
  domContentLoaded: 3000,
  load: 5000,
  domNodes: 1500,     // Excessive DOM = slow rendering
  jsHeapMB: 50,       // MB
};

/**
 * Inject PerformanceObserver into the page to collect Web Vitals,
 * then navigate and collect metrics after load settles.
 */
export async function collectWebVitals(
  page: Page,
  url: string,
  options?: { waitForSelector?: string; settleTime?: number }
): Promise<WebVitals> {
  // Setup performance collection BEFORE navigation
  await page.addInitScript(() => {
    (window as any).__perf = {
      fcp: null,
      lcp: null,
      cls: 0,
    };

    // FCP
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcp = entries.find((e) => e.name === 'first-contentful-paint');
      if (fcp) (window as any).__perf.fcp = fcp.startTime;
    });
    fcpObserver.observe({ type: 'paint', buffered: true });

    // LCP
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        (window as any).__perf.lcp = entries[entries.length - 1].startTime;
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // CLS
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          (window as any).__perf.cls += (entry as any).value;
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  });

  // Navigate
  const response = await page.goto(url, { waitUntil: 'load' });

  // Wait for specific content if needed
  if (options?.waitForSelector) {
    await page.waitForSelector(options.waitForSelector, { timeout: 10000 }).catch(() => {});
  }

  // Let the page settle (animations, lazy loads)
  await page.waitForTimeout(options?.settleTime ?? 1500);

  // Collect all metrics
  const metrics = await page.evaluate(() => {
    const perf = (window as any).__perf;
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    return {
      fcp: perf.fcp,
      lcp: perf.lcp,
      cls: Math.round(perf.cls * 1000) / 1000, // 3 decimal precision
      ttfb: navEntry ? navEntry.responseStart - navEntry.requestStart : null,
      domContentLoaded: navEntry ? navEntry.domContentLoadedEventEnd - navEntry.startTime : 0,
      load: navEntry ? navEntry.loadEventEnd - navEntry.startTime : 0,
      domNodes: document.querySelectorAll('*').length,
      jsHeapMB: (performance as any).memory
        ? Math.round(((performance as any).memory.usedJSHeapSize / 1024 / 1024) * 10) / 10
        : null,
    };
  });

  return metrics;
}

/**
 * Measure time to interactive — how long until the page responds to clicks
 */
export async function measureTTI(page: Page, selector: string): Promise<number> {
  const start = Date.now();
  await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
  return Date.now() - start;
}

/**
 * Count network requests by type during page load
 */
export interface NetworkStats {
  totalRequests: number;
  totalSizeKB: number;
  byType: Record<string, { count: number; sizeKB: number }>;
}

export async function collectNetworkStats(
  page: Page,
  url: string
): Promise<NetworkStats> {
  const requests: { type: string; size: number }[] = [];

  page.on('response', async (response) => {
    const type = response.request().resourceType();
    const size = (await response.body().catch(() => Buffer.alloc(0))).length;
    requests.push({ type, size });
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const byType: Record<string, { count: number; sizeKB: number }> = {};
  let totalSize = 0;

  for (const req of requests) {
    totalSize += req.size;
    if (!byType[req.type]) byType[req.type] = { count: 0, sizeKB: 0 };
    byType[req.type].count++;
    byType[req.type].sizeKB += req.size / 1024;
  }

  // Round KB values
  for (const key of Object.keys(byType)) {
    byType[key].sizeKB = Math.round(byType[key].sizeKB * 10) / 10;
  }

  return {
    totalRequests: requests.length,
    totalSizeKB: Math.round((totalSize / 1024) * 10) / 10,
    byType,
  };
}

/**
 * Pretty-print metrics for test output
 */
export function formatMetrics(vitals: WebVitals): string {
  const lines = [
    `  FCP:  ${vitals.fcp ? vitals.fcp.toFixed(0) + 'ms' : 'N/A'}  (threshold: ${THRESHOLDS.fcp}ms)`,
    `  LCP:  ${vitals.lcp ? vitals.lcp.toFixed(0) + 'ms' : 'N/A'}  (threshold: ${THRESHOLDS.lcp}ms)`,
    `  CLS:  ${vitals.cls}  (threshold: ${THRESHOLDS.cls})`,
    `  TTFB: ${vitals.ttfb ? vitals.ttfb.toFixed(0) + 'ms' : 'N/A'}  (threshold: ${THRESHOLDS.ttfb}ms)`,
    `  DOM Loaded: ${vitals.domContentLoaded.toFixed(0)}ms`,
    `  Full Load:  ${vitals.load.toFixed(0)}ms`,
    `  DOM Nodes:  ${vitals.domNodes}  (threshold: ${THRESHOLDS.domNodes})`,
    `  JS Heap:    ${vitals.jsHeapMB ? vitals.jsHeapMB + 'MB' : 'N/A'}`,
  ];
  return lines.join('\n');
}
