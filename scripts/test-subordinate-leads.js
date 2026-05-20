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
  // Let's find vishalni and sb.solobuild
  const vishalni = await prisma.user.findUnique({
    where: { email: "vishalni2004@gmail.com" }
  });
  
  const sb = await prisma.user.findUnique({
    where: { email: "sb.solobuild@gmail.com" }
  });

  console.log("Vishalni User ID:", vishalni.id, "Role:", vishalni.role);
  console.log("SuperAdmin User ID:", sb.id, "Role:", sb.role);

  // Query as sb.solobuild (Super Admin) for Subordinate Leads
  // Logic from route.ts for sb.solobuild:
  // view === "subordinates" && (isOrgAdmin || isSuperAdmin) -> ownerId: { not: sb.id }
  const sbSubordinateLeads = await prisma.lead.findMany({
    where: {
      organizationId: sb.organizationId,
      ownerId: { not: sb.id }
    },
    select: {
      id: true,
      contactName: true,
      ownerId: true,
      owner: { select: { email: true } }
    }
  });

  console.log(`\nSuperAdmin Subordinate Leads Count: ${sbSubordinateLeads.length}`);
  const targetLead = sbSubordinateLeads.find(l => l.contactName.includes("standard lead of m"));
  if (targetLead) {
    console.log("Target lead found in SuperAdmin subordinate leads!", targetLead);
  } else {
    console.log("Target lead NOT found in SuperAdmin subordinate leads!");
  }

  // Let's check how many total leads exist in organization
  const allLeads = await prisma.lead.findMany({
    where: { organizationId: sb.organizationId },
    select: { id: true, contactName: true, ownerId: true }
  });
  console.log(`\nTotal Leads in Org: ${allLeads.length}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
