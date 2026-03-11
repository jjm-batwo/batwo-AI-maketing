import { describe, it, expect, beforeEach } from 'vitest'
import { ListAdSetsUseCase } from '@application/use-cases/adset/ListAdSetsUseCase'
import { MockAdSetRepository } from '@tests/mocks/repositories/MockAdSetRepository'
import { AdSet } from '@domain/entities/AdSet'
import { AdSetStatus } from '@domain/value-objects/AdSetStatus'
import { Money } from '@domain/value-objects/Money'

describe('ListAdSetsUseCase', () => {
    let useCase: ListAdSetsUseCase
    let adSetRepository: MockAdSetRepository

    const tomorrow = () => {
        const d = new Date()
        d.setDate(d.getDate() + 1)
        return d
    }

    const createAdSet = (campaignId: string, name: string) =>
        AdSet.restore({
            id: crypto.randomUUID(),
            campaignId,
            name,
            status: AdSetStatus.DRAFT,
            dailyBudget: Money.create(50000, 'KRW'),
            lifetimeBudget: undefined,
            currency: 'KRW',
            startDate: tomorrow(),
            endDate: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

    beforeEach(() => {
        adSetRepository = new MockAdSetRepository()
        useCase = new ListAdSetsUseCase(adSetRepository)
    })

    describe('execute', () => {
        it('should return all adsets for a campaign', async () => {
            const campaignId = 'campaign-1'
            await adSetRepository.save(createAdSet(campaignId, 'AdSet 1'))
            await adSetRepository.save(createAdSet(campaignId, 'AdSet 2'))
            await adSetRepository.save(createAdSet(campaignId, 'AdSet 3'))

            const result = await useCase.execute(campaignId)

            expect(result).toHaveLength(3)
            expect(result.map(r => r.name)).toEqual(
                expect.arrayContaining(['AdSet 1', 'AdSet 2', 'AdSet 3'])
            )
        })

        it('should return empty array when campaign has no adsets', async () => {
            const result = await useCase.execute('empty-campaign-id')

            expect(result).toHaveLength(0)
            expect(result).toEqual([])
        })

        it('should only return adsets for the specified campaign', async () => {
            await adSetRepository.save(createAdSet('campaign-1', 'Set A'))
            await adSetRepository.save(createAdSet('campaign-2', 'Set B'))
            await adSetRepository.save(createAdSet('campaign-1', 'Set C'))

            const result = await useCase.execute('campaign-1')

            expect(result).toHaveLength(2)
            expect(result.every(r => r.campaignId === 'campaign-1')).toBe(true)
        })

        it('should return DTOs with correct shape', async () => {
            await adSetRepository.save(createAdSet('campaign-1', 'AdSet DTO Test'))

            const [dto] = await useCase.execute('campaign-1')

            expect(dto).toHaveProperty('id')
            expect(dto).toHaveProperty('campaignId')
            expect(dto).toHaveProperty('name')
            expect(dto).toHaveProperty('status')
            expect(dto).toHaveProperty('dailyBudget')
            expect(dto).toHaveProperty('currency')
            expect(dto).toHaveProperty('billingEvent')
            expect(dto).toHaveProperty('optimizationGoal')
            expect(dto).toHaveProperty('bidStrategy')
            expect(dto).toHaveProperty('startDate')
            expect(dto).toHaveProperty('createdAt')
            expect(dto).toHaveProperty('updatedAt')
        })
    })
})
