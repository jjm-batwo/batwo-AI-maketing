/**
 * 🔴 RED Phase: Pixel API Integration Tests
 *
 * These tests verify that Pixel Use Cases work correctly with the database.
 * Following the same pattern as other integration tests in this project.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupIntegrationTest, getPrismaClient, createTestUser } from '../setup'
import { ListUserPixelsUseCase } from '@application/use-cases/pixel/ListUserPixelsUseCase'
import { SelectPixelUseCase } from '@application/use-cases/pixel/SelectPixelUseCase'
import { SetupPixelUseCase, SetupMode } from '@application/use-cases/pixel/SetupPixelUseCase'
import { GetPixelStatusUseCase, PixelOperationalStatus } from '@application/use-cases/pixel/GetPixelStatusUseCase'
import { MetaPixel, PixelSetupMethod } from '@domain/entities/MetaPixel'
import type { IMetaPixelRepository, MetaPixelFilters, PaginationOptions, PaginatedResult } from '@domain/repositories/IMetaPixelRepository'
import type { PrismaClient } from '@/generated/prisma'

// Prisma-based repository for integration testing
class PrismaMetaPixelRepository implements IMetaPixelRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(pixel: MetaPixel): Promise<MetaPixel> {
    const data = await this.prisma.metaPixel.create({
      data: {
        id: pixel.id,
        userId: pixel.userId,
        metaPixelId: pixel.metaPixelId,
        name: pixel.name,
        isActive: pixel.isActive,
        setupMethod: pixel.setupMethod,
        createdAt: pixel.createdAt,
        updatedAt: pixel.updatedAt,
      },
    })

    return MetaPixel.restore({
      id: data.id,
      userId: data.userId,
      metaPixelId: data.metaPixelId,
      name: data.name,
      isActive: data.isActive,
      setupMethod: data.setupMethod as PixelSetupMethod,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  async findById(id: string): Promise<MetaPixel | null> {
    const data = await this.prisma.metaPixel.findUnique({ where: { id } })
    if (!data) return null

    return MetaPixel.restore({
      id: data.id,
      userId: data.userId,
      metaPixelId: data.metaPixelId,
      name: data.name,
      isActive: data.isActive,
      setupMethod: data.setupMethod as PixelSetupMethod,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  async findByMetaPixelId(metaPixelId: string): Promise<MetaPixel | null> {
    const data = await this.prisma.metaPixel.findFirst({ where: { metaPixelId } })
    if (!data) return null

    return MetaPixel.restore({
      id: data.id,
      userId: data.userId,
      metaPixelId: data.metaPixelId,
      name: data.name,
      isActive: data.isActive,
      setupMethod: data.setupMethod as PixelSetupMethod,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  async findByUserId(userId: string): Promise<MetaPixel[]> {
    const data = await this.prisma.metaPixel.findMany({ where: { userId } })

    return data.map((d) =>
      MetaPixel.restore({
        id: d.id,
        userId: d.userId,
        metaPixelId: d.metaPixelId,
        name: d.name,
        isActive: d.isActive,
        setupMethod: d.setupMethod as PixelSetupMethod,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })
    )
  }

  async findByFilters(
    filters: MetaPixelFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<MetaPixel>> {
    const page = pagination?.page || 1
    const limit = pagination?.limit || 10

    const where: Record<string, unknown> = {}
    if (filters.userId) where.userId = filters.userId
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.setupMethod) where.setupMethod = filters.setupMethod

    const total = await this.prisma.metaPixel.count({ where })
    const data = await this.prisma.metaPixel.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    return {
      data: data.map((d) =>
        MetaPixel.restore({
          id: d.id,
          userId: d.userId,
          metaPixelId: d.metaPixelId,
          name: d.name,
          isActive: d.isActive,
          setupMethod: d.setupMethod as PixelSetupMethod,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        })
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async update(pixel: MetaPixel): Promise<MetaPixel> {
    const data = await this.prisma.metaPixel.update({
      where: { id: pixel.id },
      data: {
        name: pixel.name,
        isActive: pixel.isActive,
        setupMethod: pixel.setupMethod,
        updatedAt: new Date(),
      },
    })

    return MetaPixel.restore({
      id: data.id,
      userId: data.userId,
      metaPixelId: data.metaPixelId,
      name: data.name,
      isActive: data.isActive,
      setupMethod: data.setupMethod as PixelSetupMethod,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.metaPixel.delete({ where: { id } })
  }

  async existsByMetaPixelIdAndUserId(metaPixelId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.metaPixel.count({
      where: { metaPixelId, userId },
    })
    return count > 0
  }
}

// Mock repositories for GetPixelStatusUseCase
class MockPlatformIntegrationRepository {
  async findByPixelId(_pixelId: string) {
    return null
  }
}

class MockConversionEventRepository {
  async countByPixelId(_pixelId: string) {
    return 0
  }
  async getLastEventTime(_pixelId: string) {
    return null
  }
}

describe('Pixel API Integration', () => {
  setupIntegrationTest()

  let pixelRepository: PrismaMetaPixelRepository
  let testUserId: string

  beforeEach(async () => {
    const prisma = getPrismaClient()
    pixelRepository = new PrismaMetaPixelRepository(prisma)

    const user = await createTestUser()
    testUserId = user.id
  })

  describe('ListUserPixelsUseCase', () => {
    it('should return empty list when no pixels exist', async () => {
      const useCase = new ListUserPixelsUseCase(pixelRepository)

      const result = await useCase.execute({ userId: testUserId })

      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })

    it('should return list of user pixels', async () => {
      // Create test pixels
      const pixel1 = MetaPixel.create({
        userId: testUserId,
        metaPixelId: '100000000000001',
        name: 'Pixel 1',
      })
      const pixel2 = MetaPixel.create({
        userId: testUserId,
        metaPixelId: '100000000000002',
        name: 'Pixel 2',
      })

      await pixelRepository.save(pixel1)
      await pixelRepository.save(pixel2)

      const useCase = new ListUserPixelsUseCase(pixelRepository)
      const result = await useCase.execute({ userId: testUserId })

      expect(result.data.length).toBe(2)
      expect(result.total).toBe(2)
    })

    it('should filter by isActive', async () => {
      const activePixel = MetaPixel.create({
        userId: testUserId,
        metaPixelId: '100000000000001',
        name: 'Active Pixel',
      })
      const inactivePixel = MetaPixel.create({
        userId: testUserId,
        metaPixelId: '100000000000002',
        name: 'Inactive Pixel',
      }).deactivate()

      await pixelRepository.save(activePixel)
      await pixelRepository.save(inactivePixel)

      const useCase = new ListUserPixelsUseCase(pixelRepository)
      const result = await useCase.execute({ userId: testUserId, isActive: true })

      expect(result.data.length).toBe(1)
      expect(result.data[0].name).toBe('Active Pixel')
    })

    it('should paginate results', async () => {
      // Create 15 pixels
      for (let i = 0; i < 15; i++) {
        const pixel = MetaPixel.create({
          userId: testUserId,
          metaPixelId: `10000000000000${i.toString().padStart(1, '0')}`,
          name: `Pixel ${i}`,
        })
        await pixelRepository.save(pixel)
      }

      const useCase = new ListUserPixelsUseCase(pixelRepository)
      const result = await useCase.execute({ userId: testUserId, page: 2, limit: 10 })

      expect(result.data.length).toBe(5)
      expect(result.page).toBe(2)
      expect(result.totalPages).toBe(2)
    })
  })

  describe('SelectPixelUseCase', () => {
    it('should create a new pixel', async () => {
      const useCase = new SelectPixelUseCase(pixelRepository)

      const result = await useCase.execute({
        userId: testUserId,
        metaPixelId: '123456789012345',
        name: 'New Pixel',
      })

      expect(result.metaPixelId).toBe('123456789012345')
      expect(result.name).toBe('New Pixel')
      expect(result.id).toBeDefined()

      // Verify in database
      const saved = await pixelRepository.findById(result.id)
      expect(saved).not.toBeNull()
      expect(saved?.name).toBe('New Pixel')
    })

    it('should throw error for invalid metaPixelId', async () => {
      const useCase = new SelectPixelUseCase(pixelRepository)

      await expect(
        useCase.execute({
          userId: testUserId,
          metaPixelId: 'invalid',
          name: 'New Pixel',
        })
      ).rejects.toThrow('Invalid Meta Pixel ID')
    })

    it('should throw error for duplicate pixel', async () => {
      const existingPixel = MetaPixel.create({
        userId: testUserId,
        metaPixelId: '123456789012345',
        name: 'Existing Pixel',
      })
      await pixelRepository.save(existingPixel)

      const useCase = new SelectPixelUseCase(pixelRepository)

      await expect(
        useCase.execute({
          userId: testUserId,
          metaPixelId: '123456789012345',
          name: 'Duplicate Pixel',
        })
      ).rejects.toThrow('already exists')
    })
  })

  describe('SetupPixelUseCase', () => {
    it('should setup existing pixel with manual mode', async () => {
      const existingPixel = MetaPixel.create({
        userId: testUserId,
        metaPixelId: '123456789012345',
        name: 'Existing Pixel',
      })
      await pixelRepository.save(existingPixel)

      const useCase = new SetupPixelUseCase(pixelRepository)

      const result = await useCase.execute({
        userId: testUserId,
        pixelId: existingPixel.id,
        setupMode: SetupMode.MANUAL,
      })

      expect(result.pixelId).toBe(existingPixel.id)
      expect(result.setupMode).toBe(SetupMode.MANUAL)
      expect(result.status).toBe('PENDING')
      expect(result.scriptSnippet).toContain('123456789012345')
    })

    it('should create new pixel and setup with manual mode', async () => {
      const useCase = new SetupPixelUseCase(pixelRepository)

      const result = await useCase.execute({
        userId: testUserId,
        newPixel: {
          metaPixelId: '123456789012345',
          name: 'New Pixel',
        },
        setupMode: SetupMode.MANUAL,
      })

      expect(result.pixelId).toBeDefined()
      expect(result.setupMode).toBe(SetupMode.MANUAL)
      expect(result.scriptSnippet).toContain('123456789012345')

      // Verify in database
      const saved = await pixelRepository.findById(result.pixelId)
      expect(saved).not.toBeNull()
      expect(saved?.setupMethod).toBe(PixelSetupMethod.MANUAL)
    })

    it('should setup with PLATFORM_API mode', async () => {
      const useCase = new SetupPixelUseCase(pixelRepository)

      const result = await useCase.execute({
        userId: testUserId,
        newPixel: {
          metaPixelId: '123456789012345',
          name: 'Platform Pixel',
        },
        setupMode: SetupMode.PLATFORM_API,
        platform: 'CAFE24',
      })

      expect(result.setupMode).toBe(SetupMode.PLATFORM_API)
      expect(result.status).toBe('AWAITING_PLATFORM_CONNECT')
      expect(result.platformConnectUrl).toContain('cafe24')

      // Verify in database
      const saved = await pixelRepository.findById(result.pixelId)
      expect(saved?.setupMethod).toBe(PixelSetupMethod.PLATFORM_API)
    })
  })

  describe('GetPixelStatusUseCase', () => {
    it('should return pixel status for manual pixel', async () => {
      const pixel = MetaPixel.create({
        userId: testUserId,
        metaPixelId: '123456789012345',
        name: 'Test Pixel',
        setupMethod: PixelSetupMethod.MANUAL,
      })
      await pixelRepository.save(pixel)

      const useCase = new GetPixelStatusUseCase(
        pixelRepository,
        new MockPlatformIntegrationRepository(),
        new MockConversionEventRepository()
      )

      const result = await useCase.execute({
        userId: testUserId,
        pixelId: pixel.id,
      })

      expect(result.pixelId).toBe(pixel.id)
      expect(result.operationalStatus).toBe(PixelOperationalStatus.PENDING)
      expect(result.hasReceivedEvents).toBe(false)
    })

    it('should throw error for non-existent pixel', async () => {
      const useCase = new GetPixelStatusUseCase(
        pixelRepository,
        new MockPlatformIntegrationRepository(),
        new MockConversionEventRepository()
      )

      await expect(
        useCase.execute({
          userId: testUserId,
          pixelId: 'non-existent-id',
        })
      ).rejects.toThrow('Pixel not found')
    })
  })
})
