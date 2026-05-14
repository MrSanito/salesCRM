import { PrismaClient, Role } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL!
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('🌱 Starting user-only seed...')

  const org = await prisma.organization.findUnique({
    where: { slug: 'solosales' },
  })

  if (!org) {
    console.error('❌ Organization "solosales" not found. Please run the main seed first.')
    process.exit(1)
  }

  console.log('✅ Organization:', org.name)

  const users = [
    { name: 'solosalesceo', email: 'solosalesceo@gmail.com', initials: 'SC', role: Role.ORG_ADMIN },
    { name: 'solosalesmanager', email: 'solosalesmanager@gmail.com', initials: 'SM', role: Role.MANAGER },
    { name: 'solosalesworker', email: 'solosalesworker@gmail.com', initials: 'SW', role: Role.SALES_REP },
    { name: 'solosalesworker2', email: 'solosalesworker2@gmail.com', initials: 'SW2', role: Role.SALES_REP },
  ]

  for (const u of users) {
    // Using email as password as requested
    const passwordHash = await bcrypt.hash(u.email, 10)
    
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        password: passwordHash,
      },
      create: {
        name: u.name,
        email: u.email,
        password: passwordHash,
        initials: u.initials,
        role: u.role,
        organizationId: org.id,
      },
    })
    console.log(`✅ User seeded: ${u.email} (Password: ${u.email})`)
  }

  console.log('\n🎉 User seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
