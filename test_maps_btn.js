import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log("Navigating...");
  await page.goto("https://www.google.com/maps", { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  const buttons = await page.$$eval('button', els => els.map(el => ({id: el.id, class: el.className, ariaLabel: el.getAttribute('aria-label')})).filter(b => b.ariaLabel && b.ariaLabel.toLowerCase().includes('search')));
  console.log(buttons);
  await browser.close();
}

run().catch(console.error);
