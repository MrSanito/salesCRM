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
  const isOrgAdmin = true; // ORG_ADMIN
  
  // Test case 1: Subordinates, filterOwner is null
  {
    const baseWhere = { organizationId: user.organizationId };
    const view = "subordinates";
    const filterOwner = null;

    if (view === "subordinates") {
      if (isSuperAdmin || isOrgAdmin) {
        if (!filterOwner) {
          baseWhere.ownerId = { not: user.id };
        }
      }
    }
    const leads = await prisma.lead.findMany({
      where: baseWhere
    });
    console.log("Test Case 1 (filterOwner=null) count:", leads.length);
  }

  // Test case 2: Subordinates, filterOwner is "Rahul"
  {
    const baseWhere = { organizationId: user.organizationId };
    const view = "subordinates";
    const filterOwner = "Rahul";

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
      where: queryWhere,
      include: { owner: true }
    });
    console.log("Test Case 2 (filterOwner=Rahul) count:", leads.length);
    if (leads.length > 0) {
      console.log("Sample lead owner:", leads[0].owner.name);
    }
  }

  // Test case 3: Subordinates, filterOwner is "vishalni2004"
  {
    const baseWhere = { organizationId: user.organizationId };
    const view = "subordinates";
    const filterOwner = "vishalni2004";

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
      where: queryWhere,
      include: { owner: true }
    });
    console.log("Test Case 3 (filterOwner=vishalni2004) count:", leads.length);
    if (leads.length > 0) {
      console.log("Sample lead owner:", leads[0].owner.name);
    }
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
