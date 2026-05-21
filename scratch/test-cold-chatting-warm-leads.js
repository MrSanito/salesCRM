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
  const testOrg = await prisma.organization.findFirst();
  if (!testOrg) {
    console.log("No organization found in database!");
    return;
  }
  const orgId = testOrg.id;
  const testUser = await prisma.user.findFirst({ where: { organizationId: orgId } });

  console.log("Creating/Updating test leads to test filtering...");
  
  // Create a lead with stage CHATTING and subStatus WARM_LEAD
  const lead1 = await prisma.lead.create({
    data: {
      contactName: "Warm Lead Test 1",
      company: "Warm Company",
      stage: "CHATTING",
      subStatus: "WARM_LEAD",
      organizationId: orgId,
      ownerId: testUser.id,
      createdById: testUser.id,
    }
  });

  // Create a lead with stage CHATTING and subStatus CHATTING
  const lead2 = await prisma.lead.create({
    data: {
      contactName: "Cold Lead Test 2",
      company: "Cold Company",
      stage: "CHATTING",
      subStatus: "CHATTING",
      organizationId: orgId,
      ownerId: testUser.id,
      createdById: testUser.id,
    }
  });

  try {
    console.log("\n=== TEST CASE 1: Querying COLD_CHATTING stage with NO subStatus filter ===");
    // In this case, WARM_LEAD must be excluded
    const queryWhere1 = {
      organizationId: orgId,
      stage: { in: ["COLD", "CHATTING"] },
      subStatus: { in: ["CHATTING"], not: "WARM_LEAD" }
    };
    
    console.log("queryWhere1:", JSON.stringify(queryWhere1, null, 2));
    const leads1 = await prisma.lead.findMany({ where: queryWhere1 });
    console.log(`Results: Found ${leads1.length} leads`);
    leads1.forEach(l => {
      console.log(`- Name: ${l.contactName}, Stage: ${l.stage}, SubStatus: ${l.subStatus}`);
    });
    
    const hasWarmLead1 = leads1.some(l => l.id === lead1.id);
    const hasColdLead1 = leads1.some(l => l.id === lead2.id);
    console.log(`Has Cold Lead (Expected: true): ${hasColdLead1}`);
    console.log(`Has Warm Lead (Expected: false): ${hasWarmLead1}`);

    console.log("\n=== TEST CASE 2: Querying COLD_CHATTING stage WITH explicit WARM_LEAD subStatus filter ===");
    // In this case, WARM_LEAD must be included
    const queryWhere2 = {
      organizationId: orgId,
      stage: { in: ["COLD", "CHATTING", "COLD_CHATTING"] },
      subStatus: { in: ["WARM_LEAD"] }
    };
    
    // Simulate our new API filter logic
    const isColdChattingFiltered2 = true;
    const activeSubStatuses2 = ["WARM_LEAD"]; // WARM_LEAD selected
    if (isColdChattingFiltered2) {
      if (!activeSubStatuses2.includes("WARM_LEAD")) {
        if (queryWhere2.subStatus?.in) {
          queryWhere2.subStatus = { in: queryWhere2.subStatus.in, not: "WARM_LEAD" };
        } else {
          queryWhere2.subStatus = { not: "WARM_LEAD" };
        }
      }
    }

    console.log("queryWhere2:", JSON.stringify(queryWhere2, null, 2));
    const leads2 = await prisma.lead.findMany({ where: queryWhere2 });
    console.log(`Results: Found ${leads2.length} leads`);
    leads2.forEach(l => {
      console.log(`- Name: ${l.contactName}, Stage: ${l.stage}, SubStatus: ${l.subStatus}`);
    });
    
    const hasWarmLead2 = leads2.some(l => l.id === lead1.id);
    const hasColdLead2 = leads2.some(l => l.id === lead2.id);
    console.log(`Has Cold Lead (Expected: false): ${hasColdLead2}`);
    console.log(`Has Warm Lead (Expected: true): ${hasWarmLead2}`);

  } finally {
    // Cleanup test data
    console.log("\nCleaning up test leads...");
    await prisma.lead.deleteMany({
      where: {
        id: { in: [lead1.id, lead2.id] }
      }
    });
    
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
