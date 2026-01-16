import 'dotenv/config'
import { PrismaClient } from '@/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { beforeAll, afterAll, beforeEach } from 'vitest'

let prisma: PrismaClient
let pool: Pool

// Use test database URL
const databaseUrl = process.env['DATABASE_URL_TEST'] || process.env['DATABASE_URL']

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    if (!databaseUrl) {
      throw new Error('DATABASE_URL or DATABASE_URL_TEST must be set')
    }

    pool = new Pool({
      connectionString: databaseUrl,
    })

    const adapter = new PrismaPg(pool)
    prisma = new PrismaClient({ adapter })
  }
  return prisma
}

export async function setupTestDatabase(): Promise<void> {
  const client = getPrismaClient()
  await client.$connect()
}

export async function teardownTestDatabase(): Promise<void> {
  const client = getPrismaClient()
  await client.$disconnect()
  if (pool) {
    await pool.end()
  }
}

export async function cleanDatabase(): Promise<void> {
  const client = getPrismaClient()

  // Delete in order respecting foreign key constraints
  await client.$transaction([
    client.usageLog.deleteMany(),
    client.kPISnapshot.deleteMany(),
    client.report.deleteMany(),
    client.campaign.deleteMany(),
    client.metaAdAccount.deleteMany(),
    client.teamMember.deleteMany(),
    client.team.deleteMany(),
    // Meta Pixel related tables
    client.conversionEvent.deleteMany(),
    client.platformIntegration.deleteMany(),
    client.metaPixel.deleteMany(),
    // Auth tables
    client.session.deleteMany(),
    client.account.deleteMany(),
    client.verificationToken.deleteMany(),
    client.user.deleteMany(),
  ])
}

export function setupIntegrationTest() {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await cleanDatabase()
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await cleanDatabase()
  })
}

export async function createTestUser(overrides: Partial<{ id: string; email: string; name: string }> = {}) {
  const client = getPrismaClient()
  return client.user.create({
    data: {
      id: overrides.id || crypto.randomUUID(),
      email: overrides.email || `test-${Date.now()}@example.com`,
      name: overrides.name || 'Test User',
    },
  })
}
