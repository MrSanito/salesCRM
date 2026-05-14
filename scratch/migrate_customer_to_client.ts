import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function main() {
  const result = await prisma.lead.updateMany({
    where: {
      stage: 'CUSTOMER' as any
    },
    data: {
      stage: 'CLIENT' as any
    }
  })
  console.log(`Updated ${result.count} leads from CUSTOMER to CLIENT`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
