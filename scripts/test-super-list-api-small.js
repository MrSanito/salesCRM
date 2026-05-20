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

async function simulateQuery(userEmail, viewParam) {
  const user = await prisma.user.findFirst({
    where: { email: userEmail }
  });
  if (!user) {
    console.log(`User ${userEmail} not found!`);
    return;
  }

  console.log(`\n--- Simulating for User: ${user.name} (${user.email}), Role: ${user.role}, View: "${viewParam}" ---`);

  const baseWhere = {
    organizationId: user.organizationId,
  };

  const isSuperAdmin = user.email === "sb.solobuild@gmail.com";
  const isOrgAdmin = user.role === "ORG_ADMIN" || user.role === "CEO";

  // Role-based access
  if (viewParam === "subordinates" && (isOrgAdmin || isSuperAdmin)) {
    baseWhere.ownerId = { not: user.id };
  } else if (!isSuperAdmin) {
    baseWhere.ownerId = user.id;
  }

  const queryWhere = { ...baseWhere };
  console.log("queryWhere:", JSON.stringify(queryWhere, null, 2));

  const leads = await prisma.lead.findMany({
    where: queryWhere,
    select: {
      id: true,
      contactName: true,
      company: true,
      ownerId: true,
      owner: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  console.log(`Found ${leads.length} leads:`);
  leads.forEach(l => {
    console.log(`- ${l.contactName} (${l.company}), Owner: ${l.owner?.name} (${l.owner?.email})`);
  });
}

async function main() {
  // Let's simulate for vishalni2004@gmail.com
  await simulateQuery("vishalni2004@gmail.com", null);
  await simulateQuery("vishalni2004@gmail.com", "subordinates");

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
