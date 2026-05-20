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

  const isSuperAdmin = false;
  const isOrgAdmin = true;

  // Let's simulate the query with filter_owner="" or filter_owner="undefined" or filter_owner="null"
  const testCases = [
    { filterOwner: undefined, label: "undefined (parameter not in URL)" },
    { filterOwner: null, label: "null (parameter not in URL)" },
    { filterOwner: "", label: "empty string" },
    { filterOwner: "undefined", label: "string 'undefined'" }
  ];

  for (const tc of testCases) {
    const baseWhere = { organizationId: user.organizationId };
    
    // Apply our new logic
    const view = "subordinates";
    const filterOwner = tc.filterOwner;

    if (view === "subordinates") {
      if (isSuperAdmin || isOrgAdmin) {
        if (!filterOwner) {
          baseWhere.ownerId = { not: user.id };
        }
      }
    }

    const queryWhere = { ...baseWhere };
    if (filterOwner) {
      queryWhere.owner = { name: { in: filterOwner.split(",") } };
    }

    const leads = await prisma.lead.findMany({
      where: queryWhere
    });

    console.log(`Test case with filterOwner = ${tc.filterOwner} (${tc.label}) leads count:`, leads.length);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
