import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  MetaPixel,
  CreateMetaPixelProps,
  MetaPixelProps,
  PixelSetupMethod,
} from '@domain/entities/MetaPixel'

describe('MetaPixel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const validCreateProps: CreateMetaPixelProps = {
    userId: 'user-123',
    metaPixelId: '123456789012345',
    name: 'My Store Pixel',
  }

  describe('create', () => {
    it('should create a MetaPixel with valid data', () => {
      const pixel = MetaPixel.create(validCreateProps)

      expect(pixel.id).toBeDefined()
      expect(pixel.userId).toBe('user-123')
      expect(pixel.metaPixelId).toBe('123456789012345')
      expect(pixel.name).toBe('My Store Pixel')
      expect(pixel.isActive).toBe(true)
      expect(pixel.setupMethod).toBe(PixelSetupMethod.MANUAL)
      expect(pixel.createdAt).toBeDefined()
      expect(pixel.updatedAt).toBeDefined()
    })

    it('should create a MetaPixel with custom setup method', () => {
      const pixel = MetaPixel.create({
        ...validCreateProps,
        setupMethod: PixelSetupMethod.PLATFORM_API,
      })

      expect(pixel.setupMethod).toBe(PixelSetupMethod.PLATFORM_API)
    })

    it('should throw error for empty name', () => {
      expect(() =>
        MetaPixel.create({
          ...validCreateProps,
          name: '',
        })
      ).toThrow('Pixel name is required')
    })

    it('should throw error for name exceeding max length', () => {
      const longName = 'a'.repeat(256)

      expect(() =>
        MetaPixel.create({
          ...validCreateProps,
          name: longName,
        })
      ).toThrow('Pixel name cannot exceed 255 characters')
    })

    it('should throw error for invalid Meta Pixel ID format', () => {
      expect(() =>
        MetaPixel.create({
          ...validCreateProps,
          metaPixelId: 'invalid-id',
        })
      ).toThrow('Invalid Meta Pixel ID format')
    })

    it('should throw error for empty Meta Pixel ID', () => {
      expect(() =>
        MetaPixel.create({
          ...validCreateProps,
          metaPixelId: '',
        })
      ).toThrow('Meta Pixel ID is required')
    })
  })

  describe('restore', () => {
    it('should restore MetaPixel from persisted data', () => {
      const props: MetaPixelProps = {
        id: 'pixel-123',
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'Restored Pixel',
        isActive: false,
        setupMethod: PixelSetupMethod.PLATFORM_API,
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-15'),
      }

      const pixel = MetaPixel.restore(props)

      expect(pixel.id).toBe('pixel-123')
      expect(pixel.isActive).toBe(false)
      expect(pixel.setupMethod).toBe(PixelSetupMethod.PLATFORM_API)
      expect(pixel.createdAt).toEqual(new Date('2024-12-01'))
    })
  })

  describe('activate', () => {
    it('should activate an inactive pixel', () => {
      const props: MetaPixelProps = {
        id: 'pixel-123',
        userId: 'user-123',
        metaPixelId: '123456789012345',
        name: 'Test Pixel',
        isActive: false,
        setupMethod: PixelSetupMethod.MANUAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const pixel = MetaPixel.restore(props)
      const activated = pixel.activate()

      expect(activated.isActive).toBe(true)
      expect(pixel.isActive).toBe(false) // Original unchanged (immutability)
    })

    it('should return same state if already active', () => {
      const pixel = MetaPixel.create(validCreateProps)
      const activated = pixel.activate()

      expect(activated.isActive).toBe(true)
    })
  })

  describe('deactivate', () => {
    it('should deactivate an active pixel', () => {
      const pixel = MetaPixel.create(validCreateProps)
      const deactivated = pixel.deactivate()

      expect(deactivated.isActive).toBe(false)
      expect(pixel.isActive).toBe(true) // Original unchanged (immutability)
    })
  })

  describe('updateSetupMethod', () => {
    it('should update setup method', () => {
      const pixel = MetaPixel.create(validCreateProps)
      const updated = pixel.updateSetupMethod(PixelSetupMethod.PLATFORM_API)

      expect(updated.setupMethod).toBe(PixelSetupMethod.PLATFORM_API)
      expect(pixel.setupMethod).toBe(PixelSetupMethod.MANUAL) // Original unchanged
    })
  })

  describe('updateName', () => {
    it('should update pixel name', () => {
      const pixel = MetaPixel.create(validCreateProps)
      const updated = pixel.updateName('New Pixel Name')

      expect(updated.name).toBe('New Pixel Name')
      expect(pixel.name).toBe('My Store Pixel') // Original unchanged
    })

    it('should throw error for empty name', () => {
      const pixel = MetaPixel.create(validCreateProps)

      expect(() => pixel.updateName('')).toThrow('Pixel name is required')
    })
  })

  describe('immutability', () => {
    it('should be immutable after creation', () => {
      const pixel = MetaPixel.create(validCreateProps)
      const deactivated = pixel.deactivate()

      expect(pixel).not.toBe(deactivated)
      expect(pixel.isActive).toBe(true)
      expect(deactivated.isActive).toBe(false)
    })
  })

  describe('toJSON', () => {
    it('should serialize MetaPixel to JSON', () => {
      const pixel = MetaPixel.create(validCreateProps)
      const json = pixel.toJSON()

      expect(json.id).toBe(pixel.id)
      expect(json.userId).toBe('user-123')
      expect(json.metaPixelId).toBe('123456789012345')
      expect(json.name).toBe('My Store Pixel')
      expect(json.isActive).toBe(true)
      expect(json.setupMethod).toBe(PixelSetupMethod.MANUAL)
      expect(json.createdAt).toBeDefined()
      expect(json.updatedAt).toBeDefined()
    })
  })

  describe('isValidMetaPixelId', () => {
    it('should validate correct Meta Pixel ID format (15-16 digits)', () => {
      // This tests the static validation method
      expect(MetaPixel.isValidMetaPixelId('123456789012345')).toBe(true)
      expect(MetaPixel.isValidMetaPixelId('1234567890123456')).toBe(true)
    })

    it('should reject invalid Meta Pixel ID formats', () => {
      expect(MetaPixel.isValidMetaPixelId('12345')).toBe(false) // Too short
      expect(MetaPixel.isValidMetaPixelId('12345678901234567')).toBe(false) // Too long
      expect(MetaPixel.isValidMetaPixelId('abc123def456789')).toBe(false) // Contains letters
      expect(MetaPixel.isValidMetaPixelId('')).toBe(false)
    })
  })
})
