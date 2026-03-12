/**
 * Meta 광고 계정 중앙 조회 헬퍼
 *
 * 모든 API 라우트가 Meta 계정 정보를 가져올 때 이 함수를 사용합니다.
 * - userId 기반 계정 조회 (Prisma findUnique)
 * - 토큰 복호화 (safeDecryptToken)
 * - 토큰 만료 검사 (isTokenExpired)
 *
 * 산재된 prisma.metaAdAccount.findFirst 호출을 통합하여
 * 일관된 에러 처리와 검증을 보장합니다.
 */
import { prisma } from '@/lib/prisma'
import { safeDecryptToken } from '@application/utils/TokenEncryption'
import { isTokenExpired } from '@application/utils/metaTokenUtils'

export interface MetaAccountInfo {
  /** Prisma 레코드 ID */
  id: string
  /** Meta 광고 계정 ID (act_xxx) */
  metaAccountId: string
  /** 복호화된 액세스 토큰 (즉시 Meta API 호출 가능) */
  accessToken: string
  /** 토큰 만료 시각 */
  tokenExpiry: Date | null
  /** 비즈니스 이름 */
  businessName: string | null
}

/**
 * 사용자의 Meta 광고 계정 정보를 조회합니다.
 *
 * @param userId - 사용자 ID
 * @returns 복호화된 토큰이 포함된 계정 정보, 또는 null
 *
 * null을 반환하는 경우:
 * - 계정이 연결되지 않음
 * - 토큰이 만료됨
 * - 토큰 복호화 실패
 */
export async function getMetaAccountForUser(userId: string): Promise<MetaAccountInfo | null> {
  try {
    const account = await prisma.metaAdAccount.findUnique({
      where: { userId },
      select: {
        id: true,
        metaAccountId: true,
        accessToken: true,
        tokenExpiry: true,
        businessName: true,
      },
    })

    if (!account) {
      return null
    }

    // 토큰 만료 검사
    if (isTokenExpired(account.tokenExpiry)) {
      console.warn(`[MetaAccount] Token expired for user ${userId.substring(0, 8)}...`)
      return null
    }

    // 토큰 복호화
    const decryptedToken = safeDecryptToken(account.accessToken)
    if (!decryptedToken) {
      console.error(`[MetaAccount] Token decryption failed for user ${userId.substring(0, 8)}...`)
      return null
    }

    return {
      id: account.id,
      metaAccountId: account.metaAccountId,
      accessToken: decryptedToken,
      tokenExpiry: account.tokenExpiry,
      businessName: account.businessName,
    }
  } catch (error) {
    console.error(`[MetaAccount] Failed to fetch account for user ${userId.substring(0, 8)}...`, error)
    return null
  }
}

/**
 * Meta 계정 연결 상태만 확인합니다 (토큰 복호화 없이).
 * connection 상태 확인용 경량 버전.
 */
export async function isMetaConnected(userId: string): Promise<{
  isConnected: boolean
  hasAccount: boolean
  isExpired: boolean
}> {
  try {
    const account = await prisma.metaAdAccount.findUnique({
      where: { userId },
      select: { id: true, tokenExpiry: true },
    })

    const hasAccount = !!account
    const isExpired = account?.tokenExpiry ? isTokenExpired(account.tokenExpiry) : false

    return {
      isConnected: hasAccount && !isExpired,
      hasAccount,
      isExpired,
    }
  } catch {
    return { isConnected: false, hasAccount: false, isExpired: false }
  }
}
