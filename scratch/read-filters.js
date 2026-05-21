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

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const connectionString = process.env.NODE_ENV === "production"
  ? (process.env.PROD_DATABASE_URL || process.env.DATABASE_URL || "")
  : (process.env.DATABASE_URL || "");

const pool = new pg.Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const filters = await prisma.sidebarFilter.findMany({
    include: {
      createdBy: {
        select: {
          email: true,
          name: true
        }
      }
    }
  });
  console.log("=== ALL SIDEBAR FILTERS ===");
  console.log(JSON.stringify(filters, null, 2));
  
  const leads = await prisma.lead.findMany({
    take: 10,
    select: {
      id: true,
      contactName: true,
      stage: true,
      subStatus: true
    }
  });
  console.log("=== SAMPLE LEADS ===");
  console.log(JSON.stringify(leads, null, 2));
  
  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
