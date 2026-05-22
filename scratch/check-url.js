const fetch = require('node-fetch'); // wait, let's see if node-fetch is available. We can also use standard fetch in newer node or generic http.get.
// Let's use standard https module to avoid external dependency issues.
const https = require('https');

const url = 'https://res.cloudinary.com/dorufd8gh/image/upload/v1779379696/performance_reports/crm_report_full_test_1779379684547.pdf';

https.get(url, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  // Let's also see if the body is actually a PDF (starts with %PDF) or some HTML error
  let data = [];
  res.on('data', (chunk) => {
    data.push(chunk);
  });
  res.on('end', () => {
    const buffer = Buffer.concat(data);
    console.log('Body length:', buffer.length);
    if (buffer.length > 0) {
      console.log('First 100 bytes (as string):', buffer.toString('utf8', 0, Math.min(100, buffer.length)));
      console.log('First 50 bytes (hex):', buffer.toString('hex', 0, Math.min(50, buffer.length)));
    }
  });
}).on('error', (err) => {
  console.error('Error fetching URL:', err);
});
