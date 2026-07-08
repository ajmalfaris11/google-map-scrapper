import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log("Navigating...");
  await page.goto("https://www.google.com/maps", { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  const searchBox = await page.$('input#searchboxinput');
  if (searchBox) {
    console.log("Found searchBox!");
  } else {
    console.log("Not found.");
    // print all input elements
    const inputs = await page.$$eval('input', els => els.map(el => ({id: el.id, class: el.className, name: el.name})));
    console.log(inputs);
  }
  await browser.close();
}

run().catch(console.error);
