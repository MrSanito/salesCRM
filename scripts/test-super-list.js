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

async function runTest(email) {
  console.log(`\n=== TESTING FOR USER: ${email} ===`);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, organizationId: true, role: true, name: true, email: true }
  });

  if (!user) {
    console.log("User not found!");
    return;
  }

  const baseWhere = {
    organizationId: user.organizationId,
  };

  const isSuperAdmin = user.email === "sb.solobuild@gmail.com";
  const isOrgAdmin = user.role === "ORG_ADMIN" || user.role === "CEO";
  const view = "subordinates";

  // Role-based access
  if (view === "subordinates" && (isOrgAdmin || isSuperAdmin)) {
    baseWhere.ownerId = { not: user.id };
  } else if (!isSuperAdmin) {
    baseWhere.ownerId = user.id;
  }

  console.log("Query where clause:", JSON.stringify(baseWhere, null, 2));

  const leads = await prisma.lead.findMany({
    where: baseWhere,
    select: {
      id: true,
      contactName: true,
      owner: { select: { id: true, name: true, email: true } }
    }
  });

  console.log(`Found ${leads.length} leads in subordinate view:`);
  leads.forEach(l => {
    console.log(`- Lead: ${l.contactName} (ID: ${l.id}) owned by ${l.owner.name} (${l.owner.email})`);
  });
}

async function main() {
  await runTest("sb.solobuild@gmail.com");
  await runTest("vishalni2004@gmail.com");
  
  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
