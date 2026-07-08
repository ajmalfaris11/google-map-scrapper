import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  const promises = [];
  for (let i = 0; i < 4; i++) {
    promises.push(context.newPage());
  }
  
  await Promise.all(promises);
  console.log("Pages created.");
  await browser.close();
}

test().catch(console.error);
