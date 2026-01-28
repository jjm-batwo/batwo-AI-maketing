/**
 * OAuth 임시 데이터 캐시 모듈
 *
 * Meta OAuth 콜백에서 계정 선택 페이지로 민감한 정보(accessToken)를 안전하게 전달하기 위한 캐시.
 * 짧은 TTL(5분)로 보안을 강화하고, 사용 후 자동 삭제.
 */

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

class OAuthCache {
  private cache = new Map<string, OAuthData>()
  private readonly TTL_SECONDS = 300 // 5분

  /**
   * OAuth 데이터 저장 (세션 ID 생성)
   */
  set(userId: string, data: Omit<OAuthData, 'userId' | 'createdAt'>): string {
    // 임시 세션 ID 생성 (랜덤 + 타임스탬프)
    const sessionId = `oauth_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

    this.cache.set(sessionId, {
      ...data,
      userId,
      createdAt: Date.now(),
    })

    // 자동 정리: TTL 이후 삭제
    setTimeout(() => {
      this.cache.delete(sessionId)
    }, this.TTL_SECONDS * 1000)

    return sessionId
  }

  /**
   * OAuth 데이터 조회 및 검증
   */
  get(sessionId: string, userId: string): OAuthData | null {
    const data = this.cache.get(sessionId)

    if (!data) {
      return null
    }

    // 사용자 ID 검증 (보안)
    if (data.userId !== userId) {
      return null
    }

    // TTL 검증
    const now = Date.now()
    if (now - data.createdAt > this.TTL_SECONDS * 1000) {
      this.cache.delete(sessionId)
      return null
    }

    return data
  }

  /**
   * OAuth 데이터 삭제 (사용 후)
   */
  delete(sessionId: string): void {
    this.cache.delete(sessionId)
  }

  /**
   * 전체 캐시 삭제 (테스트용)
   */
  clearAll(): void {
    this.cache.clear()
  }

  /**
   * 만료된 항목 정리 (메모리 누수 방지)
   */
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.cache.forEach((data, key) => {
      if (now - data.createdAt > this.TTL_SECONDS * 1000) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach((key) => {
      this.cache.delete(key)
    })
  }

  /**
   * 캐시 통계
   */
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    this.cache.forEach((data) => {
      if (now - data.createdAt > this.TTL_SECONDS * 1000) {
        expiredEntries++
      } else {
        validEntries++
      }
    })

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
    }
  }
}

// Singleton 인스턴스
export const oauthCache = new OAuthCache()

// 주기적인 정리 작업 (1분마다)
if (typeof window === 'undefined') {
  setInterval(() => {
    oauthCache.cleanup()
  }, 60 * 1000)
}
