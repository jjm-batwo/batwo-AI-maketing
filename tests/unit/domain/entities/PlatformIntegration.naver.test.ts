import { describe, it, expect } from 'vitest'
import {
  EcommercePlatform,
  PlatformIntegration,
} from '@domain/entities/PlatformIntegration'

describe('EcommercePlatform - NAVER_SMARTSTORE', () => {
  it('should_have_NAVER_SMARTSTORE_as_valid_platform_enum_value', () => {
    expect(EcommercePlatform.NAVER_SMARTSTORE).toBe('NAVER_SMARTSTORE')
  })

  it('should_create_integration_when_NAVER_SMARTSTORE_platform_provided', () => {
    const integration = PlatformIntegration.create({
      pixelId: 'pixel-naver-001',
      platform: EcommercePlatform.NAVER_SMARTSTORE,
      platformStoreId: 'naver-store-001',
      accessToken: 'naver-access-token',
    })

    expect(integration.platform).toBe(EcommercePlatform.NAVER_SMARTSTORE)
  })
})
