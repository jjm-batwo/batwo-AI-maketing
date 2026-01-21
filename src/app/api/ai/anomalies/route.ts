import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import {
  getAnomalyDetectionService,
  getAnomalyRootCauseService,
  getAnomalySegmentAnalysisService,
} from '@/lib/di/container'
import type { Anomaly, EnhancedAnomaly } from '@application/services/AnomalyDetectionService'
import type { RootCauseAnalysis, AnalysisContext } from '@application/services/AnomalyRootCauseService'
import type {
  SegmentAnalysisResult,
  CampaignComparison,
  TimePatternAnalysis,
} from '@application/services/AnomalySegmentAnalysisService'

/**
 * 이상 징후 감지 API 응답 타입
 */
interface AnomalyResponse {
  anomalies: AnomalyWithAnalysis[]
  detectedAt: string
  count: number
  summary: {
    critical: number
    warning: number
    info: number
    byType: Record<string, number>
  }
  marketContext?: {
    isSpecialDay: boolean
    events: string[]
  }
  segmentAnalysis?: {
    segments: SegmentAnalysisResult
    campaignComparison: CampaignComparison[]
    timePatterns: TimePatternAnalysis
  }
}

/**
 * 원인 분석이 포함된 이상 징후 타입
 */
interface AnomalyWithAnalysis extends Anomaly {
  rootCauseAnalysis?: RootCauseAnalysis
}

/**
 * GET /api/ai/anomalies
 * 사용자의 캠페인에서 발생한 이상 현상 조회
 *
 * Query Parameters:
 * - industry: 업종 (ecommerce, food_beverage, beauty, fashion, education, service, saas)
 * - includeRootCause: 원인 분석 포함 여부 (default: true)
 * - includeSegmentAnalysis: 세그먼트 분석 포함 여부 (default: false)
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const searchParams = request.nextUrl.searchParams
    const industry = searchParams.get('industry') || undefined
    const includeRootCause = searchParams.get('includeRootCause') !== 'false'
    const includeSegmentAnalysis = searchParams.get('includeSegmentAnalysis') === 'true'

    const anomalyService = getAnomalyDetectionService()
    const rootCauseService = getAnomalyRootCauseService()
    const segmentAnalysisService = getAnomalySegmentAnalysisService()

    // 이상 징후 감지
    const anomalies = await anomalyService.detectAnomalies(user.id, industry)

    // 원인 분석 추가 (옵션)
    const anomaliesWithAnalysis: AnomalyWithAnalysis[] = anomalies.map((anomaly) => {
      if (!includeRootCause) {
        return anomaly
      }

      const context: AnalysisContext = {
        currentDate: new Date(),
        industry,
        historicalPattern: anomaly.detail.historicalTrend,
      }

      const rootCauseAnalysis = rootCauseService.analyzeRootCause(anomaly, context)

      return {
        ...anomaly,
        rootCauseAnalysis,
      }
    })

    // 타입별 집계
    const byType: Record<string, number> = {}
    for (const anomaly of anomalies) {
      byType[anomaly.type] = (byType[anomaly.type] || 0) + 1
    }

    // 시장 컨텍스트 확인
    const hasMarketContext = anomalies.some((a) => a.marketContext?.isSpecialDay)
    const marketEvents = new Set<string>()
    anomalies.forEach((a) => {
      a.marketContext?.events.forEach((e) => marketEvents.add(e))
    })

    // 세그먼트 분석 (옵션)
    let segmentAnalysis: AnomalyResponse['segmentAnalysis'] | undefined
    if (includeSegmentAnalysis && anomalies.length > 0) {
      // anomalies를 EnhancedAnomaly로 캐스팅 (AnomalyDetectionService에서 반환하는 타입)
      const enhancedAnomalies = anomalies as EnhancedAnomaly[]

      segmentAnalysis = {
        segments: segmentAnalysisService.analyzeSegments(enhancedAnomalies),
        campaignComparison: segmentAnalysisService.compareCampaigns(enhancedAnomalies),
        timePatterns: segmentAnalysisService.analyzeTimePatterns(enhancedAnomalies),
      }
    }

    const response: AnomalyResponse = {
      anomalies: anomaliesWithAnalysis,
      detectedAt: new Date().toISOString(),
      count: anomalies.length,
      summary: {
        critical: anomalies.filter((a) => a.severity === 'critical').length,
        warning: anomalies.filter((a) => a.severity === 'warning').length,
        info: anomalies.filter((a) => a.severity === 'info').length,
        byType,
      },
      marketContext: hasMarketContext
        ? {
            isSpecialDay: true,
            events: Array.from(marketEvents),
          }
        : undefined,
      segmentAnalysis,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to detect anomalies:', error)
    return NextResponse.json(
      { message: '이상 탐지에 실패했습니다' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ai/anomalies/analyze
 * 특정 이상 징후에 대한 상세 원인 분석
 *
 * Body:
 * - anomaly: 분석할 이상 징후 데이터
 * - context: 추가 컨텍스트 (선택)
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { anomaly, context } = body as {
      anomaly: Anomaly
      context?: AnalysisContext
    }

    if (!anomaly) {
      return NextResponse.json(
        { message: '분석할 이상 징후 데이터가 필요합니다' },
        { status: 400 }
      )
    }

    const rootCauseService = getAnomalyRootCauseService()
    const analysis = rootCauseService.analyzeRootCause(anomaly, {
      currentDate: new Date(),
      ...context,
    })

    return NextResponse.json({
      analysis,
      analyzedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to analyze root cause:', error)
    return NextResponse.json(
      { message: '원인 분석에 실패했습니다' },
      { status: 500 }
    )
  }
}
