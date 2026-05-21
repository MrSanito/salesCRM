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
  const user = await prisma.user.findUnique({
    where: { email: "sb.solobuild@gmail.com" }
  });

  console.log("Logged in user:", user.email, "Org ID:", user.organizationId);

  // baseWhere configuration:
  const baseWhere = {
    organizationId: user.organizationId,
    ownerId: { not: user.id }
  };

  // Mock active filter parameters:
  const colFiltersWhere = {
    city: { in: ["Mumbai"] }
  };

  const getWhereForField = (exceptField) => {
    const where = {
      ...baseWhere,
    };

    Object.entries(colFiltersWhere).forEach(([field, filterClause]) => {
      if (field !== exceptField) {
        where[field] = filterClause;
      }
    });

    return where;
  };

  console.log("Querying rawSources with getWhereForField('source')");
  console.log("Where clause:", JSON.stringify(getWhereForField("source"), null, 2));

  const rawSources = await prisma.lead.findMany({
    where: { ...getWhereForField("source"), sourceId: { not: null } },
    select: {
      source: {
        select: { name: true }
      }
    },
    distinct: ['sourceId'],
  });

  console.log("rawSources results:", JSON.stringify(rawSources, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
