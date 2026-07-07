import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { collectWebVitals, collectNetworkStats, formatMetrics } from './helpers';

/**
 * Reporte de tiempos de carga contra un despliegue REAL (por defecto la VM,
 * build de producción). A diferencia de client-views.spec.ts (umbrales de
 * dev), este spec NO afirma umbrales: mide y vuelca JSON para armar el reporte
 * de UX (PERF-VM-REPORT.md).
 *
 * Correr:
 *   BASE_URL=http://192.168.6.14 npx playwright test --project=perf-desktop vm-report
 *   BASE_URL=http://192.168.6.14 npx playwright test --project=perf-mobile  vm-report
 */

// Slug tomado del catálogo real de la VM (ver reporte). Si cambia el catálogo,
// actualizar o dejar que caiga al fallback del catálogo.
const PDP_SLUG = process.env.PDP_SLUG || 'gummy-mania-osito-bandeja-300gr';

const PAGES = [
  { name: 'Home', url: '/', selector: 'header' },
  { name: 'Catálogo', url: '/productos', selector: '[class*="grid"]' },
  { name: 'Detalle de producto', url: `/productos/${PDP_SLUG}`, selector: 'h1' },
  { name: 'Login', url: '/login', selector: 'form' },
  { name: 'Registro', url: '/registro', selector: 'form' },
];

const results: Array<Record<string, unknown>> = [];
let projectName = 'unknown';

test.describe('Tiempos de carga (VM)', () => {
  for (const p of PAGES) {
    test(`${p.name} — Web Vitals + payload`, async ({ page }, testInfo) => {
      projectName = testInfo.project.name;

      const vitals = await collectWebVitals(page, p.url, { waitForSelector: p.selector, settleTime: 2000 });
      const net = await collectNetworkStats(page, p.url);

      results.push({
        project: projectName,
        page: p.name,
        url: p.url,
        vitals,
        network: { totalRequests: net.totalRequests, totalSizeKB: net.totalSizeKB, byType: net.byType },
      });

      console.log(`\n📊 ${p.name} [${projectName}]`);
      console.log(formatMetrics(vitals));
      console.log(`  Requests: ${net.totalRequests}   Payload: ${net.totalSizeKB}KB`);
    });
  }

  test.afterAll(async () => {
    // Namespacear por host del target para que un run local no pise el JSON
    // de la VM (y viceversa).
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const host = base.replace(/^https?:\/\//, '').replace(/[^\w.-]/g, '_').replace(/[.:]/g, '-');
    const out = path.join(__dirname, `results-${host}-${projectName}.json`);
    fs.writeFileSync(out, JSON.stringify({ base, project: projectName, at: new Date().toISOString(), results }, null, 2));
    console.log(`\n📄 Resultados: ${out}`);
  });
});
