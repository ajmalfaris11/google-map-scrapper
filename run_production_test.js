const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const keywords = [
  'Restaurants in Kochi', 'Restaurants in Trivandrum', 'Restaurants in Calicut',
  'Hospitals in Kochi', 'Hospitals in Trivandrum',
  'Resorts in Kerala', 'Hotels in Kerala',
  'Gyms in Kochi', 'Schools in Kerala'
];

const startTime = Date.now();
const MAX_TIME_MS = 60 * 60 * 1000; // 60 minutes
const MAX_BUSINESSES = 1000;
let totalExtracted = 0;

const logFile = path.join(__dirname, 'production_log.txt');
if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

console.log('Starting Production Validation Run...');

for (const keyword of keywords) {
  if (Date.now() - startTime >= MAX_TIME_MS) {
    console.log('60 minutes elapsed. Stopping run.');
    break;
  }
  if (totalExtracted >= MAX_BUSINESSES) {
    console.log(`Reached ${MAX_BUSINESSES} businesses. Stopping run.`);
    break;
  }

  console.log(`\n======================================================`);
  console.log(`Running scrape for: "${keyword}"`);
  console.log(`======================================================\n`);

  // Update .env with the keyword
  let envConfig = fs.readFileSync('.env', 'utf8');
  envConfig = envConfig.replace(/KEYWORD=".*"/, `KEYWORD="${keyword}"`);
  fs.writeFileSync('.env', envConfig);

  try {
    // Run the scraper and append to production_log.txt
    // We use stdio: 'pipe' and append manually to handle UTF-8 properly instead of UTF-16 from powershell >
    const child = require('child_process').spawnSync('npm', ['run', 'scrape'], {
      encoding: 'utf8',
      shell: true,
      maxBuffer: 1024 * 1024 * 50 // 50MB buffer
    });
    
    const output = (child.stdout || '') + (child.stderr || '');
    fs.appendFileSync(logFile, output, 'utf8');

    // Count extractions in this run
    const lines = output.split('\n');
    let runExtracted = 0;
    for (const line of lines) {
      if (line.includes('[VERIFICATION] Extracted Business:')) {
        runExtracted++;
      }
    }
    
    totalExtracted += runExtracted;
    console.log(`Extracted in this run: ${runExtracted}`);
    console.log(`Total Extracted so far: ${totalExtracted}`);
    console.log(`Elapsed Time: ${Math.round((Date.now() - startTime) / 1000 / 60)} minutes`);

  } catch (err) {
    console.error(`Error running scraper for ${keyword}:`, err.message);
  }
}

console.log(`\nProduction Validation Run Complete.`);
console.log(`Total Extracted: ${totalExtracted}`);
console.log(`Total Time: ${Math.round((Date.now() - startTime) / 1000)} seconds`);
