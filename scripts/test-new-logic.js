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

async function simulateNewLogic(email, view) {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  if (!user) {
    console.log(`User ${email} not found!`);
    return;
  }

  const baseWhere = {
    organizationId: user.organizationId
  };

  const isSuperAdmin = user.email === "sb.solobuild@gmail.com";
  const isOrgAdmin = user.role === "ORG_ADMIN" || user.role === "CEO";

  // Role-based access (New Logic)
  if (view === "subordinates") {
    if (isSuperAdmin || isOrgAdmin) {
      baseWhere.ownerId = { not: user.id };
    } else if (user.role === "MANAGER") {
      const subordinates = await prisma.user.findMany({
        where: { managerId: user.id },
        select: { id: true }
      });
      const subIds = subordinates.map(s => s.id);
      baseWhere.ownerId = { in: subIds };
    } else {
      baseWhere.ownerId = "none";
    }
  } else {
    // Default view: My Leads
    baseWhere.ownerId = user.id;
  }

  const leads = await prisma.lead.findMany({
    where: baseWhere,
    select: { id: true, contactName: true, owner: { select: { name: true } } }
  });

  console.log(`Simulated [${email}] view=[${view || 'null'}] -> Count: ${leads.length}`);
  if (leads.length > 0) {
    leads.slice(0, 3).forEach(l => console.log(`  - Lead: ${l.contactName}, Owner: ${l.owner?.name}`));
    if (leads.length > 3) console.log(`  - ... and ${leads.length - 3} more`);
  }
}

async function main() {
  console.log("Simulating New Logic for Boss (sb.solobuild@gmail.com):");
  await simulateNewLogic("sb.solobuild@gmail.com", null);
  await simulateNewLogic("sb.solobuild@gmail.com", "subordinates");

  console.log("\nSimulating New Logic for vishalni (vishalni2004@gmail.com):");
  await simulateNewLogic("vishalni2004@gmail.com", null);
  await simulateNewLogic("vishalni2004@gmail.com", "subordinates");

  console.log("\nSimulating New Logic for Guts (Gutsqureshi@gmail.com):");
  await simulateNewLogic("Gutsqureshi@gmail.com", null);
  await simulateNewLogic("Gutsqureshi@gmail.com", "subordinates");

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
