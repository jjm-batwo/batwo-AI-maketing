import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { getReportRepository, getReportPDFGenerator } from '@/lib/di/container'
import { toReportDTO } from '@application/dto/report/ReportDTO'

/**
 * GET /api/reports/[id]/download
 * PDF 형식으로 리포트 다운로드
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    // Get report from repository
    const reportRepo = getReportRepository()
    const report = await reportRepo.findById(id)

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

    // Generate PDF
    const pdfGenerator = getReportPDFGenerator()
    const reportDTO = toReportDTO(report)
    const { buffer, filename, contentType } = await pdfGenerator.generateWeeklyReport(reportDTO)

    // Return PDF (convert Buffer to Uint8Array for NextResponse)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Failed to download report:', error)
    return NextResponse.json(
      { message: '리포트 다운로드에 실패했습니다' },
      { status: 500 }
    )
  }
}
