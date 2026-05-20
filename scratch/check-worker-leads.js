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
    const user = await prisma.user.findFirst({
      where: { email: "solobuildworker@gmail.com" }
    });
    if (!user) {
      console.log("solobuildworker not found");
      return;
    }

    const leads = await prisma.lead.findMany({
      where: { ownerId: user.id }
    });

    console.log(`Leads owned by solobuildworker@gmail.com (Total: ${leads.length}):`);
    leads.forEach(l => {
      console.log(`- Lead ID: ${l.id}, Name: ${l.contactName}, Stage: ${l.stage}, SubStatus: ${l.subStatus}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
