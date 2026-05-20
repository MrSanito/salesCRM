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
    where: { email: "vishalni2004@gmail.com" }
  });

  const [rawLeadFields, rawSources, rawUsers] = await Promise.all([
    prisma.lead.findMany({
      where: { organizationId: user.organizationId },
      select: { industry: true, city: true, state: true },
    }),
    prisma.leadSource.findMany({
      where: { organizationId: user.organizationId },
      select: { name: true },
      distinct: ['name'],
    }),
    prisma.user.findMany({
      where: { organizationId: user.organizationId },
      select: { name: true },
    }),
  ]);

  const industrySet = new Set();
  const citySet = new Set();
  const stateSet = new Set();

  for (const row of rawLeadFields) {
    if (row.industry?.trim()) industrySet.add(row.industry.trim());
    if (row.city?.trim()) citySet.add(row.city.trim());
    if (row.state?.trim()) stateSet.add(row.state.trim());
  }

  const sources = rawSources
    .map(s => s.name)
    .filter(name => !!name && name.trim() !== "")
    .sort();

  const owners = Array.from(new Set(rawUsers.map(u => u.name).filter(Boolean))).sort();

  console.log("Distinct Filters:", {
    industries: Array.from(industrySet).sort(),
    sources,
    cities: Array.from(citySet).sort(),
    states: Array.from(stateSet).sort(),
    owners,
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
