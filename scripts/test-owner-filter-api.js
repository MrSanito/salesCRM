const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

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

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

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
  const boss = await prisma.user.findFirst({
    where: { email: "sb.solobuild@gmail.com" }
  });

  // Let's sign a JWT token for the boss
  const token = jwt.sign({ userId: boss.id }, JWT_SECRET);

  // Let's call the super-list API logic directly
  const page = 1;
  const pageSize = 20;
  const view = "subordinates";
  const isSuperAdmin = boss.email === "sb.solobuild@gmail.com";
  const isOrgAdmin = boss.role === "ORG_ADMIN" || boss.role === "CEO";

  const baseWhere = {
    organizationId: boss.organizationId
  };

  // New logic
  if (view === "subordinates") {
    if (isSuperAdmin || isOrgAdmin) {
      baseWhere.ownerId = { not: boss.id };
    } else if (boss.role === "MANAGER") {
      const subordinates = await prisma.user.findMany({
        where: { managerId: boss.id },
        select: { id: true }
      });
      const subIds = subordinates.map(s => s.id);
      baseWhere.ownerId = { in: subIds };
    } else {
      baseWhere.ownerId = "none";
    }
  } else {
    baseWhere.ownerId = boss.id;
  }

  const queryWhere = { ...baseWhere };
  
  // Apply filter_owner=vishalni2004
  queryWhere.owner = { name: { in: ["vishalni2004"] } };

  console.log("Simulating API Query with queryWhere:", JSON.stringify(queryWhere, null, 2));

  const leads = await prisma.lead.findMany({
    where: queryWhere,
    select: {
      id: true,
      contactName: true,
      company: true,
      owner: { select: { id: true, name: true, initials: true } }
    }
  });

  console.log(`Leads count returned: ${leads.length}`);
  leads.forEach(l => {
    console.log(`- Lead: ${l.contactName}, Owner: ${l.owner?.name}`);
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
