/**
 * 예시 보고서 PDF 다운로드 API
 *
 * GET: 예시 보고서 PDF 생성 및 다운로드
 * ?enhanced=true: 9개 섹션 보고서
 * ?enhanced=true&ai=true: 실제 AI 분석 포함
 */

import { NextResponse } from 'next/server'
import { ReportPDFGenerator } from '@/infrastructure/pdf/ReportPDFGenerator'
import { getSampleReportDTO } from '@/lib/sample-report-data'
import { getSampleEnhancedReportDTO } from '@/lib/sample-enhanced-report-data'
import { AIService } from '@/infrastructure/external/openai/AIService'
import type { ReportDTO } from '@/application/dto/report/ReportDTO'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const enhanced = searchParams.get('enhanced') === 'true'
    const useAI = searchParams.get('ai') === 'true'

    let sampleReport: ReportDTO = enhanced
      ? getSampleEnhancedReportDTO()
      : getSampleReportDTO()

    // AI 분석 실행
    if (enhanced && useAI) {
      try {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) throw new Error('OPENAI_API_KEY not set')
        const aiService = new AIService(apiKey, 'gpt-5-mini')
        const campaigns = sampleReport.campaignPerformance?.campaigns ?? []
        const result = await aiService.generateReportInsights({
          reportType: 'weekly',
          campaignSummaries: campaigns.map(c => ({
            name: c.name,
            objective: c.objective ?? 'CONVERSIONS',
            metrics: {
              impressions: c.impressions ?? 0,
              clicks: c.clicks ?? 0,
              conversions: c.conversions ?? 0,
              spend: c.spend ?? 0,
              revenue: c.revenue ?? 0,
            },
          })),
          includeExtendedInsights: true,
          includeForecast: false,
          includeBenchmark: false,
        })

        // AI 결과를 보고서에 반영
        sampleReport = {
          ...sampleReport,
          performanceAnalysis: {
            summary: result.summary,
            positiveFactors: (result.insights ?? [])
              .filter(i => i.type === 'performance' || i.type === 'trend')
              .map(i => ({ title: i.title, description: i.description, impact: (i.importance === 'critical' ? 'high' : i.importance ?? 'medium') as 'high' | 'medium' | 'low' })),
            negativeFactors: (result.insights ?? [])
              .filter(i => i.type === 'anomaly' || i.type === 'recommendation')
              .map(i => ({ title: i.title, description: i.description, impact: (i.importance === 'critical' ? 'high' : i.importance ?? 'medium') as 'high' | 'medium' | 'low' })),
          },
          recommendations: {
            actions: (result.actionItems ?? []).map(item => ({
              priority: item.priority as 'high' | 'medium' | 'low',
              category: (item.category ?? 'general') as 'budget' | 'creative' | 'targeting' | 'funnel' | 'general',
              title: item.action,
              description: item.action,
              expectedImpact: item.expectedImpact ?? '',
              deadline: item.deadline,
            })),
          },
        }
      } catch (aiError) {
        console.error('AI analysis failed, using static data:', aiError)
      }
    }

    // ₩ 기호를 "원"으로 치환 (PDF 폰트에서 깨짐 방지)
    const sanitized = JSON.parse(JSON.stringify(sampleReport).replace(/₩/g, ''))
    // 금액 뒤에 "원" 붙이기 보정: AI 응답에서 "₩1,250,000" → "1,250,000" 된 것 확인

    // PDF 생성
    const generator = new ReportPDFGenerator()
    const result = await generator.generateWeeklyReport(sanitized)

    // Buffer를 Uint8Array로 변환하여 NextResponse에 전달
    const uint8Array = new Uint8Array(result.buffer)

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(result.filename)}"`,
        'Content-Length': result.buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Sample PDF generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'PDF 생성에 실패했습니다',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
