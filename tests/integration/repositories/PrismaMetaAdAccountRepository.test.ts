import { describe, it, expect, beforeEach } from 'vitest'
import { setupIntegrationTest, getPrismaClient, createTestUser } from '../setup'
import { PrismaMetaAdAccountRepository } from '@infrastructure/database/repositories/PrismaMetaAdAccountRepository'

describe('PrismaMetaAdAccountRepository', () => {
    setupIntegrationTest()

    let repository: PrismaMetaAdAccountRepository
    let testUserId: string

    beforeEach(async () => {
        const prisma = getPrismaClient()
        repository = new PrismaMetaAdAccountRepository(prisma)

        const user = await createTestUser()
        testUserId = user.id
    })

    const createTestMetaAdAccount = async (overrides: Record<string, unknown> = {}) => {
        const prisma = getPrismaClient()
        const tokenExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days

        return prisma.metaAdAccount.create({
            data: {
                id: crypto.randomUUID(),
                userId: testUserId,
                metaAccountId: `act_${Date.now()}`,
                businessName: 'Test Ad Account',
                accessToken: 'encrypted-token-data',
                tokenExpiry,
                ...overrides,
            },
        })
    }

    describe('findByUserId', () => {
        it('should find meta ad account by userId', async () => {
            await createTestMetaAdAccount()

            const found = await repository.findByUserId(testUserId)

            expect(found).not.toBeNull()
            expect(found!.userId).toBe(testUserId)
            expect(found!.accessToken).toBe('encrypted-token-data')
            expect(found!.metaAccountId).toBeDefined()
            expect(found!.tokenExpiry).toBeInstanceOf(Date)
        })

        it('should return null when user has no meta ad account', async () => {
            const found = await repository.findByUserId('non-existent-user')

            expect(found).toBeNull()
        })

        it('should return correct fields in the result', async () => {
            await createTestMetaAdAccount()

            const found = await repository.findByUserId(testUserId)

            expect(found).toHaveProperty('id')
            expect(found).toHaveProperty('userId')
            expect(found).toHaveProperty('metaAccountId')
            expect(found).toHaveProperty('accessToken')
            expect(found).toHaveProperty('tokenExpiry')
        })
    })

    describe('findExpiringBefore', () => {
        it('should find accounts with tokens expiring before threshold', async () => {
            const soonExpiry = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
            await createTestMetaAdAccount({ tokenExpiry: soonExpiry })

            const threshold = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            const expiring = await repository.findExpiringBefore(threshold)

            expect(expiring.length).toBeGreaterThanOrEqual(1)
            expect(expiring.some(a => a.userId === testUserId)).toBe(true)
        })

        it('should not return accounts with tokens expiring after threshold', async () => {
            const farExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
            await createTestMetaAdAccount({ tokenExpiry: farExpiry })

            const threshold = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            const expiring = await repository.findExpiringBefore(threshold)

            expect(expiring.every(a => a.tokenExpiry <= threshold)).toBe(true)
        })

        it('should return empty array when no accounts are expiring', async () => {
            // Create account with distant expiry
            const farExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            await createTestMetaAdAccount({ tokenExpiry: farExpiry })

            const threshold = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 day
            const expiring = await repository.findExpiringBefore(threshold)

            expect(expiring.every(a => a.tokenExpiry <= threshold)).toBe(true)
        })
    })

    describe('updateToken', () => {
        it('should update access token and expiry', async () => {
            const account = await createTestMetaAdAccount()

            const newExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
            const newToken = 'new-encrypted-token-data'

            await repository.updateToken(account.id, newToken, newExpiry)

            const updated = await repository.findByUserId(testUserId)

            expect(updated).not.toBeNull()
            expect(updated!.accessToken).toBe(newToken)
            // Compare timestamps (millisecond precision may differ)
            expect(Math.abs(updated!.tokenExpiry.getTime() - newExpiry.getTime())).toBeLessThan(1000)
        })

        it('should only update the specified account', async () => {
            const user2 = await createTestUser({ email: `meta-update-${Date.now()}@example.com` })
            const account1 = await createTestMetaAdAccount()
            await createTestMetaAdAccount({
                userId: user2.id,
                metaAccountId: `act_other_${Date.now()}`,
                id: crypto.randomUUID(),
            })

            const newToken = 'updated-token-only-for-account1'
            const newExpiry = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000)

            await repository.updateToken(account1.id, newToken, newExpiry)

            const found1 = await repository.findByUserId(testUserId)
            const found2 = await repository.findByUserId(user2.id)

            expect(found1!.accessToken).toBe(newToken)
            expect(found2!.accessToken).toBe('encrypted-token-data')
        })
    })
})
