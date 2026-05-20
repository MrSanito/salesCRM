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
  const user = await prisma.user.findFirst({
    where: { email: "sb.solobuild@gmail.com" }
  });

  const page = 1;
  const pageSize = 20;
  const sortBy = "createdAt";
  const sortDir = "desc";
  const view = "subordinates";
  const filter_owner = "vishalni2004";
  const includeStats = true;

  const baseWhere = {
    organizationId: user.organizationId,
  };

  const isSuperAdmin = user.email === "sb.solobuild@gmail.com";
  const isOrgAdmin = user.role === "ORG_ADMIN" || user.role === "CEO";

  // Role-based access
  if (view === "subordinates") {
    if (isSuperAdmin || isOrgAdmin) {
      baseWhere.ownerId = { not: user.id };
    } else if (user.role === "MANAGER") {
      const subordinates = await prisma.user.findMany({
        where: { managerId: user.id },
        select: { id: true }
      });
      const subIds = subordinates.map(s => s.id);
      baseWhere.ownerId = { in: subIds };
    } else {
      baseWhere.ownerId = "none";
    }
  } else {
    baseWhere.ownerId = user.id;
  }

  const queryWhere = { ...baseWhere };
  if (filter_owner) {
    queryWhere.owner = { name: { in: filter_owner.split(",") } };
  }

  let orderBy = { [sortBy]: sortDir };

  const leadSelect = {
    id: true,
    contactName: true,
    company: true,
    email: true,
    phone: true,
    stage: true,
    dealValueInr: true,
    priority: true,
    subStatus: true,
    followUpAt: true,
    createdAt: true,
    industry: true,
    city: true,
    state: true,
    project: true,
    lastCommunicatedAt: true,
    requirement: true,
    owner: { select: { id: true, name: true, initials: true } },
    source: { select: { id: true, name: true } }
  };

  const [leads, totalCount] = await Promise.all([
    prisma.lead.findMany({
      where: queryWhere,
      select: leadSelect,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.lead.count({ where: queryWhere }),
  ]);

  console.log("JSON RESPONSE SIMULATION:");
  console.log(JSON.stringify({
    leads,
    pagination: {
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    }
  }, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
