// Captura la home en desktop y mobile para verificación visual.
// Uso: node scripts/screenshot-home.mjs (requiere front en :3000 y back en :5000)
import { chromium, devices } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const browser = await chromium.launch();

for (const [name, opts] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['mobile', { ...devices['Pixel 5'] }],
]) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `screenshot-home-${name}.png`, fullPage: true });
  console.log(`screenshot-home-${name}.png listo`);
  await ctx.close();
}
await browser.close();
