import { describe, it, expect, beforeEach } from 'vitest'
import { ListUserPixelsUseCase } from '@application/use-cases/pixel/ListUserPixelsUseCase'
import { MockMetaPixelRepository } from '@tests/mocks/repositories/MockMetaPixelRepository'
import { MetaPixel, PixelSetupMethod } from '@domain/entities/MetaPixel'

describe('ListUserPixelsUseCase', () => {
  let useCase: ListUserPixelsUseCase
  let pixelRepository: MockMetaPixelRepository

  beforeEach(() => {
    pixelRepository = new MockMetaPixelRepository()
    useCase = new ListUserPixelsUseCase(pixelRepository)
  })

  const createTestPixel = (
    userId: string,
    name: string,
    metaPixelId: string = '123456789012345',
    options?: { isActive?: boolean; setupMethod?: PixelSetupMethod }
  ): MetaPixel => {
    let pixel = MetaPixel.create({
      userId,
      name,
      metaPixelId,
      setupMethod: options?.setupMethod,
    })

    if (options?.isActive === false) {
      pixel = pixel.deactivate()
    }

    return pixel
  }

  describe('execute - basic pagination', () => {
    it('should use default pagination (page 1, limit 10)', async () => {
      const pixel = createTestPixel('user-123', 'Test Pixel')
      await pixelRepository.save(pixel)

      const result = await useCase.execute({ userId: 'user-123' })

      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
    })

    it('should use custom pagination when provided', async () => {
      for (let i = 0; i < 25; i++) {
        const pixel = createTestPixel(
          'user-123',
          `Pixel ${i}`,
          `${100000000000000 + i}` // Unique 15-digit Meta Pixel IDs
        )
        await pixelRepository.save(pixel)
      }

      const result = await useCase.execute({
        userId: 'user-123',
        page: 2,
        limit: 5,
      })

      expect(result.page).toBe(2)
      expect(result.limit).toBe(5)
      expect(result.data.length).toBe(5)
      expect(result.total).toBe(25)
      expect(result.totalPages).toBe(5)
    })
  })

  describe('execute - user filtering', () => {
    it('should return all pixels for user', async () => {
      const pixel1 = createTestPixel('user-123', 'Pixel 1', '100000000000001')
      const pixel2 = createTestPixel('user-123', 'Pixel 2', '100000000000002')
      const pixel3 = createTestPixel('other-user', 'Pixel 3', '100000000000003')

      await pixelRepository.save(pixel1)
      await pixelRepository.save(pixel2)
      await pixelRepository.save(pixel3)

      const result = await useCase.execute({ userId: 'user-123' })

      expect(result.data.length).toBe(2)
      expect(result.total).toBe(2)
    })

    it('should return empty list for user with no pixels', async () => {
      const pixel = createTestPixel('other-user', 'Pixel 1')
      await pixelRepository.save(pixel)

      const result = await useCase.execute({ userId: 'user-123' })

      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
      expect(result.totalPages).toBe(0)
    })
  })

  describe('execute - isActive filtering', () => {
    it('should filter by active pixels only', async () => {
      const activePixel = createTestPixel('user-123', 'Active Pixel', '100000000000001')
      const inactivePixel = createTestPixel('user-123', 'Inactive Pixel', '100000000000002', {
        isActive: false,
      })

      await pixelRepository.save(activePixel)
      await pixelRepository.save(inactivePixel)

      const result = await useCase.execute({
        userId: 'user-123',
        isActive: true,
      })

      expect(result.data.length).toBe(1)
      expect(result.data[0].name).toBe('Active Pixel')
      expect(result.data[0].isActive).toBe(true)
    })

    it('should filter by inactive pixels only', async () => {
      const activePixel = createTestPixel('user-123', 'Active Pixel', '100000000000001')
      const inactivePixel = createTestPixel('user-123', 'Inactive Pixel', '100000000000002', {
        isActive: false,
      })

      await pixelRepository.save(activePixel)
      await pixelRepository.save(inactivePixel)

      const result = await useCase.execute({
        userId: 'user-123',
        isActive: false,
      })

      expect(result.data.length).toBe(1)
      expect(result.data[0].name).toBe('Inactive Pixel')
      expect(result.data[0].isActive).toBe(false)
    })
  })

  describe('execute - setupMethod filtering', () => {
    it('should filter by MANUAL setup method', async () => {
      const manualPixel = createTestPixel('user-123', 'Manual Pixel', '100000000000001', {
        setupMethod: PixelSetupMethod.MANUAL,
      })
      const apiPixel = createTestPixel('user-123', 'API Pixel', '100000000000002', {
        setupMethod: PixelSetupMethod.PLATFORM_API,
      })

      await pixelRepository.save(manualPixel)
      await pixelRepository.save(apiPixel)

      const result = await useCase.execute({
        userId: 'user-123',
        setupMethod: PixelSetupMethod.MANUAL,
      })

      expect(result.data.length).toBe(1)
      expect(result.data[0].name).toBe('Manual Pixel')
      expect(result.data[0].setupMethod).toBe(PixelSetupMethod.MANUAL)
    })

    it('should filter by PLATFORM_API setup method', async () => {
      const manualPixel = createTestPixel('user-123', 'Manual Pixel', '100000000000001', {
        setupMethod: PixelSetupMethod.MANUAL,
      })
      const apiPixel = createTestPixel('user-123', 'API Pixel', '100000000000002', {
        setupMethod: PixelSetupMethod.PLATFORM_API,
      })

      await pixelRepository.save(manualPixel)
      await pixelRepository.save(apiPixel)

      const result = await useCase.execute({
        userId: 'user-123',
        setupMethod: PixelSetupMethod.PLATFORM_API,
      })

      expect(result.data.length).toBe(1)
      expect(result.data[0].name).toBe('API Pixel')
      expect(result.data[0].setupMethod).toBe(PixelSetupMethod.PLATFORM_API)
    })
  })

  describe('execute - pagination', () => {
    it('should paginate results correctly', async () => {
      for (let i = 0; i < 15; i++) {
        const pixel = createTestPixel('user-123', `Pixel ${i}`, `${100000000000000 + i}`)
        await pixelRepository.save(pixel)
      }

      const page1 = await useCase.execute({
        userId: 'user-123',
        page: 1,
        limit: 10,
      })

      expect(page1.data.length).toBe(10)
      expect(page1.total).toBe(15)
      expect(page1.totalPages).toBe(2)
      expect(page1.page).toBe(1)

      const page2 = await useCase.execute({
        userId: 'user-123',
        page: 2,
        limit: 10,
      })

      expect(page2.data.length).toBe(5)
      expect(page2.page).toBe(2)
    })

    it('should return empty data for page beyond total pages', async () => {
      for (let i = 0; i < 5; i++) {
        const pixel = createTestPixel('user-123', `Pixel ${i}`, `${100000000000000 + i}`)
        await pixelRepository.save(pixel)
      }

      const result = await useCase.execute({
        userId: 'user-123',
        page: 10,
        limit: 10,
      })

      expect(result.data).toEqual([])
      expect(result.total).toBe(5)
    })
  })

  describe('execute - DTO transformation', () => {
    it('should return properly transformed MetaPixelDTO', async () => {
      const pixel = createTestPixel('user-123', 'Test Pixel', '123456789012345')
      await pixelRepository.save(pixel)

      const result = await useCase.execute({ userId: 'user-123' })

      expect(result.data[0]).toMatchObject({
        id: pixel.id,
        userId: 'user-123',
        name: 'Test Pixel',
        metaPixelId: '123456789012345',
        isActive: true,
        setupMethod: PixelSetupMethod.MANUAL,
      })
      expect(result.data[0].createdAt).toBeDefined()
      expect(result.data[0].updatedAt).toBeDefined()
    })
  })
})
