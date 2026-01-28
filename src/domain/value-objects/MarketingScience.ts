/**
 * Marketing Science Value Objects
 *
 * SINGLE SOURCE OF TRUTH for:
 * - KnowledgeDomain enum
 * - CompositeScore, DomainScore, ScoringFactor, Citation value objects
 * - Grade boundaries and grade calculation
 * - Industry-specific benchmarks
 * - Scoring formula utilities
 */

export type KnowledgeDomain =
  | 'neuromarketing'
  | 'marketing_psychology'
  | 'crowd_psychology'
  | 'meta_best_practices'
  | 'color_psychology'
  | 'copywriting_psychology'

export const ALL_KNOWLEDGE_DOMAINS: readonly KnowledgeDomain[] = [
  'neuromarketing',
  'marketing_psychology',
  'crowd_psychology',
  'meta_best_practices',
  'color_psychology',
  'copywriting_psychology',
] as const

// --- Grade Boundaries (SINGLE SOURCE OF TRUTH) ---
export type ScienceGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'

export const GRADE_BOUNDARIES: readonly { min: number; grade: ScienceGrade }[] = [
  { min: 90, grade: 'A+' },
  { min: 80, grade: 'A' },
  { min: 70, grade: 'B+' },
  { min: 60, grade: 'B' },
  { min: 50, grade: 'C+' },
  { min: 40, grade: 'C' },
  { min: 30, grade: 'D' },
  { min: 0, grade: 'F' },
] as const

export function getGrade(score: number): ScienceGrade {
  for (const { min, grade } of GRADE_BOUNDARIES) {
    if (score >= min) return grade
  }
  return 'F'
}

// --- Value Objects ---
export interface Citation {
  id: string
  domain: KnowledgeDomain
  source: string
  finding: string
  applicability: string
  confidenceLevel: 'high' | 'medium' | 'low'
  year?: number
  category: string
}

export interface ScoringFactor {
  name: string
  score: number
  weight: number
  explanation: string
  citation?: Citation
}

export interface DomainScore {
  domain: KnowledgeDomain
  score: number
  maxScore: 100
  grade: ScienceGrade
  factors: ScoringFactor[]
  citations: Citation[]
  recommendations: DomainRecommendation[]
}

export interface DomainRecommendation {
  domain: KnowledgeDomain
  priority: 'critical' | 'high' | 'medium' | 'low'
  recommendation: string
  scientificBasis: string
  expectedImpact: string
  citations: Citation[]
}

export interface CompositeScore {
  overall: number
  grade: ScienceGrade
  domainScores: DomainScore[]
  analyzedDomains: KnowledgeDomain[]
  failedDomains: KnowledgeDomain[]
  topRecommendations: DomainRecommendation[]
  totalCitations: Citation[]
  summary: string
}

// --- Default Domain Weights ---
export const DEFAULT_DOMAIN_WEIGHTS: Record<KnowledgeDomain, number> = {
  neuromarketing: 0.20,
  marketing_psychology: 0.20,
  crowd_psychology: 0.15,
  meta_best_practices: 0.20,
  color_psychology: 0.10,
  copywriting_psychology: 0.15,
}

// --- Pure Scoring Utilities ---
export function calculateWeightedAverage(
  domainScores: DomainScore[],
  weights: Record<KnowledgeDomain, number> = DEFAULT_DOMAIN_WEIGHTS
): number {
  let totalWeight = 0
  let weightedSum = 0
  for (const ds of domainScores) {
    const w = weights[ds.domain] ?? 0
    weightedSum += ds.score * w
    totalWeight += w
  }
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
}

export function rankRecommendations(
  recommendations: DomainRecommendation[]
): DomainRecommendation[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  return [...recommendations].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  )
}

export function buildCompositeScore(
  domainScores: DomainScore[],
  failedDomains: KnowledgeDomain[],
  weights?: Record<KnowledgeDomain, number>
): CompositeScore {
  const overall = calculateWeightedAverage(domainScores, weights)
  const allRecs = domainScores.flatMap(ds => ds.recommendations)
  const allCitations = domainScores.flatMap(ds => ds.citations)
  return {
    overall,
    grade: getGrade(overall),
    domainScores,
    analyzedDomains: domainScores.map(ds => ds.domain),
    failedDomains,
    topRecommendations: rankRecommendations(allRecs).slice(0, 5),
    totalCitations: allCitations,
    summary: '',
  }
}

// --- Industry Benchmarks ---
export const INDUSTRY_BENCHMARKS: Record<string, { avgCTR: number; avgCVR: number; avgROAS: number }> = {
  ecommerce: { avgCTR: 1.2, avgCVR: 2.5, avgROAS: 3.0 },
  food_beverage: { avgCTR: 1.5, avgCVR: 3.0, avgROAS: 2.5 },
  beauty: { avgCTR: 1.8, avgCVR: 3.5, avgROAS: 4.0 },
  fashion: { avgCTR: 1.4, avgCVR: 2.8, avgROAS: 3.5 },
  education: { avgCTR: 0.9, avgCVR: 1.5, avgROAS: 2.0 },
  service: { avgCTR: 1.0, avgCVR: 2.0, avgROAS: 2.5 },
  saas: { avgCTR: 0.8, avgCVR: 1.2, avgROAS: 3.0 },
  health: { avgCTR: 1.3, avgCVR: 2.2, avgROAS: 2.8 },
}

export const MIN_REQUIRED_DOMAINS = 3
