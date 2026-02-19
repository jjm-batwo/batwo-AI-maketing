import { describe, it, expect } from 'vitest'
import { Creative } from '@domain/entities/Creative'
import { CreativeFormat } from '@domain/value-objects/CreativeFormat'
import { CTAType } from '@domain/value-objects/CTAType'
import { InvalidCreativeError } from '@domain/errors/InvalidCreativeError'

describe('Creative', () => {
  const validProps = {
    userId: 'user-1',
    name: '테스트 크리에이티브',
    format: CreativeFormat.SINGLE_IMAGE,
  }

  describe('create', () => {
    it('should_create_creative_when_valid_props_provided', () => {
      const creative = Creative.create(validProps)

      expect(creative.id).toBeDefined()
      expect(creative.userId).toBe('user-1')
      expect(creative.name).toBe('테스트 크리에이티브')
      expect(creative.format).toBe(CreativeFormat.SINGLE_IMAGE)
      expect(creative.callToAction).toBe(CTAType.LEARN_MORE)
      expect(creative.assets).toEqual([])
      expect(creative.createdAt).toBeInstanceOf(Date)
      expect(creative.updatedAt).toBeInstanceOf(Date)
    })

    it('should_create_creative_with_optional_fields', () => {
      const creative = Creative.create({
        ...validProps,
        primaryText: '광고 문구입니다',
        headline: '헤드라인',
        description: '설명 텍스트',
        callToAction: CTAType.SHOP_NOW,
        linkUrl: 'https://example.com',
        assets: [{ id: 'asset-1', type: 'IMAGE', fileName: 'img.jpg', blobUrl: 'https://blob/img.jpg' }],
      })

      expect(creative.primaryText).toBe('광고 문구입니다')
      expect(creative.headline).toBe('헤드라인')
      expect(creative.description).toBe('설명 텍스트')
      expect(creative.callToAction).toBe(CTAType.SHOP_NOW)
      expect(creative.linkUrl).toBe('https://example.com')
      expect(creative.assets).toHaveLength(1)
    })

    it('should_throw_when_name_is_empty', () => {
      expect(() => Creative.create({ ...validProps, name: '' })).toThrow(InvalidCreativeError)
      expect(() => Creative.create({ ...validProps, name: '  ' })).toThrow(InvalidCreativeError)
    })

    it('should_throw_when_name_exceeds_255_chars', () => {
      const longName = 'a'.repeat(256)
      expect(() => Creative.create({ ...validProps, name: longName })).toThrow(InvalidCreativeError)
    })

    it('should_throw_when_primary_text_exceeds_500_chars', () => {
      const longText = 'a'.repeat(501)
      expect(() => Creative.create({ ...validProps, primaryText: longText })).toThrow(InvalidCreativeError)
    })

    it('should_throw_when_headline_exceeds_255_chars', () => {
      const longHeadline = 'a'.repeat(256)
      expect(() => Creative.create({ ...validProps, headline: longHeadline })).toThrow(InvalidCreativeError)
    })

    it('should_throw_when_link_url_is_invalid', () => {
      expect(() => Creative.create({ ...validProps, linkUrl: 'not-a-url' })).toThrow(InvalidCreativeError)
      expect(() => Creative.create({ ...validProps, linkUrl: 'ftp://bad' })).not.toThrow()
    })

    it('should_accept_valid_link_url', () => {
      const creative = Creative.create({ ...validProps, linkUrl: 'https://example.com/path' })
      expect(creative.linkUrl).toBe('https://example.com/path')
    })
  })

  describe('updateCopy', () => {
    it('should_update_primary_text', () => {
      const creative = Creative.create({ ...validProps, primaryText: '원본 텍스트' })
      const updated = creative.updateCopy({ primaryText: '수정된 텍스트' })

      expect(updated.primaryText).toBe('수정된 텍스트')
      // 불변성 확인
      expect(creative.primaryText).toBe('원본 텍스트')
    })

    it('should_update_headline', () => {
      const creative = Creative.create({ ...validProps, headline: '원본 헤드라인' })
      const updated = creative.updateCopy({ headline: '수정된 헤드라인' })

      expect(updated.headline).toBe('수정된 헤드라인')
    })

    it('should_update_description', () => {
      const creative = Creative.create(validProps)
      const updated = creative.updateCopy({ description: '새로운 설명' })

      expect(updated.description).toBe('새로운 설명')
    })

    it('should_throw_when_updated_primary_text_exceeds_500_chars', () => {
      const creative = Creative.create(validProps)
      expect(() => creative.updateCopy({ primaryText: 'a'.repeat(501) })).toThrow(InvalidCreativeError)
    })

    it('should_throw_when_updated_headline_exceeds_255_chars', () => {
      const creative = Creative.create(validProps)
      expect(() => creative.updateCopy({ headline: 'a'.repeat(256) })).toThrow(InvalidCreativeError)
    })

    it('should_keep_existing_values_when_not_provided', () => {
      const creative = Creative.create({
        ...validProps,
        primaryText: '기존 텍스트',
        headline: '기존 헤드라인',
        description: '기존 설명',
      })
      const updated = creative.updateCopy({ headline: '새 헤드라인' })

      expect(updated.primaryText).toBe('기존 텍스트')
      expect(updated.headline).toBe('새 헤드라인')
      expect(updated.description).toBe('기존 설명')
    })
  })

  describe('updateAssets', () => {
    it('should_update_assets_and_return_new_instance', () => {
      const creative = Creative.create(validProps)
      const newAssets = [
        { id: 'asset-1', type: 'IMAGE', fileName: 'new.jpg', blobUrl: 'https://blob/new.jpg' },
      ]
      const updated = creative.updateAssets(newAssets)

      expect(updated.assets).toEqual(newAssets)
      expect(creative.assets).toEqual([])
    })
  })

  describe('restore', () => {
    it('should_restore_creative_from_props', () => {
      const now = new Date()
      const props = {
        id: 'creative-1',
        userId: 'user-1',
        name: '복원된 크리에이티브',
        format: CreativeFormat.CAROUSEL,
        primaryText: '텍스트',
        headline: '헤드라인',
        description: '설명',
        callToAction: CTAType.SIGN_UP,
        linkUrl: 'https://example.com',
        assets: [{ id: 'a1', type: 'IMAGE', fileName: 'img.jpg', blobUrl: 'https://blob/img.jpg' }],
        metaCreativeId: 'meta-creative-1',
        createdAt: now,
        updatedAt: now,
      }

      const creative = Creative.restore(props)

      expect(creative.id).toBe('creative-1')
      expect(creative.format).toBe(CreativeFormat.CAROUSEL)
      expect(creative.callToAction).toBe(CTAType.SIGN_UP)
      expect(creative.metaCreativeId).toBe('meta-creative-1')
      expect(creative.assets).toHaveLength(1)
    })
  })

  describe('toJSON', () => {
    it('should_return_all_properties', () => {
      const creative = Creative.create({
        ...validProps,
        primaryText: '텍스트',
        headline: '헤드라인',
      })
      const json = creative.toJSON()

      expect(json.id).toBe(creative.id)
      expect(json.userId).toBe('user-1')
      expect(json.name).toBe('테스트 크리에이티브')
      expect(json.format).toBe(CreativeFormat.SINGLE_IMAGE)
      expect(json.primaryText).toBe('텍스트')
      expect(json.headline).toBe('헤드라인')
    })
  })
})
