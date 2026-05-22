const { loadEnvConfig } = require('@next/env');
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const jwt = require('jsonwebtoken');
const http = require('http');

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Fetch User
    const user = await prisma.user.findFirst({
      where: { email: "vishalni2004@gmail.com" },
      select: { id: true }
    });

    if (!user) {
      console.error("Test user not found!");
      return;
    }

    // 2. Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    console.log("Generated test token for user:", user.id);

    // 3. Define target Cloudinary URL (the test raw report we just uploaded)
    const reportUrl = 'https://res.cloudinary.com/dorufd8gh/raw/upload/v1779380155/performance_reports/crm_report_full_test_1779380148268';
    
    // We request the local proxy
    const localUrl = `http://localhost:3000/api/reports/download?url=${encodeURIComponent(reportUrl)}`;
    console.log("Fetching from local proxy:", localUrl);

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/reports/download?url=${encodeURIComponent(reportUrl)}`,
      method: 'GET',
      headers: {
        'Cookie': `token=${token}`
      }
    };

    const req = http.request(options, (res) => {
      console.log('Proxy Status Code:', res.statusCode);
      console.log('Proxy Headers:', JSON.stringify(res.headers, null, 2));

      let chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log('Received response body length:', buffer.length, 'bytes');
        if (buffer.length > 0) {
          const firstBytes = buffer.toString('utf8', 0, 50);
          console.log('First 50 characters of response body:');
          console.log(firstBytes);
          console.log('Is valid PDF header?', buffer.toString('utf8', 0, 4) === '%PDF');
        }
      });
    });

    req.on('error', (err) => {
      console.error('Error fetching from local proxy:', err);
    });

    req.end();

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
