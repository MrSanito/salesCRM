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
  const user = await prisma.user.findFirst({
    where: { email: "vishalni2004@gmail.com" }
  });

  const leads = await prisma.lead.findMany({
    where: { ownerId: user.id },
    include: {
      owner: true,
      source: true,
    }
  });

  console.log("Leads count:", leads.length);
  leads.forEach(l => {
    console.log(`Lead ID: ${l.id}, Name: ${l.contactName}, Owner: ${l.owner.name}, Stage: ${l.stage}, OrganizationId: ${l.organizationId}, SourceId: ${l.sourceId}, City: ${l.city}`);
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
