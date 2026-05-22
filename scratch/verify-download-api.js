const https = require('https');

// The newly generated Cloudinary URL from the previous step
const url = 'https://res.cloudinary.com/dorufd8gh/raw/upload/v1779380025/performance_reports/crm_report_full_test_1779380019841';

console.log("Simulating server-side fetch of Cloudinary raw PDF:", url);

https.get(url, (res) => {
  console.log('Cloudinary response status:', res.statusCode);
  console.log('Cloudinary response headers:', JSON.stringify(res.headers, null, 2));
  
  let chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    console.log('Buffer length:', buffer.length);
    if (buffer.length > 0) {
      console.log('First 4 bytes of fetched body (should be %PDF):', buffer.toString('utf8', 0, 4));
      console.log('Is valid PDF format?', buffer.toString('utf8', 0, 4) === '%PDF');
    }
  });
}).on('error', (err) => {
  console.error('Error fetching URL:', err);
});
