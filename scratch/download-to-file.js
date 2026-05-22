const fs = require('fs');
const https = require('https');

const url = 'https://res.cloudinary.com/dorufd8gh/raw/upload/v1779380155/performance_reports/crm_report_full_test_1779380148268';
const outputPath = 'scratch/test.pdf';

console.log("Fetching PDF from:", url);

https.get(url, (res) => {
  console.log('Cloudinary status:', res.statusCode);
  if (res.statusCode !== 200) {
    console.error('Failed to fetch. Status code:', res.statusCode);
    return;
  }
  
  const fileStream = fs.createWriteStream(outputPath);
  res.pipe(fileStream);
  
  fileStream.on('finish', () => {
    fileStream.close();
    console.log('Finished writing to', outputPath);
    const stats = fs.statSync(outputPath);
    console.log('File size:', stats.size, 'bytes');
    
    // Check first 100 bytes
    const fd = fs.openSync(outputPath, 'r');
    const buffer = Buffer.alloc(100);
    fs.readSync(fd, buffer, 0, 100, 0);
    fs.closeSync(fd);
    
    console.log('First 50 characters of PDF:');
    console.log(buffer.toString('utf8', 0, 50));
    console.log('Ends with valid PDF structure? First 4 bytes are:', buffer.toString('utf8', 0, 4));
  });
}).on('error', (err) => {
  console.error('Error:', err);
});
