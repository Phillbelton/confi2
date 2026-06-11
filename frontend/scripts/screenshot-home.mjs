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
  // 'load' + espera fija: networkidle puede no llegar nunca (carruseles,
  // imágenes lazy que entran al hacer layout, etc.).
  await page.goto(BASE, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `screenshot-home-${name}.png`, fullPage: true });
  console.log(`screenshot-home-${name}.png listo`);
  await ctx.close();
}
await browser.close();
