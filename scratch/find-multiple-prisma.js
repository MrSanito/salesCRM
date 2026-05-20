const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const apiDir = path.join(__dirname, '../app/api');
const results = [];

walkDir(apiDir, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let prismaCount = 0;
    let occurrences = [];
    
    for (let i=0; i<lines.length; i++) {
        if (lines[i].includes('await prisma.') && !lines[i].includes('prisma.$transaction')) {
            prismaCount++;
            occurrences.push(i + 1);
        }
    }
    
    if (prismaCount > 1) {
        results.push({ file: filePath.replace(apiDir, ''), count: prismaCount, lines: occurrences });
    }
  }
});

results.sort((a,b) => b.count - a.count);
console.log(JSON.stringify(results, null, 2));
