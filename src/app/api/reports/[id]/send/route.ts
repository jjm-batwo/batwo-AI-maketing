import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { getReportRepository, getReportPDFGenerator, getEmailService } from '@/lib/di/container'
import { toReportDTO } from '@application/dto/report/ReportDTO'

interface SendReportRequest {
  recipients: string | string[]
}

/**
 * POST /api/reports/[id]/send
 * 리포트를 이메일로 전송
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const body: SendReportRequest = await request.json()

    if (!body.recipients) {
      return NextResponse.json(
        { message: '수신자가 필요합니다' },
        { status: 400 }
      )
    }

    // Get report from repository
    const reportRepository = getReportRepository()
    const report = await reportRepository.findById(id)

    if (!report) {
      return NextResponse.json(
        { message: '리포트를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (report.userId !== user.id) {
      return NextResponse.json(
        { message: '리포트를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Check if report is generated
    if (report.status === 'DRAFT') {
      return NextResponse.json(
        { message: '리포트가 아직 생성되지 않았습니다' },
        { status: 400 }
      )
    }

    // Generate PDF attachment
    const pdfGenerator = getReportPDFGenerator()
    const reportDTO = toReportDTO(report)
    const { buffer, filename } = await pdfGenerator.generateWeeklyReport(reportDTO)

    // Send email with PDF attachment
    const emailService = getEmailService()
    const result = await emailService.sendWeeklyReportEmail({
      to: body.recipients,
      reportName: '바투 마케팅',
      dateRange: {
        startDate: report.dateRange.startDate.toISOString(),
        endDate: report.dateRange.endDate?.toISOString() || report.dateRange.startDate.toISOString(),
      },
      summaryMetrics: {
        totalImpressions: reportDTO.summaryMetrics.totalImpressions,
        totalClicks: reportDTO.summaryMetrics.totalClicks,
        totalConversions: reportDTO.summaryMetrics.totalConversions,
        totalSpend: reportDTO.summaryMetrics.totalSpend,
        totalRevenue: reportDTO.summaryMetrics.totalRevenue,
        overallROAS: reportDTO.summaryMetrics.overallROAS,
      },
      pdfAttachment: {
        filename,
        content: buffer,
      },
    })

    if (!result.success) {
      return NextResponse.json(
        { message: result.error || '이메일 전송에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('Failed to send report email:', error)
    return NextResponse.json(
      { message: '리포트 전송에 실패했습니다' },
      { status: 500 }
    )
  }
}
