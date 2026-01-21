/**
 * 예시 보고서 API
 *
 * GET: 예시 ReportDTO 반환 (개발/데모 용도)
 */

import { NextResponse } from 'next/server'
import { getSampleReportDTO } from '@/lib/sample-report-data'

export async function GET() {
  try {
    const sampleReport = getSampleReportDTO()

    return NextResponse.json({
      success: true,
      data: sampleReport,
    })
  } catch (error) {
    console.error('Sample report API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '예시 보고서 생성에 실패했습니다',
      },
      { status: 500 }
    )
  }
}
