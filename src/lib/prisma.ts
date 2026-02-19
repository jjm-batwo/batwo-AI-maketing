import { PrismaClient } from '@/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
const { Pool, types } = pg

// PostgreSQL DATE 타입(OID 1082)을 UTC 자정으로 파싱
// 기본 pg 드라이버는 로컬 시간대(KST)로 해석하여 toISOString() 시 -1일 시프트 발생
// e.g. DB '2026-02-13' → 기본: 2026-02-12T15:00:00Z → 수정: 2026-02-13T00:00:00Z
types.setTypeParser(1082, (val: string) => new Date(val + 'T00:00:00.000Z'))

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

  // 세션 타임존을 UTC로 설정하여 date 컬럼과 timestamptz 비교 시 오프셋 문제 방지
  // PostgreSQL 서버가 Asia/Seoul일 때 date '2026-02-19'를 KST로 해석하면
  // 2026-02-18T15:00:00Z가 되어 UTC 기준 WHERE 조건과 매칭 안됨
  const pool = new Pool({ connectionString, options: '-c timezone=UTC' })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
