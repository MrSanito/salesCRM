const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  });
}

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

// Mock cookies and Request
const token = jwt.sign({ userId: '15968cd4-ec5f-444d-affb-4927bc45992e' }, JWT_SECRET);

const { GET } = require('../.next/server/app/api/leads/super-list/route.js') || require('../app/api/leads/super-list/route.ts');

async function test() {
  console.log("Mock Token:", token);
  // We can just run the logic directly or call the route handler.
  // Since calling Next.js route handler directly outside Next.js runtime is complex, 
  // let's just write a script that mimics the database query with the exact prisma filters 
  // to see if the database query is returning it, and check if any fields are null/empty.
}
test();
