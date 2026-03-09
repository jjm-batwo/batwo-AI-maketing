import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    GetTrackingHealthUseCase,
} from '@application/use-cases/pixel/GetTrackingHealthUseCase'
import { MockMetaPixelRepository } from '@tests/mocks/repositories/MockMetaPixelRepository'
import { MetaPixel, PixelSetupMethod } from '@domain/entities/MetaPixel'
import type { IMetaPixelService, MetaPixelStats } from '@application/ports/IMetaPixelService'
import type { TrackingHealthDTO } from '@application/dto/pixel/TrackingHealthDTO'
import type { TrackingHealthSuggestion } from '@application/dto/pixel/TrackingHealthDTO'
import { MATCH_RATE_THRESHOLDS } from '@application/dto/pixel/TrackingHealthDTO'

// ── Mock: IMetaPixelService ──
class MockMetaPixelService implements Partial<IMetaPixelService> {
    private statsMap = new Map<string, MetaPixelStats | null>()

    async getPixelStats(_accessToken: string, pixelId: string): Promise<MetaPixelStats | null> {
        return this.statsMap.get(pixelId) ?? null
    }

    // ── helpers ──
    setStats(pixelId: string, stats: MetaPixelStats | null): void {
        this.statsMap.set(pixelId, stats)
    }

    // stub the rest
    async listPixels() { return [] }
    async getAdAccountPixel() { return null }
    async createPixel() { return { id: '', name: '', isActive: true, creationTime: '' } }
    async getPixel() { return null }
}

// ── Mock: CAPI stats provider ──
interface CAPIStatsResult {
    sent: number
    failed: number
    expired: number
}

class MockCAPIStatsProvider {
    private statsMap = new Map<string, CAPIStatsResult>()

    async getCAPIStatsByPixelId(pixelId: string): Promise<CAPIStatsResult> {
        return this.statsMap.get(pixelId) ?? { sent: 0, failed: 0, expired: 0 }
    }

    setStats(pixelId: string, stats: CAPIStatsResult): void {
        this.statsMap.set(pixelId, stats)
    }
}

// ── Mock: AccessToken Provider ──
class MockAccessTokenProvider {
    private tokens = new Map<string, string>()

    async getAccessTokenByUserId(userId: string): Promise<string | null> {
        return this.tokens.get(userId) ?? null
    }

    setToken(userId: string, token: string): void {
        this.tokens.set(userId, token)
    }
}

