import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateAdSetUseCase, AdSetNotFoundError, UpdateAdSetDTO } from '@application/use-cases/adset/UpdateAdSetUseCase'
import { MockAdSetRepository } from '@tests/mocks/repositories/MockAdSetRepository'
import { AdSet } from '@domain/entities/AdSet'
import { AdSetStatus } from '@domain/value-objects/AdSetStatus'
import { Money } from '@domain/value-objects/Money'

describe('UpdateAdSetUseCase', () => {
    let useCase: UpdateAdSetUseCase
    let adSetRepository: MockAdSetRepository
    let testAdSetId: string

    const tomorrow = () => {
        const d = new Date()
        d.setDate(d.getDate() + 1)
        return d
    }

    beforeEach(async () => {
        adSetRepository = new MockAdSetRepository()
        useCase = new UpdateAdSetUseCase(adSetRepository)

        const adSet = AdSet.restore({
            id: crypto.randomUUID(),
            campaignId: 'campaign-1',
            name: 'Original AdSet',
            status: AdSetStatus.DRAFT,
            dailyBudget: Money.create(50000, 'KRW'),
            lifetimeBudget: undefined,
            currency: 'KRW',
            startDate: tomorrow(),
            endDate: undefined,
            targeting: { ageMin: 20, ageMax: 40 },
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        await adSetRepository.save(adSet)
        testAdSetId = adSet.id
    })

    describe('execute', () => {
        it('should update adset status from DRAFT to ACTIVE', async () => {
            const dto: UpdateAdSetDTO = {
                id: testAdSetId,
                status: AdSetStatus.ACTIVE,
            }

            const result = await useCase.execute(dto)

            expect(result.status).toBe(AdSetStatus.ACTIVE)
            expect(result.id).toBe(testAdSetId)
        })

        it('should update dailyBudget', async () => {
            const dto: UpdateAdSetDTO = {
                id: testAdSetId,
                dailyBudget: 100000,
            }

            const result = await useCase.execute(dto)

            expect(result.dailyBudget).toBe(100000)
        })

        it('should update targeting', async () => {
            const newTargeting = { ageMin: 25, ageMax: 55, locations: ['Seoul', 'Busan'] }
            const dto: UpdateAdSetDTO = {
                id: testAdSetId,
                targeting: newTargeting,
            }

            const result = await useCase.execute(dto)

            expect(result.targeting).toEqual(newTargeting)
        })

        it('should update multiple fields at once', async () => {
            const dto: UpdateAdSetDTO = {
                id: testAdSetId,
                status: AdSetStatus.ACTIVE,
                dailyBudget: 75000,
                targeting: { ageMin: 30, ageMax: 60 },
            }

            const result = await useCase.execute(dto)

            expect(result.status).toBe(AdSetStatus.ACTIVE)
            expect(result.dailyBudget).toBe(75000)
            expect(result.targeting).toEqual({ ageMin: 30, ageMax: 60 })
        })

        it('should throw AdSetNotFoundError when adset does not exist', async () => {
            const dto: UpdateAdSetDTO = {
                id: 'non-existent-id',
                status: AdSetStatus.ACTIVE,
            }

            await expect(useCase.execute(dto)).rejects.toThrow(AdSetNotFoundError)
        })

        it('should throw error for invalid status transition (DRAFT → PAUSED)', async () => {
            const dto: UpdateAdSetDTO = {
                id: testAdSetId,
                status: AdSetStatus.PAUSED,
            }

            // DRAFT → PAUSED is not in allowed transitions
            await expect(useCase.execute(dto)).rejects.toThrow()
        })

        it('should persist updates in repository', async () => {
            const dto: UpdateAdSetDTO = {
                id: testAdSetId,
                dailyBudget: 200000,
            }

            await useCase.execute(dto)

            const found = await adSetRepository.findById(testAdSetId)
            expect(found).not.toBeNull()
            expect(found!.dailyBudget?.amount).toBe(200000)
        })
    })
})
