const fs = require('fs');
const path = require('path');

// Load and parse .env manually
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
const bcrypt = require('bcryptjs');

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
  console.log('🔄 Starting user updates...');

  // Get SoloBuild/SoloSales organization
  let org = await prisma.organization.findFirst({
    where: {
      OR: [
        { slug: 'solobuild' },
        { slug: 'solosales' }
      ]
    }
  });

  if (!org) {
    // Fallback: grab the first organization in the database
    org = await prisma.organization.findFirst();
  }

  if (!org) {
    console.error('❌ No Organization found in the database. Please seed the database first.');
    process.exit(1);
  }

  console.log(`✅ Using Organization: ${org.name} (Slug: ${org.slug}, ID: ${org.id})`);

  // 1. Update CEO: solobuildceo@gmail.com -> sb.solobuild@gmail.com
  const oldCeoEmail = 'solobuildceo@gmail.com';
  const newCeoEmail = 'sb.solobuild@gmail.com';
  const ceoUser = await prisma.user.findUnique({ where: { email: oldCeoEmail } });
  
  if (ceoUser) {
    const newPasswordHash = await bcrypt.hash(newCeoEmail, 10);
    await prisma.user.update({
      where: { email: oldCeoEmail },
      data: {
        email: newCeoEmail,
        name: 'CEO',
        password: newPasswordHash,
        initials: 'VN'
      }
    });
    console.log(`✅ CEO updated from ${oldCeoEmail} to ${newCeoEmail}`);
  } else {
    console.log(`ℹ️ CEO ${oldCeoEmail} not found (maybe already updated)`);
  }

  // 2. Update Manager: solobuildmanager@gmail.com -> Gutsqureshi@gmail.com
  const oldManagerEmail = 'solobuildmanager@gmail.com';
  const newManagerEmail = 'Gutsqureshi@gmail.com';
  const managerUser = await prisma.user.findUnique({ where: { email: oldManagerEmail } });

  if (managerUser) {
    const newPasswordHash = await bcrypt.hash(newManagerEmail, 10);
    await prisma.user.update({
      where: { email: oldManagerEmail },
      data: {
        email: newManagerEmail,
        name: 'solobuildmanager',
        password: newPasswordHash,
        initials: 'GQ'
      }
    });
    console.log(`✅ Manager updated from ${oldManagerEmail} to ${newManagerEmail}`);
  } else {
    console.log(`ℹ️ Manager ${oldManagerEmail} not found (maybe already updated)`);
  }

  // 3. Create ORG_ADMIN user: vishalni2004@gmail.com
  const newAdminEmail = 'vishalni2004@gmail.com';
  const adminUser = await prisma.user.findUnique({ where: { email: newAdminEmail } });

  if (!adminUser) {
    const adminPasswordHash = await bcrypt.hash(newAdminEmail, 10);
    await prisma.user.create({
      data: {
        name: 'vishalni2004',
        email: newAdminEmail,
        password: adminPasswordHash,
        initials: 'VN',
        role: 'ORG_ADMIN',
        organizationId: org.id
      }
    });
    console.log(`✅ New Org Admin created: ${newAdminEmail}`);
  } else {
    console.log(`ℹ️ Org Admin ${newAdminEmail} already exists`);
  }

  console.log('🎉 All user updates done!');
  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
