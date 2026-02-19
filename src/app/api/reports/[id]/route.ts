import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { IReportRepository } from '@domain/repositories/IReportRepository'
import { toReportDTO } from '@application/dto/report/ReportDTO'
import { revalidateTag } from 'next/cache'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    const reportRepository = container.resolve<IReportRepository>(
      DI_TOKENS.ReportRepository
    )

    const report = await reportRepository.findById(id)

    if (!report) {
      return NextResponse.json(
        { message: '보고서를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Check ownership
    if (report.userId !== user.id) {
      return NextResponse.json(
        { message: '보고서를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json(toReportDTO(report))
  } catch (error) {
    console.error('Failed to fetch report:', error)
    return NextResponse.json(
      { message: 'Failed to fetch report' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    const reportRepository = container.resolve<IReportRepository>(
      DI_TOKENS.ReportRepository
    )

    const report = await reportRepository.findById(id)

    if (!report) {
      return NextResponse.json(
        { message: '보고서를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Check ownership
    if (report.userId !== user.id) {
      return NextResponse.json(
        { message: '보고서를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    await reportRepository.delete(id)

    revalidateTag('reports', 'default')

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete report:', error)
    return NextResponse.json(
      { message: 'Failed to delete report' },
      { status: 500 }
    )
  }
}
