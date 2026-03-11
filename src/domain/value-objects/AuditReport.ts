export type AuditCategory = 'inefficient_campaigns' | 'target_overlap' | 'creative_fatigue' | 'bid_strategy' | 'budget_allocation';
export type AuditGrade = 'excellent' | 'good' | 'average' | 'poor' | 'critical';

export interface AuditCategoryResult {
  category: AuditCategory;
  score: number;          // 0-100
  grade: AuditGrade;
  wasteEstimate: number;  // KRW
  findings: string[];
  recommendations: string[];
}

export interface AuditReport {
  userId: string;
  overallScore: number;
  overallGrade: AuditGrade;
  totalWasteEstimate: number;
  categories: AuditCategoryResult[];
  analyzedCampaigns: number;
  analyzedPeriodDays: number;
  generatedAt: Date;
}

export function calculateOverallGrade(score: number): AuditGrade {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'average';
  if (score >= 30) return 'poor';
  return 'critical';
}
