import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { IReportRepository } from '@domain/repositories/IReportRepository'
import { GenerateWeeklyReportUseCase } from '@application/use-cases/report/GenerateWeeklyReportUseCase'
import { UnauthorizedCampaignError } from '@domain/errors'
import { reportQuerySchema, createReportSchema, validateQuery, validateBody } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)

    // Validate query parameters
    const validation = validateQuery(searchParams, reportQuerySchema)
    if (!validation.success) return validation.error

    const { page, pageSize, type } = validation.data

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
    // Validate request body
    const validation = await validateBody(request, createReportSchema)
    if (!validation.success) return validation.error

    const { campaignIds, startDate, endDate } = validation.data

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
