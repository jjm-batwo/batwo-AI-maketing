/**
 * 무료 감사 API Zod 검증 스키마
 */
import { z } from 'zod'

/**
 * POST /api/audit/analyze 요청 바디 스키마
 */
export const auditAnalyzeSchema = z.object({
  sessionId: z.string().uuid('유효한 세션 ID가 필요합니다'),
  adAccountId: z.string().min(1, '광고 계정 ID가 필요합니다'),
})

export type AuditAnalyzeInput = z.infer<typeof auditAnalyzeSchema>
