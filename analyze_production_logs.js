const fs = require('fs');
const path = require('path');

function analyzeLogs(filename) {
  if (!fs.existsSync(filename)) {
    console.log(`Log file ${filename} not found.`);
    return;
  }

  const data = fs.readFileSync(filename, 'utf8');
  const lines = data.split('\n');

  let totalDiscovered = 0;
  let totalDuplicates = 0;
  let totalExtracted = 0;
  let extractionTimes = [];
  let rssValues = [];
  let heapValues = [];
  let queueSizes = [];

  // Variables to track per-run progress updates
  let currentRunUnique = 0;
  let currentRunDupes = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('Progress Update')) {
      // Look ahead a few lines to parse uniqueUrls and duplicates
      for (let j = 1; j <= 6 && i + j < lines.length; j++) {
        const nextLine = lines[i + j];
        if (nextLine.includes('uniqueUrls:')) {
          currentRunUnique = parseInt(nextLine.split(':')[1].trim());
        }
        if (nextLine.includes('duplicates:')) {
          currentRunDupes = parseInt(nextLine.split(':')[1].trim());
        }
      }
    }

    if (line.includes('Graceful shutdown complete.')) {
      // End of a run, add to totals
      totalDiscovered += currentRunUnique;
      totalDuplicates += currentRunDupes;
      currentRunUnique = 0;
      currentRunDupes = 0;
    }

    if (line.includes('[VERIFICATION] Extracted Business:')) {
      totalExtracted++;
    }

    const timeMatch = line.match(/timeMs:\s*(\d+)/);
    if (timeMatch) {
      extractionTimes.push(parseInt(timeMatch[1], 10));
    }

    const rssMatch = line.match(/rss:\s*"(\d+)MB"/);
    if (rssMatch) rssValues.push(parseInt(rssMatch[1], 10));

    const heapMatch = line.match(/heapUsed:\s*"(\d+)MB"/);
    if (heapMatch) heapValues.push(parseInt(heapMatch[1], 10));

    const queueMatch = line.match(/queueSize:\s*(\d+)/);
    if (queueMatch) queueSizes.push(parseInt(queueMatch[1], 10));
  }

  // Sort extraction times to calculate percentiles
  extractionTimes.sort((a, b) => a - b);

  const avgTime = extractionTimes.length > 0 ? extractionTimes.reduce((a, b) => a + b, 0) / extractionTimes.length : 0;
  const medianTime = extractionTimes.length > 0 ? extractionTimes[Math.floor(extractionTimes.length / 2)] : 0;
  const p95Time = extractionTimes.length > 0 ? extractionTimes[Math.floor(extractionTimes.length * 0.95)] : 0;

  const peakRss = rssValues.length > 0 ? Math.max(...rssValues) : 0;
  const avgRss = rssValues.length > 0 ? rssValues.reduce((a, b) => a + b, 0) / rssValues.length : 0;
  
  const peakHeap = heapValues.length > 0 ? Math.max(...heapValues) : 0;
  const avgHeap = heapValues.length > 0 ? heapValues.reduce((a, b) => a + b, 0) / heapValues.length : 0;

  const peakQueue = queueSizes.length > 0 ? Math.max(...queueSizes) : 0;
  const avgQueue = queueSizes.length > 0 ? queueSizes.reduce((a, b) => a + b, 0) / queueSizes.length : 0;

  const successRate = totalDiscovered > 0 ? (totalExtracted / totalDiscovered) * 100 : 0;
  const failureRate = 100 - successRate;

  console.log(`\n--- PRODUCTION METRICS ---`);
  console.log(`Total Discovered (Unique Validated): ${totalDiscovered}`);
  console.log(`Total Duplicates Found: ${totalDuplicates}`);
  console.log(`Total Extracted: ${totalExtracted}`);
  console.log(`Success Rate: ${successRate.toFixed(2)}%`);
  console.log(`Failure Rate: ${failureRate.toFixed(2)}%`);
  
  console.log(`\n--- EXTRACTION TIMES ---`);
  console.log(`Average: ${Math.round(avgTime)} ms`);
  console.log(`Median: ${medianTime} ms`);
  console.log(`95th Percentile: ${p95Time} ms`);

  console.log(`\n--- SYSTEM RESOURCE (RAM / QUEUE) ---`);
  console.log(`Peak RSS Memory: ${peakRss} MB`);
  console.log(`Average RSS Memory: ${Math.round(avgRss)} MB`);
  console.log(`Peak Heap Memory: ${peakHeap} MB`);
  console.log(`Average Heap Memory: ${Math.round(avgHeap)} MB`);
  console.log(`Peak Queue Depth: ${peakQueue}`);
  console.log(`Average Queue Depth: ${Math.round(avgQueue)}`);
}

analyzeLogs(path.join(__dirname, 'production_log.txt'));
