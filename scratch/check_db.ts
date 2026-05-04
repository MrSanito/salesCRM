import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL!
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function check() {
  const count = await prisma.lead.count()
  console.log(`Current lead count: ${count}`)
  const orgs = await prisma.organization.findMany()
  console.log('Organizations:', orgs.map(o => o.name))
  await prisma.$disconnect()
}

check()
