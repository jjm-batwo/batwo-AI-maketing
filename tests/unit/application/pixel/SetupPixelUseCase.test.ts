import { describe, it, expect, beforeEach } from 'vitest'
import { SetupPixelUseCase, SetupMode } from '@application/use-cases/pixel/SetupPixelUseCase'
import { MockMetaPixelRepository } from '@tests/mocks/repositories/MockMetaPixelRepository'
import { MetaPixel, PixelSetupMethod } from '@domain/entities/MetaPixel'

describe('SetupPixelUseCase', () => {
  let useCase: SetupPixelUseCase
  let pixelRepository: MockMetaPixelRepository

  beforeEach(() => {
    pixelRepository = new MockMetaPixelRepository()
    useCase = new SetupPixelUseCase(pixelRepository)
  })

  describe('execute - select existing pixel for manual setup', () => {
    it('should setup existing pixel with manual mode', async () => {
      // Create existing pixel in repository
      const existingPixel = MetaPixel.create({
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'Existing Pixel',
      })
      await pixelRepository.save(existingPixel)

      const result = await useCase.execute({
        userId: 'user-123',
        pixelId: existingPixel.id,
        setupMode: SetupMode.MANUAL,
      })

      expect(result.pixelId).toBe(existingPixel.id)
      expect(result.setupMode).toBe(SetupMode.MANUAL)
      expect(result.status).toBe('PENDING')
      expect(result.scriptSnippet).toBeDefined()
      expect(result.scriptSnippet).toContain('123456789012345')
    })

    it('should throw error for non-existent pixel', async () => {
      await expect(
        useCase.execute({
          userId: 'user-123',
          pixelId: 'non-existent-id',
          setupMode: SetupMode.MANUAL,
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
          setupMode: SetupMode.MANUAL,
        })
      ).rejects.toThrow('Pixel not found')
    })
  })

  describe('execute - create new pixel for manual setup', () => {
    it('should create new pixel and setup with manual mode', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        newPixel: {
          metaPixelId: '123456789012345',
          name: 'New Pixel',
        },
        setupMode: SetupMode.MANUAL,
      })

      expect(result.pixelId).toBeDefined()
      expect(result.setupMode).toBe(SetupMode.MANUAL)
      expect(result.status).toBe('PENDING')
      expect(result.scriptSnippet).toContain('123456789012345')

      // Verify pixel was saved
      const savedPixel = await pixelRepository.findById(result.pixelId)
      expect(savedPixel).not.toBeNull()
      expect(savedPixel?.name).toBe('New Pixel')
      expect(savedPixel?.setupMethod).toBe(PixelSetupMethod.MANUAL)
    })

    it('should throw error if both pixelId and newPixel provided', async () => {
      const existingPixel = MetaPixel.create({
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'Existing Pixel',
      })
      await pixelRepository.save(existingPixel)

      await expect(
        useCase.execute({
          userId: 'user-123',
          pixelId: existingPixel.id,
          newPixel: {
            metaPixelId: '999999999999999',
            name: 'Another Pixel',
          },
          setupMode: SetupMode.MANUAL,
        })
      ).rejects.toThrow('Cannot specify both pixelId and newPixel')
    })

    it('should throw error if neither pixelId nor newPixel provided', async () => {
      await expect(
        useCase.execute({
          userId: 'user-123',
          setupMode: SetupMode.MANUAL,
        })
      ).rejects.toThrow('Either pixelId or newPixel must be provided')
    })
  })

  describe('execute - platform API setup mode', () => {
    it('should update pixel setup method to PLATFORM_API', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        newPixel: {
          metaPixelId: '123456789012345',
          name: 'Platform Pixel',
        },
        setupMode: SetupMode.PLATFORM_API,
        platform: 'CAFE24',
      })

      expect(result.setupMode).toBe(SetupMode.PLATFORM_API)
      expect(result.status).toBe('AWAITING_PLATFORM_CONNECT')

      const savedPixel = await pixelRepository.findById(result.pixelId)
      expect(savedPixel?.setupMethod).toBe(PixelSetupMethod.PLATFORM_API)
    })

    it('should return platform connect URL for Cafe24', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        newPixel: {
          metaPixelId: '123456789012345',
          name: 'Cafe24 Pixel',
        },
        setupMode: SetupMode.PLATFORM_API,
        platform: 'CAFE24',
      })

      expect(result.platformConnectUrl).toBeDefined()
      expect(result.platformConnectUrl).toContain('cafe24')
    })
  })

  describe('execute - setup result DTO', () => {
    it('should return complete SetupPixelResultDTO for manual mode', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        newPixel: {
          metaPixelId: '123456789012345',
          name: 'Test Pixel',
        },
        setupMode: SetupMode.MANUAL,
      })

      expect(result).toMatchObject({
        pixelId: expect.any(String),
        metaPixelId: '123456789012345',
        name: 'Test Pixel',
        setupMode: SetupMode.MANUAL,
        status: 'PENDING',
        scriptSnippet: expect.any(String),
      })
      expect(result.platformConnectUrl).toBeUndefined()
    })

    it('should return complete SetupPixelResultDTO for platform mode', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        newPixel: {
          metaPixelId: '123456789012345',
          name: 'Test Pixel',
        },
        setupMode: SetupMode.PLATFORM_API,
        platform: 'CAFE24',
      })

      expect(result).toMatchObject({
        pixelId: expect.any(String),
        metaPixelId: '123456789012345',
        name: 'Test Pixel',
        setupMode: SetupMode.PLATFORM_API,
        status: 'AWAITING_PLATFORM_CONNECT',
        platformConnectUrl: expect.any(String),
      })
      expect(result.scriptSnippet).toBeUndefined()
    })
  })

  describe('execute - validation', () => {
    it('should validate new pixel metaPixelId format', async () => {
      await expect(
        useCase.execute({
          userId: 'user-123',
          newPixel: {
            metaPixelId: 'invalid',
            name: 'Test Pixel',
          },
          setupMode: SetupMode.MANUAL,
        })
      ).rejects.toThrow('Invalid Meta Pixel ID')
    })

    it('should validate new pixel name is not empty', async () => {
      await expect(
        useCase.execute({
          userId: 'user-123',
          newPixel: {
            metaPixelId: '123456789012345',
            name: '',
          },
          setupMode: SetupMode.MANUAL,
        })
      ).rejects.toThrow('Pixel name is required')
    })

    it('should validate platform is specified for PLATFORM_API mode', async () => {
      await expect(
        useCase.execute({
          userId: 'user-123',
          newPixel: {
            metaPixelId: '123456789012345',
            name: 'Test Pixel',
          },
          setupMode: SetupMode.PLATFORM_API,
          // platform is missing
        })
      ).rejects.toThrow('Platform must be specified for PLATFORM_API mode')
    })
  })
})
