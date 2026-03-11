import { describe, it, expect, beforeEach } from 'vitest'
import { CreateAdSetUseCase, CampaignNotFoundError } from '@application/use-cases/adset/CreateAdSetUseCase'
import { CreateAdSetDTO } from '@application/dto/adset/CreateAdSetDTO'
import { MockCampaignRepository } from '@tests/mocks/repositories/MockCampaignRepository'
import { MockAdSetRepository } from '@tests/mocks/repositories/MockAdSetRepository'
import { Campaign } from '@domain/entities/Campaign'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { Money } from '@domain/value-objects/Money'
import { AdSetStatus } from '@domain/value-objects/AdSetStatus'
import { BillingEvent } from '@domain/value-objects/BillingEvent'
import { OptimizationGoal } from '@domain/value-objects/OptimizationGoal'
import { BidStrategy } from '@domain/value-objects/BidStrategy'

describe('CreateAdSetUseCase', () => {
    let useCase: CreateAdSetUseCase
    let campaignRepository: MockCampaignRepository
    let adSetRepository: MockAdSetRepository
    let testCampaignId: string

    const tomorrow = () => {
        const d = new Date()
        d.setDate(d.getDate() + 1)
        return d
    }

    const nextWeek = () => {
        const d = new Date()
        d.setDate(d.getDate() + 7)
        return d
    }

    beforeEach(async () => {
        campaignRepository = new MockCampaignRepository()
        adSetRepository = new MockAdSetRepository()
        useCase = new CreateAdSetUseCase(campaignRepository, adSetRepository)

        // Seed a test campaign
        const campaign = Campaign.restore({
            id: crypto.randomUUID(),
            userId: 'user-1',
            name: 'Test Campaign',
            objective: CampaignObjective.SALES,
            status: CampaignStatus.DRAFT,
            dailyBudget: Money.create(100000, 'KRW'),
            startDate: tomorrow(),
            endDate: undefined,
            targetAudience: undefined,
            metaCampaignId: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        await campaignRepository.save(campaign)
        testCampaignId = campaign.id
    })

    const createValidDTO = (overrides: Partial<CreateAdSetDTO> = {}): CreateAdSetDTO => ({
        campaignId: testCampaignId,
        name: 'Test AdSet',
        dailyBudget: 50000,
        currency: 'KRW',
        startDate: tomorrow().toISOString(),
        ...overrides,
    })

    describe('execute', () => {
        it('should create adset and save to repository', async () => {
            const dto = createValidDTO()

            const result = await useCase.execute(dto)

            expect(result.id).toBeDefined()
            expect(result.name).toBe('Test AdSet')
            expect(result.campaignId).toBe(testCampaignId)
            expect(result.status).toBe(AdSetStatus.DRAFT)
            expect(result.dailyBudget).toBe(50000)
            expect(result.currency).toBe('KRW')

            // Verify saved in repository
            const saved = adSetRepository.getAll()
            expect(saved).toHaveLength(1)
            expect(saved[0].id).toBe(result.id)
        })

        it('should use default values for optional fields', async () => {
            const dto = createValidDTO()

            const result = await useCase.execute(dto)

            expect(result.billingEvent).toBe(BillingEvent.IMPRESSIONS)
            expect(result.optimizationGoal).toBe(OptimizationGoal.CONVERSIONS)
            expect(result.bidStrategy).toBe(BidStrategy.LOWEST_COST_WITHOUT_CAP)
        })

        it('should allow custom billingEvent, optimizationGoal, bidStrategy', async () => {
            const dto = createValidDTO({
                billingEvent: BillingEvent.LINK_CLICKS,
                optimizationGoal: OptimizationGoal.LINK_CLICKS,
                bidStrategy: BidStrategy.COST_CAP,
            })

            const result = await useCase.execute(dto)

            expect(result.billingEvent).toBe(BillingEvent.LINK_CLICKS)
            expect(result.optimizationGoal).toBe(OptimizationGoal.LINK_CLICKS)
            expect(result.bidStrategy).toBe(BidStrategy.COST_CAP)
        })

        it('should create adset with lifetimeBudget instead of dailyBudget', async () => {
            const dto = createValidDTO({
                dailyBudget: undefined,
                lifetimeBudget: 1000000,
            })

            const result = await useCase.execute(dto)

            expect(result.dailyBudget).toBeUndefined()
            expect(result.lifetimeBudget).toBe(1000000)
        })

        it('should create adset with targeting and placements', async () => {
            const targeting = { ageMin: 20, ageMax: 50, locations: ['Seoul'] }
            const placements = { platforms: ['facebook', 'instagram'] }
            const dto = createValidDTO({ targeting, placements })

            const result = await useCase.execute(dto)

            expect(result.targeting).toEqual(targeting)
            expect(result.placements).toEqual(placements)
        })

        it('should create adset with endDate', async () => {
            const dto = createValidDTO({
                endDate: nextWeek().toISOString(),
            })

            const result = await useCase.execute(dto)

            expect(result.endDate).toBeDefined()
        })

        it('should throw CampaignNotFoundError when campaign does not exist', async () => {
            const dto = createValidDTO({ campaignId: 'non-existent-id' })

            await expect(useCase.execute(dto)).rejects.toThrow(CampaignNotFoundError)
            await expect(useCase.execute(dto)).rejects.toThrow(/not found/)
        })

        it('should throw error when name is empty', async () => {
            const dto = createValidDTO({ name: '' })

            await expect(useCase.execute(dto)).rejects.toThrow()
        })

        it('should throw error when name exceeds 255 chars', async () => {
            const dto = createValidDTO({ name: 'a'.repeat(256) })

            await expect(useCase.execute(dto)).rejects.toThrow()
        })

        it('should throw error when no budget is provided', async () => {
            const dto = createValidDTO({
                dailyBudget: undefined,
                lifetimeBudget: undefined,
            })

            await expect(useCase.execute(dto)).rejects.toThrow()
        })

        it('should throw error for zero dailyBudget', async () => {
            const dto = createValidDTO({ dailyBudget: 0 })

            await expect(useCase.execute(dto)).rejects.toThrow()
        })

        it('should default currency to KRW when not specified', async () => {
            const dto = createValidDTO({ currency: undefined })

            const result = await useCase.execute(dto)

            expect(result.currency).toBe('KRW')
        })
    })
})
