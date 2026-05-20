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
  const vishalni = await prisma.user.findUnique({
    where: { email: "vishalni2004@gmail.com" }
  });
  
  const sb = await prisma.user.findUnique({
    where: { email: "sb.solobuild@gmail.com" }
  });

  // Group by ownerId
  const leads = await prisma.lead.groupBy({
    by: ['ownerId'],
    where: { organizationId: sb.organizationId },
    _count: { id: true }
  });

  console.log("Leads grouped by owner ID:");
  for (const group of leads) {
    const owner = await prisma.user.findUnique({
      where: { id: group.ownerId },
      select: { name: true, email: true }
    });
    console.log(`- Owner: ${owner ? `${owner.name} (${owner.email})` : 'Unknown'}, ID: ${group.ownerId}, Count: ${group._count.id}`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
