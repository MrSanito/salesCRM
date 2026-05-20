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
    const stageCounts = await prisma.lead.groupBy({
      by: ['stage'],
      _count: { id: true }
    });
    console.log("=== LEADS GROUPED BY STAGE ===");
    console.log(JSON.stringify(stageCounts, null, 2));

    const subStatusCounts = await prisma.lead.groupBy({
      by: ['subStatus'],
      _count: { id: true }
    });
    console.log("\n=== LEADS GROUPED BY SUBSTATUS ===");
    console.log(JSON.stringify(subStatusCounts, null, 2));

  } catch (err) {
    console.error("Error querying summary:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
