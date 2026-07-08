import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log("Navigating...");
  await page.goto("https://www.google.com/maps", { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log("Waiting for search box...");
  await page.waitForSelector('input#searchboxinput', { timeout: 10000 });
  console.log("Found search box!");
  await browser.close();
}

run().catch(console.error);
