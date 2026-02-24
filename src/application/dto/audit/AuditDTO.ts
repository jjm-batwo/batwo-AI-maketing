/**
 * 광고 계정 감사 요청/응답 DTO
 */

export interface AuditRequestDTO {
  accessToken: string
  adAccountId: string
}

export interface AuditCategoryDTO {
  name: string
  score: number
  findings: { type: string; message: string }[]
  recommendations: { priority: string; message: string; estimatedImpact: string }[]
}

export interface AuditReportDTO {
  overall: number
  grade: string
  categories: AuditCategoryDTO[]
  estimatedWaste: { amount: number; currency: string }
  estimatedImprovement: { amount: number; currency: string }
  totalCampaigns: number
  activeCampaigns: number
  analyzedAt: string
}
