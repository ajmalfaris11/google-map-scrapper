import { chromium } from 'playwright';

async function test() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  console.log("Browser launched.");
  const context = await browser.newContext();
  const page = await context.newPage();
  console.log("Going to google maps...");
  await page.goto("https://www.google.com/maps");
  console.log("Success!");
  await browser.close();
}

test().catch(console.error);
