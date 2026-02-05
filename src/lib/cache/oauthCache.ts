/**
 * OAuth 임시 데이터 캐시 모듈
 *
 * Meta OAuth 콜백에서 계정 선택 페이지로 민감한 정보(accessToken)를 안전하게 전달하기 위한 캐시.
 * 데이터베이스 기반으로 모든 환경에서 안정적으로 작동.
 * 짧은 TTL(10분)로 보안을 강화하고, 사용 후 자동 삭제.
 */

import { prisma } from '@/lib/prisma'

interface OAuthData {
  accessToken: string
  tokenExpiry: number
  accounts: Array<{
    id: string
    name: string
    account_status: number
    currency: string
  }>
  userId: string
  createdAt: number
}

const TTL_SECONDS = 600 // 10분

class OAuthCache {
  private readonly TTL_SECONDS = TTL_SECONDS

  /**
   * OAuth 데이터 저장 (세션 ID 생성)
   */
  async set(userId: string, data: Omit<OAuthData, 'userId' | 'createdAt'>): Promise<string> {
    // 임시 세션 ID 생성 (랜덤 + 타임스탬프)
    const sessionId = `oauth_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

    const expiresAt = new Date(Date.now() + this.TTL_SECONDS * 1000)

    try {
      await prisma.oAuthSession.create({
        data: {
          id: sessionId,
          userId,
          accessToken: data.accessToken,
          tokenExpiry: data.tokenExpiry,
          accounts: data.accounts,
          expiresAt,
        },
      })

      // 디버그 로그 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        console.log('[OAUTH CACHE] Session created (DB):', {
          sessionId: sessionId.substring(0, 30) + '...',
          userId: userId.substring(0, 10) + '...',
          accountCount: data.accounts.length,
          expiresAt: expiresAt.toISOString(),
        })
      }
    } catch (err) {
      console.error('[OAUTH CACHE] Failed to create session:', err)
      throw err
    }

    return sessionId
  }

  /**
   * OAuth 데이터 조회 및 검증
   */
  async get(sessionId: string, userId: string): Promise<OAuthData | null> {
    try {
      const session = await prisma.oAuthSession.findUnique({
        where: { id: sessionId },
      })

      // 디버그 로그 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        console.log('[OAUTH CACHE] Session lookup (DB):', {
          sessionId: sessionId.substring(0, 30) + '...',
          found: !!session,
          expired: session ? new Date() > session.expiresAt : null,
        })
      }

      if (!session) {
        return null
      }

      // 사용자 ID 검증 (보안)
      if (session.userId !== userId) {
        console.warn('[OAUTH CACHE] User ID mismatch')
        return null
      }

      // TTL 검증
      if (new Date() > session.expiresAt) {
        console.log('[OAUTH CACHE] Session expired')
        await this.delete(sessionId)
        return null
      }

      return {
        accessToken: session.accessToken,
        tokenExpiry: session.tokenExpiry,
        accounts: session.accounts as OAuthData['accounts'],
        userId: session.userId,
        createdAt: session.createdAt.getTime(),
      }
    } catch (err) {
      console.error('[OAUTH CACHE] Failed to get session:', err)
      return null
    }
  }

  /**
   * OAuth 데이터 삭제 (사용 후)
   */
  async delete(sessionId: string): Promise<void> {
    try {
      await prisma.oAuthSession.delete({
        where: { id: sessionId },
      }).catch(() => {
        // 이미 삭제된 경우 무시
      })
    } catch (err) {
      console.error('[OAUTH CACHE] Failed to delete session:', err)
    }
  }

  /**
   * 전체 캐시 삭제 (테스트용)
   */
  async clearAll(): Promise<void> {
    try {
      await prisma.oAuthSession.deleteMany({})
    } catch (err) {
      console.error('[OAUTH CACHE] Failed to clear all sessions:', err)
    }
  }

  /**
   * 만료된 항목 정리
   */
  async cleanup(): Promise<void> {
    try {
      const result = await prisma.oAuthSession.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      })

      if (result.count > 0 && process.env.NODE_ENV === 'development') {
        console.log('[OAUTH CACHE] Cleaned up expired sessions:', result.count)
      }
    } catch (err) {
      console.error('[OAUTH CACHE] Cleanup failed:', err)
    }
  }

  /**
   * 캐시 통계
   */
  async getStats(): Promise<{ total: number; valid: number; expired: number }> {
    try {
      const now = new Date()
      const [total, expired] = await Promise.all([
        prisma.oAuthSession.count(),
        prisma.oAuthSession.count({
          where: { expiresAt: { lt: now } },
        }),
      ])

      return {
        total,
        valid: total - expired,
        expired,
      }
    } catch {
      return { total: 0, valid: 0, expired: 0 }
    }
  }
}

// Singleton 인스턴스
export const oauthCache = new OAuthCache()

// 주기적인 정리 작업 (5분마다) - 서버 사이드에서만
if (typeof window === 'undefined') {
  setInterval(() => {
    oauthCache.cleanup()
  }, 5 * 60 * 1000)
}
