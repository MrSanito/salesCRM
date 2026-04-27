import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

if (process.env.NODE_ENV !== 'production') {
  console.log(`[Prisma] Connecting to: ${connectionString.split('@')[0]}...`);
}

const pool = new pg.Pool({ 
  connectionString,
  connectionTimeoutMillis: 60000, 
  idleTimeoutMillis: 60000,       
  max: 3,                         
  ssl: connectionString.includes('sslmode=disable') 
    ? false 
    : { rejectUnauthorized: false },
  statement_timeout: 60000,       
  keepAlive: true,
})

const adapter = new PrismaPg(pool)

const globalForPrisma = global as unknown as { prisma_v2: PrismaClient }

export const prisma =
  globalForPrisma.prisma_v2 ||
  new PrismaClient({
    adapter,
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_v2 = prisma

