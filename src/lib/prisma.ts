import { PrismaClient } from '@/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  // Skip initialization during build time if no database URL is set
  if (!connectionString) {
    // Return a proxy that throws on access during build
    return new Proxy({} as PrismaClient, {
      get(target, prop) {
        if (prop === 'then' || prop === 'catch' || prop === '$connect' || prop === '$disconnect') {
          return undefined
        }
        throw new Error(
          `Prisma Client not initialized: DATABASE_URL is not set. This is expected during build time.`
        )
      },
    })
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
