import { describe, it, expect, beforeEach } from 'vitest'
import { SelectPixelUseCase } from '@application/use-cases/pixel/SelectPixelUseCase'
import { MockMetaPixelRepository } from '@tests/mocks/repositories/MockMetaPixelRepository'
import { PixelSetupMethod } from '@domain/entities/MetaPixel'

describe('SelectPixelUseCase', () => {
  let useCase: SelectPixelUseCase
  let pixelRepository: MockMetaPixelRepository

  beforeEach(() => {
    pixelRepository = new MockMetaPixelRepository()
    useCase = new SelectPixelUseCase(pixelRepository)
  })

  describe('execute - create new pixel', () => {
    it('should create and save a new pixel', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'My First Pixel',
      })

      expect(result.id).toBeDefined()
      expect(result.userId).toBe('user-123')
      expect(result.metaPixelId).toBe('123456789012345')
      expect(result.name).toBe('My First Pixel')
      expect(result.isActive).toBe(true)
      expect(result.setupMethod).toBe(PixelSetupMethod.MANUAL)
    })

    it('should create pixel with PLATFORM_API setup method when specified', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'Platform Pixel',
        setupMethod: PixelSetupMethod.PLATFORM_API,
      })

      expect(result.setupMethod).toBe(PixelSetupMethod.PLATFORM_API)
    })

    it('should store the pixel in the repository', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'My Pixel',
      })

      const savedPixel = await pixelRepository.findById(result.id)
      expect(savedPixel).not.toBeNull()
      expect(savedPixel?.name).toBe('My Pixel')
    })
  })

  describe('execute - validation errors', () => {
    it('should throw error for empty name', async () => {
      await expect(
        useCase.execute({
          userId: 'user-123',
          metaPixelId: '123456789012345',
          name: '',
        })
      ).rejects.toThrow()
    })

    it('should throw error for invalid Meta Pixel ID format', async () => {
      await expect(
        useCase.execute({
          userId: 'user-123',
          metaPixelId: 'invalid-id',
          name: 'My Pixel',
        })
      ).rejects.toThrow()
    })

    it('should throw error for too short Meta Pixel ID', async () => {
      await expect(
        useCase.execute({
          userId: 'user-123',
          metaPixelId: '12345',
          name: 'My Pixel',
        })
      ).rejects.toThrow()
    })
  })

  describe('execute - duplicate handling', () => {
    it('should throw error when pixel with same metaPixelId already exists for user', async () => {
      // Create first pixel
      await useCase.execute({
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'First Pixel',
      })

      // Try to create duplicate
      await expect(
        useCase.execute({
          userId: 'user-123',
          metaPixelId: '123456789012345',
          name: 'Duplicate Pixel',
        })
      ).rejects.toThrow('already exists')
    })

    it('should allow same metaPixelId for different users', async () => {
      // Create pixel for first user
      await useCase.execute({
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'User 1 Pixel',
      })

      // Create pixel with same metaPixelId for different user
      const result = await useCase.execute({
        userId: 'user-456',
        metaPixelId: '123456789012345',
        name: 'User 2 Pixel',
      })

      expect(result.userId).toBe('user-456')
      expect(result.metaPixelId).toBe('123456789012345')
    })
  })

  describe('execute - DTO transformation', () => {
    it('should return properly formatted MetaPixelDTO', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'Test Pixel',
      })

      expect(result).toMatchObject({
        id: expect.any(String),
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'Test Pixel',
        isActive: true,
        setupMethod: PixelSetupMethod.MANUAL,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    })

    it('should return ISO 8601 formatted dates', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'Test Pixel',
      })

      expect(Date.parse(result.createdAt)).not.toBeNaN()
      expect(Date.parse(result.updatedAt)).not.toBeNaN()
    })
  })
})
