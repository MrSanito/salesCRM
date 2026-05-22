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

const connectionString = process.env.NODE_ENV === "production"
  ? (process.env.PROD_DATABASE_URL || process.env.DATABASE_URL || "")
  : (process.env.DATABASE_URL || "");

const pool = new pg.Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error("No organization found in database!");
    return;
  }
  console.log("Using Organization:", org.name, org.id);

  const ceo = await prisma.user.findFirst({ where: { organizationId: org.id, role: 'CEO' } });
  const manager = await prisma.user.findFirst({ where: { organizationId: org.id, role: 'MANAGER' } });
  const worker = await prisma.user.findFirst({ where: { organizationId: org.id, role: 'SALES_REP' } });

  console.log("CEO:", ceo ? `${ceo.name} (${ceo.id})` : "None");
  console.log("Manager:", manager ? `${manager.name} (${manager.id})` : "None");
  console.log("Sales Rep:", worker ? `${worker.name} (${worker.id})` : "None");

  // Create a sidebar filter with a specified owner (using CEO or manager ID)
  const targetOwner = worker || manager || ceo;
  if (!targetOwner) {
    console.error("No users found to set as lead owner!");
    return;
  }

  console.log(`\nCreating sidebar filter targeting owner: ${targetOwner.name} (${targetOwner.id})...`);
  const filter = await prisma.sidebarFilter.create({
    data: {
      name: "Test Owner Filter",
      organizationId: org.id,
      createdById: (ceo || manager || worker).id,
      ownerId: targetOwner.id,
    },
    include: {
      owner: { select: { name: true } }
    }
  });
  console.log("Successfully created filter:", {
    id: filter.id,
    name: filter.name,
    ownerId: filter.ownerId,
    owner: filter.owner
  });

  // Verify custom query filtering logic for CEO (should show target owner's leads)
  if (ceo) {
    console.log("\n--- Testing CEO role queries with filter ---");
    const isSuperAdmin = ceo.email === "sb.solobuild@gmail.com";
    const isOrgAdmin = ceo.role === "ORG_ADMIN" || ceo.role === "CEO";
    
    const baseWhere = { organizationId: org.id };
    if (filter.ownerId) {
      if (isSuperAdmin || isOrgAdmin) {
        baseWhere.ownerId = filter.ownerId;
      }
    }
    console.log("CEO baseWhere expected:", { organizationId: org.id, ownerId: targetOwner.id });
    console.log("CEO baseWhere actual:", baseWhere);
    
    const leadsCount = await prisma.lead.count({ where: baseWhere });
    console.log(`CEO can see ${leadsCount} leads owned by ${targetOwner.name}`);
  }

  // Verify custom query filtering logic for MANAGER
  if (manager) {
    console.log("\n--- Testing MANAGER role queries with filter ---");
    // Find manager's subordinates
    const subordinates = await prisma.user.findMany({
      where: { managerId: manager.id },
      select: { id: true }
    });
    const subIds = subordinates.map(s => s.id);
    const allowedIds = [...subIds, manager.id];
    console.log("Manager allowed owner IDs:", allowedIds);

    const baseWhere = { organizationId: org.id };
    if (filter.ownerId) {
      if (allowedIds.includes(filter.ownerId)) {
        baseWhere.ownerId = filter.ownerId;
      } else {
        baseWhere.ownerId = "none";
      }
    }
    console.log("Manager baseWhere expected ownerId:", allowedIds.includes(targetOwner.id) ? targetOwner.id : "none");
    console.log("Manager baseWhere actual:", baseWhere);
  }

  // Verify custom query filtering logic for WORKER
  if (worker) {
    console.log("\n--- Testing WORKER role queries with filter ---");
    const baseWhere = { organizationId: org.id };
    if (filter.ownerId) {
      if (filter.ownerId === worker.id) {
        baseWhere.ownerId = worker.id;
      } else {
        baseWhere.ownerId = "none";
      }
    }
    console.log("Worker baseWhere expected ownerId:", targetOwner.id === worker.id ? worker.id : "none");
    console.log("Worker baseWhere actual:", baseWhere);
  }

  // Clean up
  console.log("\nCleaning up test filter...");
  await prisma.sidebarFilter.delete({ where: { id: filter.id } });
  console.log("Cleanup done.");

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (err) => {
  console.error("Test failed:", err);
  await prisma.$disconnect();
  await pool.end();
});
