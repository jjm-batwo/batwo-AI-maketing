/**
 * 쿼터 제한 설정 (MVP)
 */
export const QUOTA_LIMITS = {
  CAMPAIGN_CREATE: { count: 5, period: 'week' as const },
  AI_COPY_GEN: { count: 20, period: 'day' as const },
  AI_ANALYSIS: { count: 3, period: 'week' as const },
  REPORT_DOWNLOAD: { count: -1, period: 'month' as const }, // -1 = 무제한
} as const;

export type QuotaType = keyof typeof QUOTA_LIMITS;
export type QuotaPeriod = 'day' | 'week' | 'month';

/**
 * Meta Ads 캠페인 목표
 */
export const CAMPAIGN_OBJECTIVES = {
  AWARENESS: {
    value: 'OUTCOME_AWARENESS',
    label: '브랜드 인지도',
    description: '브랜드를 더 많은 사람들에게 알립니다',
  },
  TRAFFIC: {
    value: 'OUTCOME_TRAFFIC',
    label: '트래픽',
    description: '웹사이트나 앱으로 방문자를 유도합니다',
  },
  CONVERSIONS: {
    value: 'OUTCOME_SALES',
    label: '전환',
    description: '구매, 회원가입 등 특정 행동을 유도합니다',
  },
} as const;

/**
 * 사용자 역할
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
