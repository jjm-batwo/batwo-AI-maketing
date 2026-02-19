import { describe, it, expect } from 'vitest'
import { CompetitorTracking } from '@domain/entities/CompetitorTracking'

describe('CompetitorTracking', () => {
  const validParams = {
    userId: 'user-1',
    pageId: '123456789',
    pageName: 'Test Brand',
    industry: 'ecommerce',
  }

  describe('create', () => {
    it('should_create_competitor_tracking_with_valid_params', () => {
      const tracking = CompetitorTracking.create(validParams)

      expect(tracking.userId).toBe('user-1')
      expect(tracking.pageId).toBe('123456789')
      expect(tracking.pageName).toBe('Test Brand')
      expect(tracking.industry).toBe('ecommerce')
      expect(tracking.id).toBe('')
      expect(tracking.createdAt).toBeInstanceOf(Date)
      expect(tracking.updatedAt).toBeInstanceOf(Date)
    })

    it('should_create_competitor_tracking_without_industry', () => {
      const tracking = CompetitorTracking.create({
        userId: 'user-1',
        pageId: '123456789',
        pageName: 'Test Brand',
      })

      expect(tracking.industry).toBeNull()
    })
  })

  describe('fromPersistence', () => {
    it('should_restore_competitor_tracking_from_persistence', () => {
      const now = new Date()
      const tracking = CompetitorTracking.fromPersistence({
        id: 'ct-1',
        userId: 'user-1',
        pageId: '123456789',
        pageName: 'Test Brand',
        industry: 'fashion',
        createdAt: now,
        updatedAt: now,
      })

      expect(tracking.id).toBe('ct-1')
      expect(tracking.userId).toBe('user-1')
      expect(tracking.pageId).toBe('123456789')
      expect(tracking.pageName).toBe('Test Brand')
      expect(tracking.industry).toBe('fashion')
      expect(tracking.createdAt).toBe(now)
      expect(tracking.updatedAt).toBe(now)
    })
  })

  describe('toJSON', () => {
    it('should_return_plain_object_with_all_props', () => {
      const tracking = CompetitorTracking.create(validParams)
      const json = tracking.toJSON()

      expect(json).toEqual({
        id: '',
        userId: 'user-1',
        pageId: '123456789',
        pageName: 'Test Brand',
        industry: 'ecommerce',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
    })
  })
})
