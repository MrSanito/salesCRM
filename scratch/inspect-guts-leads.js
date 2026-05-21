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
    const guts = await prisma.user.findFirst({
      where: { email: { equals: "Gutsqureshi@gmail.com", mode: "insensitive" } }
    });

    if (!guts) {
      console.log("Guts user not found!");
      return;
    }

    console.log("=== GUTS USER DETAILS ===");
    console.log(guts);

    const leads = await prisma.lead.findMany({
      where: { ownerId: guts.id },
      select: {
        id: true,
        contactName: true,
        stage: true,
        subStatus: true,
      }
    });

    console.log(`\n=== LEADS OWNED BY GUTS (${leads.length}) ===`);
    console.log(JSON.stringify(leads, null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
