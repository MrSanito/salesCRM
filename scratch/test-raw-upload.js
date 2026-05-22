const { loadEnvConfig } = require('@next/env');
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const { v2: cloudinary } = require('cloudinary');
const PDFDocument = require('pdfkit');
const https = require('https');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function main() {
  try {
    console.log("Generating simple PDF...");
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on("data", chunk => chunks.push(chunk));
    
    doc.fontSize(20).text("Hello from Antigravity Raw Upload Test!");
    doc.fontSize(12).text("Checking if raw upload is delivered correctly by Cloudinary.");
    doc.end();

    const pdfBuffer = await new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", err => reject(err));
    });

    console.log("Uploading to Cloudinary as raw...");
    const uploadRes = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "performance_reports",
          // For raw resource type, we should include the filename extensions in the public_id to make it load correctly in the browser.
          public_id: `crm_report_raw_test_${Date.now()}.pdf`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(pdfBuffer);
    });

    const fileUrl = uploadRes.secure_url;
    console.log("Uploaded URL:", fileUrl);

    console.log("Fetching URL headers...");
    https.get(fileUrl, (res) => {
      console.log('Status Code:', res.statusCode);
      console.log('Headers:', JSON.stringify(res.headers, null, 2));
      
      let data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        console.log('Body length:', buffer.length);
        if (buffer.length > 0) {
          console.log('First 50 bytes (as string):', buffer.toString('utf8', 0, Math.min(50, buffer.length)));
        }
      });
    }).on('error', (err) => {
      console.error('Error fetching URL:', err);
    });

  } catch (err) {
    console.error("Error:", err);
  }
}

main();
