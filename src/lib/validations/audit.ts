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

/**
 * 감사 결과 리포트 공통 스키마
 *
 * PDF 생성 및 공유 API에서 공통으로 사용.
 * 문자열/배열 크기 제한으로 페이로드 폭탄(Payload Bomb) 공격 방지.
 */
export const auditReportSchema = z.object({
  overall: z.number().min(0).max(100),
  /** 등급: A/B/C/D/F (최대 2자) */
  grade: z.string().min(1).max(2),
  /** 카테고리 최대 20개 */
  categories: z
    .array(
      z.object({
        name: z.string().max(100),
        score: z.number(),
        /** 발견 항목 최대 50개 */
        findings: z
          .array(
            z.object({
              type: z.string().max(100),
              message: z.string().max(500),
            })
          )
          .max(50),
        /** 권고 사항 최대 30개 */
        recommendations: z
          .array(
            z.object({
              priority: z.string().max(20),
              message: z.string().max(500),
              estimatedImpact: z.string().max(200),
            })
          )
          .max(30),
      })
    )
    .max(20),
  estimatedWaste: z.object({
    amount: z.number(),
    currency: z.string().max(10),
  }),
  estimatedImprovement: z.object({
    amount: z.number(),
    currency: z.string().max(10),
  }),
  totalCampaigns: z.number().max(100_000),
  activeCampaigns: z.number().max(100_000),
  analyzedAt: z.string().max(50),
})

export type AuditReportInput = z.infer<typeof auditReportSchema>
