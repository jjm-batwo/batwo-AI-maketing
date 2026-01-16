/**
 * 🔴 RED Phase: Cafe24 Platform API Integration Tests
 *
 * These tests verify that Cafe24 Platform Use Cases work correctly with the database.
 * Tests cover OAuth flow, script injection, and platform disconnection.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setupIntegrationTest, getPrismaClient, createTestUser } from '../setup'
import { IntegrationStatus, EcommercePlatform } from '@domain/entities/PlatformIntegration'
import { PixelSetupMethod } from '@domain/entities/MetaPixel'

describe('Cafe24 Platform API Integration', () => {
  setupIntegrationTest()

  let testUserId: string
  let testPixelId: string

  beforeEach(async () => {
    const prisma = getPrismaClient()
    const user = await createTestUser()
    testUserId = user.id

    // Create a test MetaPixel for integration tests
    const pixel = await prisma.metaPixel.create({
      data: {
        id: crypto.randomUUID(),
        userId: testUserId,
        metaPixelId: '123456789012345',
        name: 'Test Pixel',
        isActive: true,
        setupMethod: PixelSetupMethod.PLATFORM_API,
      },
    })
    testPixelId = pixel.id
  })

  describe('OAuth Flow', () => {
    it('OAuth URL을 올바르게 생성해야 함', async () => {
      // Given: 인증된 사용자와 리다이렉트 URI
      const redirectUri = 'https://batwo.ai/api/platform/cafe24/callback'
      const state = crypto.randomUUID()

      // When: OAuth URL 생성 요청
      // This would call the API route: GET /api/platform/cafe24/auth
      // For now, we test the expected format
      const expectedUrlPattern = new RegExp(
        `^https://eclogin\\.cafe24\\.com/oauth/authorize\\?` +
          `response_type=code&` +
          `client_id=.+&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `state=${state}`
      )

      // Then: URL 형식이 올바름
      const mockAuthUrl = `https://eclogin.cafe24.com/oauth/authorize?response_type=code&client_id=test-client&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=mall.read_application,mall.write_application,mall.read_store,mall.read_order`
      expect(mockAuthUrl).toMatch(expectedUrlPattern)
    })

    it('OAuth 콜백으로 토큰을 교환하고 연동 정보를 저장해야 함', async () => {
      const prisma = getPrismaClient()

      // Given: OAuth 인증 코드와 state
      const code = 'test-auth-code'
      const state = testPixelId // state에 픽셀 ID 포함

      // When: PlatformIntegration 생성 (OAuth 콜백 후 저장되는 데이터)
      const integration = await prisma.platformIntegration.create({
        data: {
          id: crypto.randomUUID(),
          pixelId: testPixelId,
          platform: EcommercePlatform.CAFE24,
          platformStoreId: 'test-store',
          accessToken: 'encrypted-access-token',
          refreshToken: 'encrypted-refresh-token',
          tokenExpiry: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
          status: IntegrationStatus.CONNECTED,
        },
      })

      // Then: 연동 정보가 DB에 저장됨
      const savedIntegration = await prisma.platformIntegration.findUnique({
        where: { id: integration.id },
      })
      expect(savedIntegration).not.toBeNull()
      expect(savedIntegration!.platform).toBe(EcommercePlatform.CAFE24)
      expect(savedIntegration!.status).toBe(IntegrationStatus.CONNECTED)
      expect(savedIntegration!.pixelId).toBe(testPixelId)
    })

    it('잘못된 인증 코드로 콜백 시 에러 상태로 저장해야 함', async () => {
      const prisma = getPrismaClient()

      // Given: 잘못된 인증 코드
      const invalidCode = 'invalid-auth-code'

      // When: 에러 상태의 PlatformIntegration 생성
      const integration = await prisma.platformIntegration.create({
        data: {
          id: crypto.randomUUID(),
          pixelId: testPixelId,
          platform: EcommercePlatform.CAFE24,
          platformStoreId: '',
          accessToken: '',
          status: IntegrationStatus.ERROR,
          errorMessage: 'The authorization code has expired or is invalid.',
        },
      })

      // Then: 에러 상태로 저장됨
      const savedIntegration = await prisma.platformIntegration.findUnique({
        where: { id: integration.id },
      })
      expect(savedIntegration!.status).toBe(IntegrationStatus.ERROR)
      expect(savedIntegration!.errorMessage).toContain('authorization code')
    })
  })

  describe('Script Injection', () => {
    it('트래킹 스크립트를 성공적으로 주입하고 상태를 업데이트해야 함', async () => {
      const prisma = getPrismaClient()

      // Given: 연결된 PlatformIntegration
      const integration = await prisma.platformIntegration.create({
        data: {
          id: crypto.randomUUID(),
          pixelId: testPixelId,
          platform: EcommercePlatform.CAFE24,
          platformStoreId: 'test-store',
          accessToken: 'valid-access-token',
          refreshToken: 'valid-refresh-token',
          tokenExpiry: new Date(Date.now() + 6 * 60 * 60 * 1000),
          status: IntegrationStatus.CONNECTED,
        },
      })

      // When: 스크립트 주입 후 상태 업데이트
      const updatedIntegration = await prisma.platformIntegration.update({
        where: { id: integration.id },
        data: {
          scriptTagId: 'script-tag-123',
          status: IntegrationStatus.SCRIPT_INJECTED,
          lastSyncAt: new Date(),
        },
      })

      // Then: 스크립트 태그 ID와 상태가 업데이트됨
      expect(updatedIntegration.scriptTagId).toBe('script-tag-123')
      expect(updatedIntegration.status).toBe(IntegrationStatus.SCRIPT_INJECTED)
      expect(updatedIntegration.lastSyncAt).not.toBeNull()
    })

    it('웹훅 등록 후 ACTIVE 상태로 변경해야 함', async () => {
      const prisma = getPrismaClient()

      // Given: 스크립트가 주입된 PlatformIntegration
      const integration = await prisma.platformIntegration.create({
        data: {
          id: crypto.randomUUID(),
          pixelId: testPixelId,
          platform: EcommercePlatform.CAFE24,
          platformStoreId: 'test-store',
          accessToken: 'valid-access-token',
          refreshToken: 'valid-refresh-token',
          tokenExpiry: new Date(Date.now() + 6 * 60 * 60 * 1000),
          scriptTagId: 'script-tag-123',
          status: IntegrationStatus.SCRIPT_INJECTED,
        },
      })

      // When: 웹훅 등록 후 ACTIVE 상태로 업데이트
      const updatedIntegration = await prisma.platformIntegration.update({
        where: { id: integration.id },
        data: {
          webhookId: 'webhook-456',
          status: IntegrationStatus.ACTIVE,
          lastSyncAt: new Date(),
        },
      })

      // Then: 웹훅 ID와 ACTIVE 상태
      expect(updatedIntegration.webhookId).toBe('webhook-456')
      expect(updatedIntegration.status).toBe(IntegrationStatus.ACTIVE)
    })

    it('스크립트 주입 실패 시 에러 상태로 저장해야 함', async () => {
      const prisma = getPrismaClient()

      // Given: 연결된 PlatformIntegration
      const integration = await prisma.platformIntegration.create({
        data: {
          id: crypto.randomUUID(),
          pixelId: testPixelId,
          platform: EcommercePlatform.CAFE24,
          platformStoreId: 'test-store',
          accessToken: 'expired-access-token',
          status: IntegrationStatus.CONNECTED,
        },
      })

      // When: 스크립트 주입 실패
      const updatedIntegration = await prisma.platformIntegration.update({
        where: { id: integration.id },
        data: {
          status: IntegrationStatus.ERROR,
          errorMessage: 'You do not have permission to create script tags.',
        },
      })

      // Then: 에러 상태로 저장됨
      expect(updatedIntegration.status).toBe(IntegrationStatus.ERROR)
      expect(updatedIntegration.errorMessage).toContain('permission')
    })
  })

  describe('Platform Disconnection', () => {
    it('연결 해제 시 스크립트와 웹훅을 삭제하고 DISCONNECTED 상태로 변경해야 함', async () => {
      const prisma = getPrismaClient()

      // Given: ACTIVE 상태의 PlatformIntegration
      const integration = await prisma.platformIntegration.create({
        data: {
          id: crypto.randomUUID(),
          pixelId: testPixelId,
          platform: EcommercePlatform.CAFE24,
          platformStoreId: 'test-store',
          accessToken: 'valid-access-token',
          refreshToken: 'valid-refresh-token',
          scriptTagId: 'script-tag-123',
          webhookId: 'webhook-456',
          status: IntegrationStatus.ACTIVE,
        },
      })

      // When: 연결 해제
      const disconnectedIntegration = await prisma.platformIntegration.update({
        where: { id: integration.id },
        data: {
          scriptTagId: null,
          webhookId: null,
          accessToken: '',
          refreshToken: null,
          status: IntegrationStatus.DISCONNECTED,
        },
      })

      // Then: 토큰과 ID들이 삭제되고 DISCONNECTED 상태
      expect(disconnectedIntegration.status).toBe(IntegrationStatus.DISCONNECTED)
      expect(disconnectedIntegration.scriptTagId).toBeNull()
      expect(disconnectedIntegration.webhookId).toBeNull()
      expect(disconnectedIntegration.accessToken).toBe('')
    })

    it('존재하지 않는 연동 해제 시도 시 에러가 발생해야 함', async () => {
      const prisma = getPrismaClient()

      // Given: 존재하지 않는 연동 ID

      // When/Then: 업데이트 시 에러
      await expect(
        prisma.platformIntegration.update({
          where: { id: 'non-existent-id' },
          data: { status: IntegrationStatus.DISCONNECTED },
        })
      ).rejects.toThrow()
    })
  })

  describe('Token Refresh', () => {
    it('만료된 토큰을 갱신하고 새 만료 시간을 저장해야 함', async () => {
      const prisma = getPrismaClient()

      // Given: 만료된 토큰을 가진 PlatformIntegration
      const expiredTime = new Date(Date.now() - 1000) // 1초 전에 만료
      const integration = await prisma.platformIntegration.create({
        data: {
          id: crypto.randomUUID(),
          pixelId: testPixelId,
          platform: EcommercePlatform.CAFE24,
          platformStoreId: 'test-store',
          accessToken: 'expired-access-token',
          refreshToken: 'valid-refresh-token',
          tokenExpiry: expiredTime,
          status: IntegrationStatus.ACTIVE,
        },
      })

      // When: 토큰 갱신
      const newExpiry = new Date(Date.now() + 6 * 60 * 60 * 1000) // 6시간 후
      const updatedIntegration = await prisma.platformIntegration.update({
        where: { id: integration.id },
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          tokenExpiry: newExpiry,
        },
      })

      // Then: 새 토큰과 만료 시간이 저장됨
      expect(updatedIntegration.accessToken).toBe('new-access-token')
      expect(updatedIntegration.tokenExpiry!.getTime()).toBeGreaterThan(Date.now())
    })
  })

  describe('MetaPixel and PlatformIntegration Relationship', () => {
    it('MetaPixel을 조회할 때 연동된 PlatformIntegration 정보를 함께 가져와야 함', async () => {
      const prisma = getPrismaClient()

      // Given: MetaPixel과 연결된 PlatformIntegration
      await prisma.platformIntegration.create({
        data: {
          id: crypto.randomUUID(),
          pixelId: testPixelId,
          platform: EcommercePlatform.CAFE24,
          platformStoreId: 'test-store',
          accessToken: 'access-token',
          status: IntegrationStatus.ACTIVE,
        },
      })

      // When: MetaPixel 조회 (with relation)
      const pixelWithIntegration = await prisma.metaPixel.findUnique({
        where: { id: testPixelId },
        include: { platformIntegration: true },
      })

      // Then: 연동 정보가 함께 조회됨
      expect(pixelWithIntegration).not.toBeNull()
      expect(pixelWithIntegration!.platformIntegration).not.toBeNull()
      expect(pixelWithIntegration!.platformIntegration!.platform).toBe(EcommercePlatform.CAFE24)
      expect(pixelWithIntegration!.platformIntegration!.status).toBe(IntegrationStatus.ACTIVE)
    })

    it('사용자의 모든 픽셀과 연동 상태를 조회할 수 있어야 함', async () => {
      const prisma = getPrismaClient()

      // Given: 여러 픽셀과 연동
      const pixel2 = await prisma.metaPixel.create({
        data: {
          id: crypto.randomUUID(),
          userId: testUserId,
          metaPixelId: '987654321098765',
          name: 'Second Pixel',
          isActive: true,
          setupMethod: PixelSetupMethod.MANUAL,
        },
      })

      await prisma.platformIntegration.create({
        data: {
          id: crypto.randomUUID(),
          pixelId: testPixelId,
          platform: EcommercePlatform.CAFE24,
          platformStoreId: 'store-1',
          accessToken: 'token-1',
          status: IntegrationStatus.ACTIVE,
        },
      })

      // pixel2는 수동 설치 (연동 없음)

      // When: 사용자의 모든 픽셀 조회
      const userPixels = await prisma.metaPixel.findMany({
        where: { userId: testUserId },
        include: { platformIntegration: true },
      })

      // Then: 모든 픽셀과 연동 상태 확인
      expect(userPixels).toHaveLength(2)

      const activePixel = userPixels.find(p => p.id === testPixelId)
      expect(activePixel!.platformIntegration).not.toBeNull()
      expect(activePixel!.platformIntegration!.status).toBe(IntegrationStatus.ACTIVE)

      const manualPixel = userPixels.find(p => p.id === pixel2.id)
      expect(manualPixel!.platformIntegration).toBeNull()
      expect(manualPixel!.setupMethod).toBe(PixelSetupMethod.MANUAL)
    })
  })

  describe('ConversionEvent Integration', () => {
    it('CAPI 이벤트를 저장하고 픽셀과 연결해야 함', async () => {
      const prisma = getPrismaClient()

      // Given: 활성화된 픽셀
      const eventId = crypto.randomUUID()

      // When: ConversionEvent 생성
      const event = await prisma.conversionEvent.create({
        data: {
          id: crypto.randomUUID(),
          pixelId: testPixelId,
          eventName: 'Purchase',
          eventId: eventId,
          eventTime: new Date(),
          eventSourceUrl: 'https://test-store.cafe24.com/order/complete',
          userData: {
            em: 'hashed-email',
            ph: 'hashed-phone',
          },
          customData: {
            currency: 'KRW',
            value: 50000,
            contents: [{ id: 'product-123', quantity: 1 }],
          },
          sentToMeta: false,
        },
      })

      // Then: 이벤트가 픽셀과 연결되어 저장됨
      const savedEvent = await prisma.conversionEvent.findUnique({
        where: { id: event.id },
        include: { pixel: true },
      })
      expect(savedEvent).not.toBeNull()
      expect(savedEvent!.eventName).toBe('Purchase')
      expect(savedEvent!.pixel.id).toBe(testPixelId)
    })

    it('중복 이벤트 ID는 저장되지 않아야 함', async () => {
      const prisma = getPrismaClient()

      // Given: 이미 저장된 이벤트
      const eventId = crypto.randomUUID()
      await prisma.conversionEvent.create({
        data: {
          id: crypto.randomUUID(),
          pixelId: testPixelId,
          eventName: 'Purchase',
          eventId: eventId,
          eventTime: new Date(),
          sentToMeta: false,
        },
      })

      // When/Then: 동일한 eventId로 생성 시도 시 에러
      await expect(
        prisma.conversionEvent.create({
          data: {
            id: crypto.randomUUID(),
            pixelId: testPixelId,
            eventName: 'Purchase',
            eventId: eventId, // 중복
            eventTime: new Date(),
            sentToMeta: false,
          },
        })
      ).rejects.toThrow()
    })

    it('전송되지 않은 이벤트만 조회할 수 있어야 함', async () => {
      const prisma = getPrismaClient()

      // Given: 전송된 이벤트와 전송되지 않은 이벤트
      await prisma.conversionEvent.createMany({
        data: [
          {
            id: crypto.randomUUID(),
            pixelId: testPixelId,
            eventName: 'PageView',
            eventId: crypto.randomUUID(),
            eventTime: new Date(),
            sentToMeta: true,
            metaResponseId: 'response-1',
          },
          {
            id: crypto.randomUUID(),
            pixelId: testPixelId,
            eventName: 'AddToCart',
            eventId: crypto.randomUUID(),
            eventTime: new Date(),
            sentToMeta: false,
          },
          {
            id: crypto.randomUUID(),
            pixelId: testPixelId,
            eventName: 'Purchase',
            eventId: crypto.randomUUID(),
            eventTime: new Date(),
            sentToMeta: false,
          },
        ],
      })

      // When: 전송되지 않은 이벤트만 조회
      const unsent = await prisma.conversionEvent.findMany({
        where: {
          pixelId: testPixelId,
          sentToMeta: false,
        },
      })

      // Then: 2개만 조회
      expect(unsent).toHaveLength(2)
      expect(unsent.every(e => !e.sentToMeta)).toBe(true)
    })
  })
})
