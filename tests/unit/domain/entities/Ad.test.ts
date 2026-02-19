import { describe, it, expect } from 'vitest'
import { Ad } from '@domain/entities/Ad'
import { AdStatus } from '@domain/value-objects/AdStatus'
import { InvalidAdError } from '@domain/errors/InvalidAdError'

describe('Ad', () => {
  const validProps = {
    adSetId: 'adset-1',
    name: '테스트 광고',
    creativeId: 'creative-1',
  }

  describe('create', () => {
    it('should_create_ad_when_valid_props_provided', () => {
      const ad = Ad.create(validProps)

      expect(ad.id).toBeDefined()
      expect(ad.adSetId).toBe('adset-1')
      expect(ad.name).toBe('테스트 광고')
      expect(ad.creativeId).toBe('creative-1')
      expect(ad.status).toBe(AdStatus.DRAFT)
      expect(ad.metaAdId).toBeUndefined()
      expect(ad.createdAt).toBeInstanceOf(Date)
      expect(ad.updatedAt).toBeInstanceOf(Date)
    })

    it('should_throw_when_name_is_empty', () => {
      expect(() => Ad.create({ ...validProps, name: '' })).toThrow(InvalidAdError)
      expect(() => Ad.create({ ...validProps, name: '  ' })).toThrow(InvalidAdError)
    })

    it('should_throw_when_name_exceeds_255_chars', () => {
      const longName = 'a'.repeat(256)
      expect(() => Ad.create({ ...validProps, name: longName })).toThrow(InvalidAdError)
    })

    it('should_throw_when_creative_id_is_empty', () => {
      expect(() => Ad.create({ ...validProps, creativeId: '' })).toThrow(InvalidAdError)
      expect(() => Ad.create({ ...validProps, creativeId: '  ' })).toThrow(InvalidAdError)
    })
  })

  describe('changeStatus', () => {
    it('should_change_status_from_draft_to_active', () => {
      const ad = Ad.create(validProps)
      const activeAd = ad.changeStatus(AdStatus.ACTIVE)

      expect(activeAd.status).toBe(AdStatus.ACTIVE)
      expect(activeAd.id).toBe(ad.id)
    })

    it('should_change_status_from_active_to_paused', () => {
      const ad = Ad.create(validProps).changeStatus(AdStatus.ACTIVE)
      const pausedAd = ad.changeStatus(AdStatus.PAUSED)

      expect(pausedAd.status).toBe(AdStatus.PAUSED)
    })

    it('should_change_status_from_paused_to_active', () => {
      const ad = Ad.create(validProps)
        .changeStatus(AdStatus.ACTIVE)
        .changeStatus(AdStatus.PAUSED)
      const reactivated = ad.changeStatus(AdStatus.ACTIVE)

      expect(reactivated.status).toBe(AdStatus.ACTIVE)
    })

    it('should_change_status_to_deleted_from_any_state', () => {
      const draft = Ad.create(validProps)
      expect(draft.changeStatus(AdStatus.DELETED).status).toBe(AdStatus.DELETED)

      const active = Ad.create(validProps).changeStatus(AdStatus.ACTIVE)
      expect(active.changeStatus(AdStatus.DELETED).status).toBe(AdStatus.DELETED)

      const paused = Ad.create(validProps)
        .changeStatus(AdStatus.ACTIVE)
        .changeStatus(AdStatus.PAUSED)
      expect(paused.changeStatus(AdStatus.DELETED).status).toBe(AdStatus.DELETED)
    })

    it('should_throw_when_invalid_transition_from_draft_to_paused', () => {
      const ad = Ad.create(validProps)
      expect(() => ad.changeStatus(AdStatus.PAUSED)).toThrow(InvalidAdError)
    })

    it('should_throw_when_transition_from_deleted', () => {
      const ad = Ad.create(validProps).changeStatus(AdStatus.DELETED)
      expect(() => ad.changeStatus(AdStatus.ACTIVE)).toThrow(InvalidAdError)
      expect(() => ad.changeStatus(AdStatus.DRAFT)).toThrow(InvalidAdError)
    })
  })

  describe('changeCreative', () => {
    it('should_change_creative_id_and_return_new_instance', () => {
      const ad = Ad.create(validProps)
      const updated = ad.changeCreative('creative-2')

      expect(updated.creativeId).toBe('creative-2')
      expect(updated.id).toBe(ad.id)
      // 불변성 확인 - 원본은 변경되지 않음
      expect(ad.creativeId).toBe('creative-1')
    })

    it('should_throw_when_creative_id_is_empty', () => {
      const ad = Ad.create(validProps)
      expect(() => ad.changeCreative('')).toThrow(InvalidAdError)
    })
  })

  describe('setMetaAdId', () => {
    it('should_set_meta_ad_id', () => {
      const ad = Ad.create(validProps)
      const withMeta = ad.setMetaAdId('meta-ad-123')

      expect(withMeta.metaAdId).toBe('meta-ad-123')
      expect(ad.metaAdId).toBeUndefined()
    })
  })

  describe('restore', () => {
    it('should_restore_ad_from_props', () => {
      const now = new Date()
      const props = {
        id: 'ad-1',
        adSetId: 'adset-1',
        name: '복원된 광고',
        status: AdStatus.ACTIVE,
        creativeId: 'creative-1',
        metaAdId: 'meta-ad-1',
        createdAt: now,
        updatedAt: now,
      }

      const ad = Ad.restore(props)

      expect(ad.id).toBe('ad-1')
      expect(ad.status).toBe(AdStatus.ACTIVE)
      expect(ad.metaAdId).toBe('meta-ad-1')
    })
  })

  describe('toJSON', () => {
    it('should_return_all_properties', () => {
      const ad = Ad.create(validProps)
      const json = ad.toJSON()

      expect(json.id).toBe(ad.id)
      expect(json.adSetId).toBe('adset-1')
      expect(json.name).toBe('테스트 광고')
      expect(json.status).toBe(AdStatus.DRAFT)
      expect(json.creativeId).toBe('creative-1')
    })
  })
})
