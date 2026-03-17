import { describe, it, expect, beforeEach } from 'vitest'
import { DeleteAdUseCase, AdNotFoundError } from '@application/use-cases/ad/DeleteAdUseCase'
import { MockAdRepository } from '@tests/mocks/repositories/MockAdRepository'
import { Ad } from '@domain/entities/Ad'
import { AdStatus } from '@domain/value-objects/AdStatus'

describe('DeleteAdUseCase', () => {
  let useCase: DeleteAdUseCase
  let adRepository: MockAdRepository
  let testAd: Ad

  beforeEach(async () => {
    adRepository = new MockAdRepository()
    useCase = new DeleteAdUseCase(adRepository)

    testAd = Ad.restore({
      id: crypto.randomUUID(),
      adSetId: 'adset-1',
      name: 'Test Ad',
      status: AdStatus.DRAFT,
      creativeId: 'creative-1',
      metaAdId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await adRepository.save(testAd)
  })

  it('should delete existing ad', async () => {
    await useCase.execute(testAd.id)

    const found = await adRepository.findById(testAd.id)
    expect(found).toBeNull()
  })

  it('should throw AdNotFoundError for non-existent ad', async () => {
    await expect(useCase.execute('non-existent')).rejects.toThrow(
      AdNotFoundError
    )
  })

  it('should not affect other ads when deleting', async () => {
    const otherAd = Ad.restore({
      id: crypto.randomUUID(),
      adSetId: 'adset-1',
      name: 'Other Ad',
      status: AdStatus.DRAFT,
      creativeId: 'creative-1',
      metaAdId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await adRepository.save(otherAd)

    await useCase.execute(testAd.id)

    expect(adRepository.getAll()).toHaveLength(1)
    expect((await adRepository.findById(otherAd.id))?.name).toBe('Other Ad')
  })
})
