import { describe, it, expect, beforeEach } from 'vitest'
import { CreateAdUseCase } from '@application/use-cases/ad/CreateAdUseCase'
import { CreateAdDTO } from '@application/dto/ad/CreateAdDTO'
import { MockAdRepository } from '@tests/mocks/repositories/MockAdRepository'
import { MockAdSetRepository } from '@tests/mocks/repositories/MockAdSetRepository'
import { MockCreativeRepository } from '@tests/mocks/repositories/MockCreativeRepository'
import { AdSet } from '@domain/entities/AdSet'
import { AdSetStatus } from '@domain/value-objects/AdSetStatus'
import { Money } from '@domain/value-objects/Money'
import { Creative } from '@domain/entities/Creative'
import { CreativeFormat } from '@domain/value-objects/CreativeFormat'
import { AdStatus } from '@domain/value-objects/AdStatus'

describe('CreateAdUseCase', () => {
    let useCase: CreateAdUseCase
    let adRepository: MockAdRepository
    let adSetRepository: MockAdSetRepository
    let creativeRepository: MockCreativeRepository
    let testAdSetId: string
    let testCreativeId: string

    const tomorrow = () => {
        const d = new Date()
        d.setDate(d.getDate() + 1)
        return d
    }

    beforeEach(async () => {
        adRepository = new MockAdRepository()
        adSetRepository = new MockAdSetRepository()
        creativeRepository = new MockCreativeRepository()
        useCase = new CreateAdUseCase(adRepository, adSetRepository, creativeRepository)

        // Seed an AdSet
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

        // Seed a Creative
        const creative = Creative.restore({
            id: crypto.randomUUID(),
            userId: 'user-1',
            name: 'Test Creative',
            format: CreativeFormat.SINGLE_IMAGE,
            primaryText: 'Test primary text',
            headline: 'Test headline',
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        await creativeRepository.save(creative)
        testCreativeId = creative.id
    })

    const createValidDTO = (overrides: Partial<CreateAdDTO> = {}): CreateAdDTO => ({
        adSetId: testAdSetId,
        name: 'Test Ad',
        creativeId: testCreativeId,
        ...overrides,
    })

    describe('execute', () => {
        it('should create ad and save to repository', async () => {
            const dto = createValidDTO()

            const result = await useCase.execute(dto)

            expect(result.id).toBeDefined()
            expect(result.name).toBe('Test Ad')
            expect(result.adSetId).toBe(testAdSetId)
            expect(result.creativeId).toBe(testCreativeId)
            expect(result.status).toBe(AdStatus.DRAFT)

            const saved = adRepository.getAll()
            expect(saved).toHaveLength(1)
        })

        it('should throw error when adset does not exist', async () => {
            const dto = createValidDTO({ adSetId: 'non-existent-adset' })

            await expect(useCase.execute(dto)).rejects.toThrow(/AdSet not found/)
        })

        it('should throw error when creative does not exist', async () => {
            const dto = createValidDTO({ creativeId: 'non-existent-creative' })

            await expect(useCase.execute(dto)).rejects.toThrow(/Creative not found/)
        })

        it('should throw error for empty ad name', async () => {
            const dto = createValidDTO({ name: '' })

            await expect(useCase.execute(dto)).rejects.toThrow()
        })

        it('should throw error for ad name exceeding 255 characters', async () => {
            const dto = createValidDTO({ name: 'x'.repeat(256) })

            await expect(useCase.execute(dto)).rejects.toThrow()
        })

        it('should return DTO with correct date format', async () => {
            const dto = createValidDTO()

            const result = await useCase.execute(dto)

            // createdAt/updatedAt should be ISO string
            expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
            expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
        })

        it('should create ad with metaAdId undefined initially', async () => {
            const dto = createValidDTO()

            const result = await useCase.execute(dto)

            expect(result.metaAdId).toBeUndefined()
        })

        it('should create multiple ads for the same adset', async () => {
            await useCase.execute(createValidDTO({ name: 'Ad 1' }))
            await useCase.execute(createValidDTO({ name: 'Ad 2' }))
            await useCase.execute(createValidDTO({ name: 'Ad 3' }))

            const all = adRepository.getAll()
            expect(all).toHaveLength(3)
        })
    })
})
