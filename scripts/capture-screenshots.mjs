import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'screenshots');
const baseUrl = process.env.BASE_URL || 'http://localhost:8080';

const pages = [
  { file: 'index.html', name: 'home.png', waitFor: 'main' },
  { file: 'concepts.html', name: 'concepts.png', waitFor: '.concept-card' },
  { file: 'prices.html', name: 'prices.png', waitFor: '#pricesGrid', extraWait: 5000 },
  { file: 'simulator.html', name: 'simulator.png', waitFor: '#block1Panel', mineDemo: true },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
});
const page = await context.newPage();

for (const entry of pages) {
  const url = `${baseUrl}/${entry.file}`;
  console.log(`Capturing ${url} → screenshots/${entry.name}`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForSelector(entry.waitFor, { timeout: 20000 });
  } catch {
    console.warn(`  Warning: selector ${entry.waitFor} not found, capturing anyway`);
  }
  if (entry.extraWait) await page.waitForTimeout(entry.extraWait);

  if (entry.mineDemo) {
    await page.click('#mineBlock1');
    await page.waitForFunction(
      () => document.getElementById('block1Status')?.textContent?.includes('Valid'),
      { timeout: 90000 }
    ).catch(() => {});
    await page.click('#mineBlock2');
    await page.waitForFunction(
      () => document.getElementById('block2Status')?.textContent?.includes('Valid'),
      { timeout: 90000 }
    ).catch(() => {});
  }

  await page.screenshot({ path: join(outDir, entry.name), fullPage: true });
}

await browser.close();
console.log('Done — 4 screenshots saved to screenshots/');
