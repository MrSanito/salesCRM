const { loadEnvConfig } = require('@next/env');
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Querying last 5 proposals...");
    const proposals = await prisma.proposal.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log("Proposals:", JSON.stringify(proposals, null, 2));

    console.log("Querying last 5 audit logs with DOWNLOAD...");
    const logs = await prisma.auditLog.findMany({
      where: {
        note: { contains: 'Download URL:' }
      },
      orderBy: { occurredAt: 'desc' },
      take: 5
    });
    console.log("Audit Logs:", JSON.stringify(logs, null, 2));

  } catch (err) {
    console.error("Error querying db:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
