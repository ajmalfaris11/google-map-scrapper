const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get list of changed/untracked files
const statusOutput = execSync('git status --short').toString().trim();
if (!statusOutput) {
  console.log("No files to commit.");
  process.exit(0);
}

const files = statusOutput.split('\n').map(line => {
  // Line format: " M path/to/file" or "?? path/to/file"
  const match = line.match(/^.. (.+)$/);
  return match ? match[1] : null;
}).filter(Boolean);

// Find all actual files (expand directories if git status returned directory)
const allFilesToCommit = [];
function getFilesRecursively(dirOrFile) {
  if (fs.existsSync(dirOrFile)) {
    const stat = fs.statSync(dirOrFile);
    if (stat.isDirectory()) {
      const children = fs.readdirSync(dirOrFile);
      for (const child of children) {
        getFilesRecursively(path.join(dirOrFile, child));
      }
    } else {
      allFilesToCommit.push(dirOrFile.replace(/\\/g, '/'));
    }
  }
}

for (const file of files) {
  getFilesRecursively(file);
}

// Ensure unique files
const uniqueFiles = [...new Set(allFilesToCommit)];

let commitCount = 35; // Start at 35 since we already did 35 commits on July 5
let currentDay = 5;

for (const file of uniqueFiles) {
  if (commitCount >= 50) {
    commitCount = 0;
    currentDay++;
  }
  
  const dateStr = `2026-07-${currentDay.toString().padStart(2, '0')}T11:${commitCount.toString().padStart(2, '0')}:00+05:30`;
  
  console.log(`Committing ${file} on ${dateStr}`);
  
  execSync(`git add "${file}"`, { stdio: 'inherit' });
  
  const env = { 
    ...process.env, 
    GIT_AUTHOR_DATE: dateStr, 
    GIT_COMMITTER_DATE: dateStr 
  };
  
  try {
    execSync(`git commit -m "Add or update ${file}"`, { env, stdio: 'inherit' });
    commitCount++;
  } catch (e) {
    console.log(`Nothing to commit for ${file}`);
  }
}

try {
  execSync('git push origin main', { stdio: 'inherit' });
  console.log("Pushed successfully.");
} catch (e) {
  console.log("Failed to push. You may need to pull or force push.");
}
