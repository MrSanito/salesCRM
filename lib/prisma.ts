import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL || "";

// Prisma 7 requires an adapter or accelerateUrl if url is missing from schema
const pool = new pg.Pool({ 
  connectionString,
  max: 3,
  ssl: { rejectUnauthorized: false }
})

const adapter = new PrismaPg(pool)

const globalForPrisma = global as unknown as { prisma_v5: PrismaClient }

export const prisma =
  globalForPrisma.prisma_v5 ||
  new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_v5 = prisma