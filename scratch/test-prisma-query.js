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
  const testOrg = await prisma.organization.findFirst();
  const orgId = testOrg.id;

  // Let's create two test leads
  console.log("Creating test leads...");
  const lead1 = await prisma.lead.create({
    data: {
      contactName: "Warm Lead CHATTING",
      company: "Test Org",
      stage: "CHATTING",
      subStatus: "WARM_LEAD",
      organizationId: orgId,
      ownerId: (await prisma.user.findFirst()).id,
      createdById: (await prisma.user.findFirst()).id,
    }
  });

  const lead2 = await prisma.lead.create({
    data: {
      contactName: "Cold Lead CHATTING",
      company: "Test Org",
      stage: "CHATTING",
      subStatus: "CHATTING",
      organizationId: orgId,
      ownerId: (await prisma.user.findFirst()).id,
      createdById: (await prisma.user.findFirst()).id,
    }
  });

  try {
    console.log("Executing test query with subStatus: { in: ['CHATTING'], not: 'WARM_LEAD' }...");
    const leads = await prisma.lead.findMany({
      where: {
        organizationId: orgId,
        stage: { in: ["COLD", "CHATTING"] },
        subStatus: {
          in: ["CHATTING"],
          not: "WARM_LEAD"
        }
      }
    });

    console.log(`Query returned ${leads.length} leads:`);
    leads.forEach(l => {
      console.log(`- ${l.contactName}: stage=${l.stage}, subStatus=${l.subStatus}`);
    });

  } catch (err) {
    console.error("Query failed with error:", err);
  } finally {
    console.log("Cleaning up test data...");
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
