import { describe, it, expect, beforeEach } from 'vitest'
import { GetPixelStatusUseCase, PixelOperationalStatus } from '@application/use-cases/pixel/GetPixelStatusUseCase'
import { MockMetaPixelRepository } from '@tests/mocks/repositories/MockMetaPixelRepository'
import { MetaPixel, PixelSetupMethod } from '@domain/entities/MetaPixel'

// Mock platform integration repository
class MockPlatformIntegrationRepository {
  private integrations: Map<string, { status: string; lastSyncAt: Date | null; errorMessage: string | null }> = new Map()

  async findByPixelId(pixelId: string) {
    return this.integrations.get(pixelId) || null
  }

  async save(pixelId: string, data: { status: string; lastSyncAt: Date | null; errorMessage: string | null }) {
    this.integrations.set(pixelId, data)
  }

  clear() {
    this.integrations.clear()
  }
}

// Mock conversion event repository
class MockConversionEventRepository {
  private events: Map<string, { count: number; lastEventAt: Date | null }> = new Map()

  async countByPixelId(pixelId: string): Promise<number> {
    return this.events.get(pixelId)?.count || 0
  }

  async getLastEventTime(pixelId: string): Promise<Date | null> {
    return this.events.get(pixelId)?.lastEventAt || null
  }

  async setEvents(pixelId: string, count: number, lastEventAt: Date | null) {
    this.events.set(pixelId, { count, lastEventAt })
  }

  clear() {
    this.events.clear()
  }
}