describe('GetTrackingHealthUseCase', () => {
    let useCase: GetTrackingHealthUseCase
    let pixelRepository: MockMetaPixelRepository
    let metaPixelService: MockMetaPixelService
    let capiStatsProvider: MockCAPIStatsProvider
    let accessTokenProvider: MockAccessTokenProvider

    const TEST_USER_ID = 'user-123'
    const TEST_ACCESS_TOKEN = 'mock-access-token'
    const TEST_META_PIXEL_ID = '123456789012345'

    let testPixel: MetaPixel

    beforeEach(() => {
        pixelRepository = new MockMetaPixelRepository()
        metaPixelService = new MockMetaPixelService()
        capiStatsProvider = new MockCAPIStatsProvider()
        accessTokenProvider = new MockAccessTokenProvider()

        useCase = new GetTrackingHealthUseCase(
            pixelRepository,
            metaPixelService as unknown as IMetaPixelService,
            capiStatsProvider,
            accessTokenProvider,
        )

        // 기본 테스트 데이터
        testPixel = MetaPixel.create({
            userId: TEST_USER_ID,
            metaPixelId: TEST_META_PIXEL_ID,
            name: 'Test Pixel',
            setupMethod: PixelSetupMethod.MANUAL,
        })

        accessTokenProvider.setToken(TEST_USER_ID, TEST_ACCESS_TOKEN)
    })

    // ──────────────────────────────────────────
    // 에러 케이스
    // ──────────────────────────────────────────
    describe('error cases', () => {
        it('should throw error for non-existent pixel', async () => {
            await expect(
                useCase.execute({ userId: TEST_USER_ID, pixelId: 'non-existent' })
            ).rejects.toThrow()
        })

        it('should throw error if pixel belongs to different user', async () => {
            const otherPixel = MetaPixel.create({
                userId: 'other-user',
                metaPixelId: '999999999999999',
                name: 'Other User Pixel',
            })
            await pixelRepository.save(otherPixel)

            await expect(
                useCase.execute({ userId: TEST_USER_ID, pixelId: otherPixel.id })
            ).rejects.toThrow()
        })

        it('should throw error if no access token found', async () => {
            await pixelRepository.save(testPixel)
            accessTokenProvider.setToken(TEST_USER_ID, '') // 빈 토큰

            // accessToken이 없으면 'unknown' 상태 or 에러
            const result = await useCase.execute({
                userId: TEST_USER_ID,
                pixelId: testPixel.id,
            })

            expect(result.healthStatus).toBe('unknown')
        })
    })

    // ──────────────────────────────────────────
    // healthStatus 판정 로직
    // ──────────────────────────────────────────
    describe('healthStatus determination', () => {
        beforeEach(async () => {
            await pixelRepository.save(testPixel)
        })

        it('should return "healthy" when matchRate >= 0.6', async () => {
            metaPixelService.setStats(TEST_META_PIXEL_ID, {
                matchRate: 0.85,
                matchedEventCount: 8500,
                unmatchedEventCount: 1500,
            })

            const result = await useCase.execute({
                userId: TEST_USER_ID,
                pixelId: testPixel.id,
            })

            expect(result.healthStatus).toBe('healthy')
            expect(result.matchRate).toBe(0.85)
            expect(result.matchedEventCount).toBe(8500)
            expect(result.unmatchedEventCount).toBe(1500)
        })

        it('should return "warning" when 0.4 <= matchRate < 0.6', async () => {
            metaPixelService.setStats(TEST_META_PIXEL_ID, {
                matchRate: 0.5,
                matchedEventCount: 5000,
                unmatchedEventCount: 5000,
            })

            const result = await useCase.execute({
                userId: TEST_USER_ID,
                pixelId: testPixel.id,
            })

            expect(result.healthStatus).toBe('warning')
            expect(result.matchRate).toBe(0.5)
        })

        it('should return "critical" when matchRate < 0.4', async () => {
            metaPixelService.setStats(TEST_META_PIXEL_ID, {
                matchRate: 0.2,
                matchedEventCount: 2000,
                unmatchedEventCount: 8000,
            })

            const result = await useCase.execute({
                userId: TEST_USER_ID,
                pixelId: testPixel.id,
            })

            expect(result.healthStatus).toBe('critical')
            expect(result.matchRate).toBe(0.2)
        })

        it('should return "unknown" when stats are null', async () => {
            metaPixelService.setStats(TEST_META_PIXEL_ID, null)

            const result = await useCase.execute({
                userId: TEST_USER_ID,
                pixelId: testPixel.id,
            })

            expect(result.healthStatus).toBe('unknown')
            expect(result.matchRate).toBeNull()
            expect(result.matchedEventCount).toBe(0)
            expect(result.unmatchedEventCount).toBe(0)
        })

        it('should return "healthy" at exact boundary (matchRate = 0.6)', async () => {
            metaPixelService.setStats(TEST_META_PIXEL_ID, {
                matchRate: MATCH_RATE_THRESHOLDS.HEALTHY,
                matchedEventCount: 6000,
                unmatchedEventCount: 4000,
            })

            const result = await useCase.execute({
                userId: TEST_USER_ID,
                pixelId: testPixel.id,
            })

            expect(result.healthStatus).toBe('healthy')
        })

        it('should return "warning" at exact boundary (matchRate = 0.4)', async () => {
            metaPixelService.setStats(TEST_META_PIXEL_ID, {
                matchRate: MATCH_RATE_THRESHOLDS.WARNING,
                matchedEventCount: 4000,
                unmatchedEventCount: 6000,
            })

            const result = await useCase.execute({
                userId: TEST_USER_ID,
                pixelId: testPixel.id,
            })

            expect(result.healthStatus).toBe('warning')
        })
    })

    // ──────────────────────────────────────────
    // CAPI 통계 포함
    // ──────────────────────────────────────────
    describe('CAPI statistics', () => {
        beforeEach(async () => {
            await pixelRepository.save(testPixel)
            metaPixelService.setStats(TEST_META_PIXEL_ID, {
                matchRate: 0.75,
                matchedEventCount: 7500,
                unmatchedEventCount: 2500,
            })
        })

        it('should include CAPI stats in result', async () => {
            capiStatsProvider.setStats(testPixel.id, {
                sent: 100,
                failed: 5,
                expired: 3,
            })

            const result = await useCase.execute({
                userId: TEST_USER_ID,
                pixelId: testPixel.id,
            })

            expect(result.capiEventsSent).toBe(100)
            expect(result.capiEventsFailed).toBe(5)
            expect(result.capiEventsExpired).toBe(3)
        })

        it('should return zero CAPI stats when no events exist', async () => {
            const result = await useCase.execute({
                userId: TEST_USER_ID,
                pixelId: testPixel.id,
            })

            expect(result.capiEventsSent).toBe(0)
            expect(result.capiEventsFailed).toBe(0)
            expect(result.capiEventsExpired).toBe(0)
        })
    })

    // ──────────────────────────────────────────
    // 개선 제안 (suggestions) 생성
    // ──────────────────────────────────────────
    describe('suggestions generation', () => {
        beforeEach(async () => {
            await pixelRepository.save(testPixel)
        })

        it('should generate no suggestions when healthy', async () => {
            metaPixelService.setStats(TEST_META_PIXEL_ID, {
                matchRate: 0.85,
                matchedEventCount: 8500,
                unmatchedEventCount: 1500,
            })

            const result = await useCase.execute({
                userId: TEST_USER_ID,
                pixelId: testPixel.id,
            })

            expect(result.suggestions).toHaveLength(0)
        })

        it('should generate warning suggestions when matchRate is in warning zone', async () => {
            metaPixelService.setStats(TEST_META_PIXEL_ID, {
                matchRate: 0.5,
                matchedEventCount: 5000,
                unmatchedEventCount: 5000,
            })

            const result = await useCase.execute({
                userId: TEST_USER_ID,
                pixelId: testPixel.id,
            })

            expect(result.suggestions.length).toBeGreaterThan(0)
            expect(result.suggestions.some((s: TrackingHealthSuggestion) => s.severity === 'warn')).toBe(true)
        })

        it('should generate error suggestions when matchRate is critical', async () => {
            metaPixelService.setStats(TEST_META_PIXEL_ID, {
                matchRate: 0.15,
                matchedEventCount: 1500,
                unmatchedEventCount: 8500,
            })

            const result = await useCase.execute({
                userId: TEST_USER_ID,
                pixelId: testPixel.id,
            })

            expect(result.suggestions.length).toBeGreaterThan(0)
            expect(result.suggestions.some((s: TrackingHealthSuggestion) => s.severity === 'error')).toBe(true)
        })

        it('should generate info suggestion when CAPI has failed events', async () => {
            metaPixelService.setStats(TEST_META_PIXEL_ID, {
                matchRate: 0.7,
                matchedEventCount: 7000,
                unmatchedEventCount: 3000,
            })
            capiStatsProvider.setStats(testPixel.id, {
                sent: 90,
                failed: 10,
                expired: 0,
            })

            const result = await useCase.execute({
                userId: TEST_USER_ID,
                pixelId: testPixel.id,
            })

            expect(result.suggestions.some((s: TrackingHealthSuggestion) => s.key === 'capi_failures')).toBe(true)
        })
    })

    // ──────────────────────────────────────────
    // DTO 구조 검증
    // ──────────────────────────────────────────
    describe('result DTO structure', () => {
        it('should return complete TrackingHealthDTO', async () => {
            await pixelRepository.save(testPixel)
            metaPixelService.setStats(TEST_META_PIXEL_ID, {
                matchRate: 0.75,
                matchedEventCount: 7500,
                unmatchedEventCount: 2500,
            })
            capiStatsProvider.setStats(testPixel.id, {
                sent: 50,
                failed: 2,
                expired: 1,
            })

            const result = await useCase.execute({
                userId: TEST_USER_ID,
                pixelId: testPixel.id,
            })

            // 모든 필드가 존재하는지 검증
            expect(result).toMatchObject({
                pixelId: testPixel.id,
                metaPixelId: TEST_META_PIXEL_ID,
                healthStatus: 'healthy',
                matchRate: 0.75,
                matchedEventCount: 7500,
                unmatchedEventCount: 2500,
                capiEventsSent: 50,
                capiEventsFailed: 2,
                capiEventsExpired: 1,
            })
            expect(result.suggestions).toBeInstanceOf(Array)
            expect(result.lastCheckedAt).toBeDefined()
            // ISO 형식인지 검증
            expect(() => new Date(result.lastCheckedAt)).not.toThrow()
        })
    })
})
