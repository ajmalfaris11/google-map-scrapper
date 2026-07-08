const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('.ts')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

// 1. Fix package.json for lead-engine
const appPkgPath = path.join(process.cwd(), 'apps/lead-engine/package.json');
if (fs.existsSync(appPkgPath)) {
  const appPkg = JSON.parse(fs.readFileSync(appPkgPath, 'utf8'));
  appPkg.dependencies = appPkg.dependencies || {};
  appPkg.dependencies['@lead-platform/config'] = 'workspace:*';
  appPkg.dependencies['@lead-platform/database'] = 'workspace:*';
  appPkg.dependencies['@lead-platform/shared'] = 'workspace:*';
  appPkg.dependencies['@lead-platform/types'] = 'workspace:*';
  appPkg.dependencies['@lead-platform/queue'] = 'workspace:*';
  if (appPkg.devDependencies && appPkg.devDependencies['@prisma/client']) {
    delete appPkg.devDependencies['@prisma/client'];
  }
  fs.writeFileSync(appPkgPath, JSON.stringify(appPkg, null, 2));
}

// 2. Fix imports in all files
const allFiles = [
  ...walkSync(path.join(process.cwd(), 'apps/lead-engine/src')),
  ...walkSync(path.join(process.cwd(), 'packages/database/src')),
  ...walkSync(path.join(process.cwd(), 'packages/shared/src')),
  ...walkSync(path.join(process.cwd(), 'packages/queue/src')),
  ...walkSync(path.join(process.cwd(), 'packages/config/src'))
];

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  content = content.replace(/from\s+['"].*\/config\/ConfigService['"]/g, 'from \'@lead-platform/config\'');
  content = content.replace(/from\s+['"].*\/config\/env\.validator['"]/g, 'from \'@lead-platform/config\'');
  
  content = content.replace(/from\s+['"].*\/models\/Business['"]/g, 'from \'@lead-platform/types\'');
  content = content.replace(/from\s+['"].*\/models\/ExtractionJob['"]/g, 'from \'@lead-platform/types\'');
  content = content.replace(/from\s+['"].*\/models\/Job['"]/g, 'from \'@lead-platform/types\'');
  
  content = content.replace(/from\s+['"].*\/queue\/MemoryQueue['"]/g, 'from \'@lead-platform/queue\'');
  content = content.replace(/from\s+['"].*\/queue\/Queue['"]/g, 'from \'@lead-platform/queue\'');
  
  content = content.replace(/from\s+['"].*\/validators\/BusinessValidator['"]/g, 'from \'@lead-platform/shared\'');
  content = content.replace(/from\s+['"].*\/validators\/JobValidator['"]/g, 'from \'@lead-platform/shared\'');
  
  content = content.replace(/from\s+['"].*\/repositories\/PrismaClient['"]/g, 'from \'@lead-platform/database\'');
  
  content = content.replace(/from\s+['"].*\/types\/interfaces['"]/g, 'from \'@lead-platform/types\'');
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Updated imports in: ' + file);
  }
}
