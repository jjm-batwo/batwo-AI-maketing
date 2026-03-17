import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateAdUseCase, AdNotFoundError } from '@application/use-cases/ad/UpdateAdUseCase'
import { MockAdRepository } from '@tests/mocks/repositories/MockAdRepository'
import { Ad } from '@domain/entities/Ad'
import { AdStatus } from '@domain/value-objects/AdStatus'

describe('UpdateAdUseCase', () => {
  let useCase: UpdateAdUseCase
  let adRepository: MockAdRepository
  let testAd: Ad

  beforeEach(async () => {
    adRepository = new MockAdRepository()
    useCase = new UpdateAdUseCase(adRepository)

    testAd = Ad.restore({
      id: crypto.randomUUID(),
      adSetId: 'adset-1',
      name: 'Original Ad',
      status: AdStatus.DRAFT,
      creativeId: 'creative-1',
      metaAdId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await adRepository.save(testAd)
  })

  it('should update ad status', async () => {
    const result = await useCase.execute({
      id: testAd.id,
      status: AdStatus.ACTIVE,
    })

    expect(result.status).toBe(AdStatus.ACTIVE)
  })

  it('should update ad creative', async () => {
    const result = await useCase.execute({
      id: testAd.id,
      creativeId: 'new-creative',
    })

    expect(result.creativeId).toBe('new-creative')
  })

  it('should throw AdNotFoundError for non-existent ad', async () => {
    await expect(
      useCase.execute({ id: 'non-existent', status: AdStatus.ACTIVE })
    ).rejects.toThrow(AdNotFoundError)
  })

  it('should throw on invalid status transition', async () => {
    // DRAFT → PAUSED is not allowed (must go through ACTIVE first)
    await expect(
      useCase.execute({ id: testAd.id, status: AdStatus.PAUSED })
    ).rejects.toThrow()
  })

  it('should persist updated ad in repository', async () => {
    await useCase.execute({ id: testAd.id, creativeId: 'new-creative' })

    const saved = await adRepository.findById(testAd.id)
    expect(saved?.creativeId).toBe('new-creative')
  })
})
