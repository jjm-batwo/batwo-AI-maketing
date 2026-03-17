import { describe, it, expect, beforeEach } from 'vitest'
import { ListAdsUseCase } from '@application/use-cases/ad/ListAdsUseCase'
import { MockAdRepository } from '@tests/mocks/repositories/MockAdRepository'
import { Ad } from '@domain/entities/Ad'
import { AdStatus } from '@domain/value-objects/AdStatus'

describe('ListAdsUseCase', () => {
  let useCase: ListAdsUseCase
  let adRepository: MockAdRepository

  const createAd = (name: string, adSetId: string): Ad =>
    Ad.restore({
      id: crypto.randomUUID(),
      adSetId,
      name,
      status: AdStatus.DRAFT,
      creativeId: 'creative-1',
      metaAdId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

  beforeEach(() => {
    adRepository = new MockAdRepository()
    useCase = new ListAdsUseCase(adRepository)
  })

  it('should return ads for given adSetId', async () => {
    await adRepository.save(createAd('Ad 1', 'adset-1'))
    await adRepository.save(createAd('Ad 2', 'adset-1'))
    await adRepository.save(createAd('Ad 3', 'adset-2'))

    const result = await useCase.execute('adset-1')

    expect(result).toHaveLength(2)
    expect(result.map((a) => a.name)).toEqual(
      expect.arrayContaining(['Ad 1', 'Ad 2'])
    )
  })

  it('should return empty array when no ads exist', async () => {
    const result = await useCase.execute('non-existent')

    expect(result).toEqual([])
  })

  it('should return DTOs with ISO date strings', async () => {
    await adRepository.save(createAd('Ad 1', 'adset-1'))

    const result = await useCase.execute('adset-1')

    expect(result[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(result[0].updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
