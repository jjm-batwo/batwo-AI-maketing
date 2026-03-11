import { describe, it, expect, beforeEach } from 'vitest'
import { DeleteAdSetUseCase, AdSetNotFoundError } from '@application/use-cases/adset/DeleteAdSetUseCase'
import { MockAdSetRepository } from '@tests/mocks/repositories/MockAdSetRepository'
import { AdSet } from '@domain/entities/AdSet'
import { AdSetStatus } from '@domain/value-objects/AdSetStatus'
import { Money } from '@domain/value-objects/Money'

describe('DeleteAdSetUseCase', () => {
    let useCase: DeleteAdSetUseCase
    let adSetRepository: MockAdSetRepository
    let testAdSetId: string

    const tomorrow = () => {
        const d = new Date()
        d.setDate(d.getDate() + 1)
        return d
    }

    beforeEach(async () => {
        adSetRepository = new MockAdSetRepository()
        useCase = new DeleteAdSetUseCase(adSetRepository)

        const adSet = AdSet.restore({
            id: crypto.randomUUID(),
            campaignId: 'campaign-1',
            name: 'Test AdSet',
            status: AdSetStatus.DRAFT,
            dailyBudget: Money.create(50000, 'KRW'),
            lifetimeBudget: undefined,
            currency: 'KRW',
            startDate: tomorrow(),
            endDate: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        await adSetRepository.save(adSet)
        testAdSetId = adSet.id
    })

    describe('execute', () => {
        it('should delete adset from repository', async () => {
            await useCase.execute(testAdSetId)

            const found = await adSetRepository.findById(testAdSetId)
            expect(found).toBeNull()
        })

        it('should throw AdSetNotFoundError when adset does not exist', async () => {
            await expect(useCase.execute('non-existent-id')).rejects.toThrow(AdSetNotFoundError)
            await expect(useCase.execute('non-existent-id')).rejects.toThrow(/not found/)
        })

        it('should only delete the specified adset, keeping others', async () => {
            const anotherAdSet = AdSet.restore({
                id: crypto.randomUUID(),
                campaignId: 'campaign-1',
                name: 'Another AdSet',
                status: AdSetStatus.DRAFT,
                dailyBudget: Money.create(30000, 'KRW'),
                lifetimeBudget: undefined,
                currency: 'KRW',
                startDate: tomorrow(),
                endDate: undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            await adSetRepository.save(anotherAdSet)

            await useCase.execute(testAdSetId)

            const remaining = adSetRepository.getAll()
            expect(remaining).toHaveLength(1)
            expect(remaining[0].id).toBe(anotherAdSet.id)
        })
    })
})
