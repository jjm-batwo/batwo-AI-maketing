import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { IReportRepository } from '@domain/repositories/IReportRepository'
import { GenerateWeeklyReportUseCase } from '@application/use-cases/report/GenerateWeeklyReportUseCase'
import { UnauthorizedCampaignError } from '@application/use-cases/report/GenerateWeeklyReportUseCase'
import { toReportDTO } from '@application/dto/report/ReportDTO'
import { ReportType } from '@domain/entities/Report'

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const type = searchParams.get('type') as ReportType | null

    const reportRepository = container.resolve<IReportRepository>(
      DI_TOKENS.ReportRepository
    )

    // Fetch reports with filters
    const allReports = type
      ? await reportRepository.findByFilters({ userId: user.id, type })
      : await reportRepository.findByUserId(user.id)

    // Apply pagination
    const total = allReports.length
    const start = (page - 1) * pageSize
    const paginatedReports = allReports.slice(start, start + pageSize)

    // Transform to DTOs with API response format
    const reports = paginatedReports.map((report) => ({
      id: report.id,
      type: report.type,
      status: report.status,
      dateRange: {
        startDate: report.dateRange.startDate.toISOString().split('T')[0],
        endDate: report.dateRange.endDate?.toISOString().split('T')[0] ?? report.dateRange.startDate.toISOString().split('T')[0],
      },
      generatedAt: report.generatedAt?.toISOString(),
      campaignCount: report.campaignIds.length,
    }))

    return NextResponse.json({
      reports,
      total,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('Failed to fetch reports:', error)
    return NextResponse.json(
      { message: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { campaignIds, startDate, endDate } = body

    if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length === 0) {
      return NextResponse.json(
        { message: 'campaignIds is required and must be a non-empty array' },
        { status: 400 }
      )
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { message: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    const generateReport = container.resolve<GenerateWeeklyReportUseCase>(
      DI_TOKENS.GenerateWeeklyReportUseCase
    )

    const result = await generateReport.execute({
      userId: user.id,
      campaignIds,
      startDate,
      endDate,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Failed to generate report:', error)

    if (error instanceof UnauthorizedCampaignError) {
      return NextResponse.json(
        { message: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { message: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
