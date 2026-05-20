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
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            ownedLeads: true
          }
        }
      }
    });
    console.log("=== ALL USERS ===");
    console.log(JSON.stringify(users, null, 2));

    const totalLeads = await prisma.lead.count();
    console.log("\nTotal leads:", totalLeads);

    const leadsByOwner = await prisma.lead.groupBy({
      by: ['ownerId'],
      _count: {
        id: true
      }
    });
    console.log("\nLeads by Owner ID:", JSON.stringify(leadsByOwner, null, 2));

  } catch (err) {
    console.error("Error querying users:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
