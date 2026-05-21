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
  const testUser = await prisma.user.findFirst({ where: { organizationId: orgId } });

  console.log("Attempting to save a filter with COLD_CHATTING...");
  try {
    const filter = await prisma.sidebarFilter.create({
      data: {
        name: "Test Cold Chatting",
        statuses: ["COLD_CHATTING"],
        organizationId: orgId,
        createdById: testUser.id,
      }
    });
    console.log("Successfully saved!", filter);
    // Cleanup
    await prisma.sidebarFilter.delete({ where: { id: filter.id } });
  } catch (err) {
    console.error("Save failed with error:", err.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