describe('GetPixelStatusUseCase', () => {
  let useCase: GetPixelStatusUseCase
  let pixelRepository: MockMetaPixelRepository
  let platformIntegrationRepository: MockPlatformIntegrationRepository
  let conversionEventRepository: MockConversionEventRepository

  beforeEach(() => {
    pixelRepository = new MockMetaPixelRepository()
    platformIntegrationRepository = new MockPlatformIntegrationRepository()
    conversionEventRepository = new MockConversionEventRepository()
    useCase = new GetPixelStatusUseCase(
      pixelRepository,
      platformIntegrationRepository,
      conversionEventRepository
    )
  })

  describe('execute - pixel not found', () => {
    it('should throw error for non-existent pixel', async () => {
      await expect(
        useCase.execute({
          userId: 'user-123',
          pixelId: 'non-existent-id',
        })
      ).rejects.toThrow('Pixel not found')
    })

    it('should throw error if pixel belongs to different user', async () => {
      const otherUserPixel = MetaPixel.create({
        userId: 'other-user',
        metaPixelId: '123456789012345',
        name: 'Other User Pixel',
      })
      await pixelRepository.save(otherUserPixel)

      await expect(
        useCase.execute({
          userId: 'user-123',
          pixelId: otherUserPixel.id,
        })
      ).rejects.toThrow('Pixel not found')
    })
  })

  describe('execute - manual setup pixel status', () => {
    it('should return PENDING status for manual pixel with no events', async () => {
      const pixel = MetaPixel.create({
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'Manual Pixel',
        setupMethod: PixelSetupMethod.MANUAL,
      })
      await pixelRepository.save(pixel)

      const result = await useCase.execute({
        userId: 'user-123',
        pixelId: pixel.id,
      })

      expect(result.operationalStatus).toBe(PixelOperationalStatus.PENDING)
      expect(result.hasReceivedEvents).toBe(false)
      expect(result.eventCount).toBe(0)
    })

    it('should return RECEIVING_EVENTS status for manual pixel with events', async () => {
      const pixel = MetaPixel.create({
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'Manual Pixel',
        setupMethod: PixelSetupMethod.MANUAL,
      })
      await pixelRepository.save(pixel)
      await conversionEventRepository.setEvents(pixel.id, 10, new Date())

      const result = await useCase.execute({
        userId: 'user-123',
        pixelId: pixel.id,
      })

      expect(result.operationalStatus).toBe(PixelOperationalStatus.RECEIVING_EVENTS)
      expect(result.hasReceivedEvents).toBe(true)
      expect(result.eventCount).toBe(10)
    })
  })

  describe('execute - platform API pixel status', () => {
    it('should return AWAITING_PLATFORM_CONNECT when no integration exists', async () => {
      const pixel = MetaPixel.create({
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'Platform Pixel',
        setupMethod: PixelSetupMethod.PLATFORM_API,
      })
      await pixelRepository.save(pixel)

      const result = await useCase.execute({
        userId: 'user-123',
        pixelId: pixel.id,
      })

      expect(result.operationalStatus).toBe(PixelOperationalStatus.AWAITING_PLATFORM_CONNECT)
    })

    it('should return PLATFORM_CONNECTED when integration is connected', async () => {
      const pixel = MetaPixel.create({
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'Platform Pixel',
        setupMethod: PixelSetupMethod.PLATFORM_API,
      })
      await pixelRepository.save(pixel)
      await platformIntegrationRepository.save(pixel.id, {
        status: 'CONNECTED',
        lastSyncAt: null,
        errorMessage: null,
      })

      const result = await useCase.execute({
        userId: 'user-123',
        pixelId: pixel.id,
      })

      expect(result.operationalStatus).toBe(PixelOperationalStatus.PLATFORM_CONNECTED)
    })

    it('should return ACTIVE when integration is active with events', async () => {
      const pixel = MetaPixel.create({
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'Platform Pixel',
        setupMethod: PixelSetupMethod.PLATFORM_API,
      })
      await pixelRepository.save(pixel)
      await platformIntegrationRepository.save(pixel.id, {
        status: 'ACTIVE',
        lastSyncAt: new Date(),
        errorMessage: null,
      })
      await conversionEventRepository.setEvents(pixel.id, 50, new Date())

      const result = await useCase.execute({
        userId: 'user-123',
        pixelId: pixel.id,
      })

      expect(result.operationalStatus).toBe(PixelOperationalStatus.ACTIVE)
      expect(result.hasReceivedEvents).toBe(true)
      expect(result.eventCount).toBe(50)
    })

    it('should return ERROR when platform integration has error', async () => {
      const pixel = MetaPixel.create({
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'Platform Pixel',
        setupMethod: PixelSetupMethod.PLATFORM_API,
      })
      await pixelRepository.save(pixel)
      await platformIntegrationRepository.save(pixel.id, {
        status: 'ERROR',
        lastSyncAt: null,
        errorMessage: 'Token expired',
      })

      const result = await useCase.execute({
        userId: 'user-123',
        pixelId: pixel.id,
      })

      expect(result.operationalStatus).toBe(PixelOperationalStatus.ERROR)
      expect(result.errorMessage).toBe('Token expired')
    })
  })

  describe('execute - result DTO structure', () => {
    it('should return complete PixelStatusDTO', async () => {
      const pixel = MetaPixel.create({
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'Test Pixel',
        setupMethod: PixelSetupMethod.MANUAL,
      })
      await pixelRepository.save(pixel)
      const lastEventTime = new Date()
      await conversionEventRepository.setEvents(pixel.id, 25, lastEventTime)

      const result = await useCase.execute({
        userId: 'user-123',
        pixelId: pixel.id,
      })

      expect(result).toMatchObject({
        pixelId: pixel.id,
        metaPixelId: '123456789012345',
        name: 'Test Pixel',
        isActive: true,
        setupMethod: PixelSetupMethod.MANUAL,
        operationalStatus: PixelOperationalStatus.RECEIVING_EVENTS,
        hasReceivedEvents: true,
        eventCount: 25,
        lastEventAt: lastEventTime.toISOString(),
      })
    })

    it('should return null for lastEventAt when no events', async () => {
      const pixel = MetaPixel.create({
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'Test Pixel',
      })
      await pixelRepository.save(pixel)

      const result = await useCase.execute({
        userId: 'user-123',
        pixelId: pixel.id,
      })

      expect(result.lastEventAt).toBeNull()
    })
  })
})
