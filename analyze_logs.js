const fs = require('fs');

function analyzeLog(filename) {
  const data = fs.readFileSync(filename, 'utf16le');
  const lines = data.split('\n');
  
  let totalExtracted = 0;
  let totalTimeMs = 0;
  let speeds = [];
  
  for (const line of lines) {
    if (line.includes('[VERIFICATION] Extracted Business:')) {
      totalExtracted++;
    }
    const timeMatch = line.match(/timeMs:\s*(\d+)/);
    if (timeMatch) {
      totalTimeMs += parseInt(timeMatch[1], 10);
    }
    const speedMatch = line.match(/speedPerMin:\s*"([\d.]+)"/);
    if (speedMatch) {
      speeds.push(parseFloat(speedMatch[1]));
    }
  }
  
  const avgTimeMs = totalExtracted > 0 ? totalTimeMs / totalExtracted : 0;
  const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
  
  console.log(`--- ${filename} ---`);
  console.log(`Businesses Extracted: ${totalExtracted}`);
  console.log(`Average Extraction Time: ${Math.round(avgTimeMs)} ms`);
  console.log(`Average Speed: ${avgSpeed.toFixed(2)} businesses / min\n`);
}

analyzeLog('test1_log.txt');
analyzeLog('test2_log.txt');
try { analyzeLog('test3_log.txt'); } catch(e) {}
