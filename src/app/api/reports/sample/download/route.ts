/**
 * 예시 보고서 PDF 다운로드 API
 *
 * GET: 예시 보고서 PDF 생성 및 다운로드
 */

import { NextResponse } from 'next/server'
import { ReportPDFGenerator } from '@/infrastructure/pdf/ReportPDFGenerator'
import { getSampleReportDTO } from '@/lib/sample-report-data'
import { getSampleEnhancedReportDTO } from '@/lib/sample-enhanced-report-data'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const enhanced = searchParams.get('enhanced') === 'true'

    const sampleReport = enhanced
      ? getSampleEnhancedReportDTO()
      : getSampleReportDTO()

    // PDF 생성
    const generator = new ReportPDFGenerator()
    const result = await generator.generateWeeklyReport(sampleReport)

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
