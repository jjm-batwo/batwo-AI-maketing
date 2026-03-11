import { describe, it, expect, beforeEach } from 'vitest'
import { setupIntegrationTest, getPrismaClient, createTestUser } from '../setup'
import { PrismaSubscriptionRepository } from '@infrastructure/database/repositories/PrismaSubscriptionRepository'
import { Subscription } from '@domain/entities/Subscription'
import { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'
import { SubscriptionStatus } from '@domain/value-objects/SubscriptionStatus'

describe('PrismaSubscriptionRepository', () => {
    setupIntegrationTest()

    let repository: PrismaSubscriptionRepository
    let testUserId: string

    beforeEach(async () => {
        const prisma = getPrismaClient()
        repository = new PrismaSubscriptionRepository(prisma)

        const user = await createTestUser()
        testUserId = user.id
    })

    const createTestSubscription = (overrides: Partial<Parameters<typeof Subscription.restore>[0]> = {}) => {
        const now = new Date()
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

        return Subscription.restore({
            id: crypto.randomUUID(),
            userId: testUserId,
            plan: SubscriptionPlan.STARTER,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            cancelledAt: undefined,
            createdAt: now,
            updatedAt: now,
            ...overrides,
        })
    }

    describe('save', () => {
        it('should save and return a subscription', async () => {
            const subscription = createTestSubscription()

            const saved = await repository.save(subscription)

            expect(saved.id).toBe(subscription.id)
            expect(saved.userId).toBe(testUserId)
            expect(saved.plan).toBe(SubscriptionPlan.STARTER)
            expect(saved.status).toBe(SubscriptionStatus.ACTIVE)
        })

        it('should save subscription with different plans', async () => {
            const subscription = createTestSubscription({ plan: SubscriptionPlan.PRO })

            const saved = await repository.save(subscription)

            expect(saved.plan).toBe(SubscriptionPlan.PRO)
        })
    })

    describe('findById', () => {
        it('should find subscription by id', async () => {
            const subscription = createTestSubscription()
            await repository.save(subscription)

            const found = await repository.findById(subscription.id)

            expect(found).not.toBeNull()
            expect(found!.id).toBe(subscription.id)
            expect(found!.plan).toBe(subscription.plan)
        })

        it('should return null for non-existent subscription', async () => {
            const found = await repository.findById('non-existent-id')

            expect(found).toBeNull()
        })
    })

    describe('findByUserId', () => {
        it('should find subscription by userId', async () => {
            const subscription = createTestSubscription()
            await repository.save(subscription)

            const found = await repository.findByUserId(testUserId)

            expect(found).not.toBeNull()
            expect(found!.userId).toBe(testUserId)
        })

        it('should return null when user has no subscription', async () => {
            const found = await repository.findByUserId('user-without-sub')

            expect(found).toBeNull()
        })
    })

    describe('update', () => {
        it('should update subscription status', async () => {
            const subscription = createTestSubscription()
            await repository.save(subscription)

            const cancelled = subscription.cancel()
            const updated = await repository.update(cancelled)

            expect(updated.status).toBe(SubscriptionStatus.CANCELLED)
            expect(updated.cancelledAt).toBeDefined()
        })

        it('should update subscription plan', async () => {
            const subscription = createTestSubscription()
            await repository.save(subscription)

            const changed = subscription.changePlan(SubscriptionPlan.PRO)
            const updated = await repository.update(changed)

            expect(updated.plan).toBe(SubscriptionPlan.PRO)
        })
    })

    describe('delete', () => {
        it('should delete subscription', async () => {
            const subscription = createTestSubscription()
            await repository.save(subscription)

            await repository.delete(subscription.id)

            const found = await repository.findById(subscription.id)
            expect(found).toBeNull()
        })
    })

    describe('findByFilters', () => {
        it('should filter by plan', async () => {
            const user2 = await createTestUser({ email: `test-plan-${Date.now()}@example.com` })

            await repository.save(createTestSubscription({ plan: SubscriptionPlan.STARTER }))
            await repository.save(createTestSubscription({
                userId: user2.id,
                plan: SubscriptionPlan.PRO,
                id: crypto.randomUUID(),
            }))

            const result = await repository.findByFilters(
                { plan: SubscriptionPlan.STARTER },
                { page: 1, limit: 10 }
            )

            expect(result.data.length).toBeGreaterThanOrEqual(1)
            expect(result.data.every(s => s.plan === SubscriptionPlan.STARTER)).toBe(true)
        })

        it('should filter by status', async () => {
            const user2 = await createTestUser({ email: `test-status-${Date.now()}@example.com` })

            await repository.save(createTestSubscription())
            const cancelledSub = createTestSubscription({
                userId: user2.id,
                id: crypto.randomUUID(),
                status: SubscriptionStatus.CANCELLED,
                cancelledAt: new Date(),
            })
            await repository.save(cancelledSub)

            const result = await repository.findByFilters(
                { status: SubscriptionStatus.ACTIVE },
                { page: 1, limit: 10 }
            )

            expect(result.data.every(s => s.status === SubscriptionStatus.ACTIVE)).toBe(true)
        })

        it('should paginate results', async () => {
            // Create multiple users/subscriptions
            for (let i = 0; i < 5; i++) {
                const user = await createTestUser({ email: `paginated-${i}-${Date.now()}@example.com` })
                await repository.save(createTestSubscription({
                    userId: user.id,
                    id: crypto.randomUUID(),
                }))
            }

            const page1 = await repository.findByFilters({}, { page: 1, limit: 2 })

            expect(page1.data).toHaveLength(2)
            expect(page1.total).toBeGreaterThanOrEqual(5)
            expect(page1.totalPages).toBeGreaterThanOrEqual(3)
        })
    })

    describe('getStats', () => {
        it('should return subscription statistics', async () => {
            await repository.save(createTestSubscription())

            const stats = await repository.getStats()

            expect(stats.total).toBeGreaterThanOrEqual(1)
            expect(stats.byPlan).toBeDefined()
            expect(stats.byStatus).toBeDefined()
            expect(typeof stats.activeCount).toBe('number')
            expect(typeof stats.churnedThisMonth).toBe('number')
        })
    })

    describe('findExpiringSoon', () => {
        it('should find subscriptions expiring within N days', async () => {
            const soonExpiring = createTestSubscription({
                currentPeriodEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
            })
            await repository.save(soonExpiring)

            const expiring = await repository.findExpiringSoon(7) // within 7 days

            expect(expiring.length).toBeGreaterThanOrEqual(1)
            expect(expiring.some(s => s.id === soonExpiring.id)).toBe(true)
        })

        it('should not return subscriptions expiring beyond the range', async () => {
            const farExpiring = createTestSubscription({
                currentPeriodEnd: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
            })
            await repository.save(farExpiring)

            const expiring = await repository.findExpiringSoon(7)

            expect(expiring.some(s => s.id === farExpiring.id)).toBe(false)
        })
    })

    describe('findPastDue', () => {
        it('should find past due subscriptions', async () => {
            const pastDueSub = createTestSubscription({
                status: SubscriptionStatus.PAST_DUE,
            })
            await repository.save(pastDueSub)

            const found = await repository.findPastDue()

            expect(found.length).toBeGreaterThanOrEqual(1)
            expect(found.every(s => s.status === SubscriptionStatus.PAST_DUE)).toBe(true)
        })
    })

    describe('countByPlan', () => {
        it('should count subscriptions by plan', async () => {
            await repository.save(createTestSubscription({ plan: SubscriptionPlan.STARTER }))

            const counts = await repository.countByPlan()

            expect(counts[SubscriptionPlan.STARTER]).toBeGreaterThanOrEqual(1)
            expect(typeof counts[SubscriptionPlan.FREE]).toBe('number')
            expect(typeof counts[SubscriptionPlan.PRO]).toBe('number')
            expect(typeof counts[SubscriptionPlan.ENTERPRISE]).toBe('number')
        })
    })
})
