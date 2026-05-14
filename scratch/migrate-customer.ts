import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const result = await prisma.$executeRawUnsafe("UPDATE leads SET stage = 'CLIENT' WHERE stage = 'CUSTOMER'")
    console.log('Update result:', result)
  } catch (e) {
    console.log('No CUSTOMER stage leads found or table name mismatch:', e.message)
  }
}

main().finally(() => prisma.$disconnect())
