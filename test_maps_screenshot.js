import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log("Navigating...");
  await page.goto("https://www.google.com/maps", { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.screenshot({ path: 'maps_screenshot.png' });
  console.log("Screenshot saved.");
  await browser.close();
}

run().catch(console.error);
