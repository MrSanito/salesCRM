const https = require('https');

const url = 'https://res.cloudinary.com/dorufd8gh/raw/upload/v1779191461/proposals/proposal_08958f5a-0a50-4bbb-b7d6-c20b5023ce6e_1779191456255.docx';

https.get(url, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = [];
  res.on('data', (chunk) => data.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(data);
    console.log('Body length:', buffer.length);
    if (buffer.length > 0) {
      console.log('First 50 bytes (hex):', buffer.toString('hex', 0, Math.min(50, buffer.length)));
    }
  });
}).on('error', (err) => {
  console.error('Error fetching URL:', err);
});
