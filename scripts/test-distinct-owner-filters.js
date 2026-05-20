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

const connectionString = process.env.DATABASE_URL || "";
const pool = new pg.Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const owners = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true
    }
  });
  console.log("Registered Users in DB:", owners);

  const leads = await prisma.lead.findMany({
    select: {
      id: true,
      contactName: true,
      ownerId: true,
      owner: { select: { id: true, name: true, email: true } }
    }
  });

  console.log("\nLeads and their Owners in DB:");
  leads.forEach(l => {
    console.log(`- Lead: ${l.contactName}, Owner ID: ${l.ownerId}, Owner Name: ${l.owner?.name}, Owner Email: ${l.owner?.email}`);
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
