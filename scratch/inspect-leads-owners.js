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
    const ownerCounts = await prisma.lead.groupBy({
      by: ['ownerId'],
      _count: { id: true }
    });
    console.log("=== LEADS GROUPED BY OWNER ===");
    console.log(JSON.stringify(ownerCounts, null, 2));

    // Also get details of user names corresponding to those ownerIds
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));
    
    console.log("\n=== OWNER ID TO USER MAPPING ===");
    ownerCounts.forEach(oc => {
      const u = userMap.get(oc.ownerId);
      console.log(`Owner: ${u ? `${u.name} (${u.role}, ${u.email})` : 'UNASSIGNED'}, Lead Count: ${oc._count.id}`);
    });

  } catch (err) {
    console.error("Error querying owners:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
