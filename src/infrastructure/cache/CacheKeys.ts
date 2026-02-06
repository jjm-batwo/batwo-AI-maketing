/**
 * Cache Keys and TTL Configuration
 *
 * Centralized cache key generation and TTL configuration
 * for consistent caching across the application.
 */

export const CacheKeys = {
  // KPI 관련 (TTL: 5분)
  kpiDashboard: (userId: string, date: string) => `kpi:dashboard:${userId}:${date}`,
  kpiSummary: (userId: string, dateRange: string) => `kpi:summary:${userId}:${dateRange}`,

  // AI 인사이트 (TTL: 10분)
  aiInsights: (userId: string) => `insights:${userId}`,

  // 캠페인 관련 (TTL: 1분)
  campaignList: (userId: string) => `campaigns:list:${userId}`,
  campaignDetail: (campaignId: string) => `campaigns:detail:${campaignId}`,

  // 할당량 관련 (TTL: 30초)
  quotaStatus: (userId: string) => `quota:status:${userId}`,

  // 팀 관련 (TTL: 5분)
  teamMembers: (teamId: string) => `team:members:${teamId}`,
  userPermissions: (userId: string, teamId: string) => `permissions:${userId}:${teamId}`,

  // 사용자별 캐시 무효화 패턴
  userPattern: (userId: string) => `*:${userId}*`,
} as const

export const CacheTTL = {
  KPI: 300, // 5분
  AI_INSIGHTS: 600, // 10분
  CAMPAIGN: 60, // 1분
  QUOTA: 30, // 30초
  TEAM: 300, // 5분
} as const
