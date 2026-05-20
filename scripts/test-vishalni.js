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
  const user = await prisma.user.findUnique({
    where: { email: "vishalni2004@gmail.com" }
  });

  if (!user) {
    console.log("User vishalni2004 not found!");
    return;
  }

  console.log("User details:", { id: user.id, organizationId: user.organizationId, role: user.role });

  // 1. My Leads View
  {
    const baseWhere = { organizationId: user.organizationId };
    const isSuperAdmin = user.email === "sb.solobuild@gmail.com";
    const isOrgAdmin = user.role === "ORG_ADMIN" || user.role === "CEO";
    
    // For My Leads (view is null/empty)
    if (!isSuperAdmin) {
      baseWhere.ownerId = user.id;
    }

    const leads = await prisma.lead.findMany({
      where: baseWhere,
      select: { id: true, contactName: true, ownerId: true }
    });
    console.log(`\n--- My Leads View (Count: ${leads.length}) ---`);
    leads.forEach(l => console.log(`- ${l.contactName} (${l.id}) ownerId: ${l.ownerId}`));
  }

  // 2. Subordinate Leads View
  {
    const baseWhere = { organizationId: user.organizationId };
    const isSuperAdmin = user.email === "sb.solobuild@gmail.com";
    const isOrgAdmin = user.role === "ORG_ADMIN" || user.role === "CEO";
    
    // For Subordinates
    if (isOrgAdmin || isSuperAdmin) {
      baseWhere.ownerId = { not: user.id };
    }

    const leads = await prisma.lead.findMany({
      where: baseWhere,
      select: { id: true, contactName: true, ownerId: true }
    });
    console.log(`\n--- Subordinate Leads View (Count: ${leads.length}) ---`);
    leads.slice(0, 10).forEach(l => console.log(`- ${l.contactName} (${l.id}) ownerId: ${l.ownerId}`));
    if (leads.length > 10) console.log(`... and ${leads.length - 10} more`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
