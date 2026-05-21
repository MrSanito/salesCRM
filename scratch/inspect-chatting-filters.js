const { loadEnvConfig } = require('@next/env');
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.Pool({ 
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("=== CHECKING SIDEBAR FILTERS ===");
    const filters = await prisma.sidebarFilter.findMany({
      include: { createdBy: { select: { email: true } } }
    });
    console.log(JSON.stringify(filters, null, 2));

    console.log("\n=== CHECKING LEAD STAGES & SUB-STATUSES ===");
    const leadGroups = await prisma.lead.groupBy({
      by: ['stage', 'subStatus'],
      _count: { id: true }
    });
    console.log(JSON.stringify(leadGroups, null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
