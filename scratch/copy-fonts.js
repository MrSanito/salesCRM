const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'node_modules', 'pdfkit', 'js', 'data');
const destDir = path.join(__dirname, '..', 'public', 'fonts');

console.log("Source directory:", srcDir);
console.log("Destination directory:", destDir);

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

if (fs.existsSync(srcDir)) {
  const files = fs.readdirSync(srcDir);
  files.forEach(file => {
    if (file.endsWith('.afm')) {
      const srcFile = path.join(srcDir, file);
      const destFile = path.join(destDir, file);
      fs.copyFileSync(srcFile, destFile);
      console.log(`Copied ${file} successfully to ${destFile}`);
    }
  });
  console.log("All standard AFM fonts copied successfully!");
} else {
  console.error("Source directory not found:", srcDir);
}
