import { NextRequest, NextResponse } from 'next/server'
import { container, DI_TOKENS } from '@/lib/di'
import { IReportRepository } from '@domain/repositories/IReportRepository'
import { ReportMapper } from '@infrastructure/database/mappers/ReportMapper'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params

    if (!resolvedParams.token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const reportRepository = container.resolve<IReportRepository>(DI_TOKENS.ReportRepository)
    const report = await reportRepository.findByShareToken(resolvedParams.token)

    if (!report) {
      return NextResponse.json({ error: 'Report not found or invalid token' }, { status: 404 })
    }

    if (!report.isShareValid()) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 })
    }

    return NextResponse.json(ReportMapper.toCreateInput(report), { status: 200 })
  } catch (error) {
    console.error('Failed to fetch shared report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
