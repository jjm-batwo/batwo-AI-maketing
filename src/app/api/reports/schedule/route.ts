import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di'
import { IReportScheduleRepository } from '@domain/repositories/IReportScheduleRepository'
import { ReportSchedule } from '@domain/entities/ReportSchedule'

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()

  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const repository = container.resolve<IReportScheduleRepository>(
      DI_TOKENS.ReportScheduleRepository
    )
    const schedules = await repository.findByUserId(user.id)

    // Convert to simple objects
    const data = schedules.map((s) => ({
      id: s.id,
      userId: s.userId,
      frequency: s.frequency,
      recipients: s.recipients,
      nextSendAt: s.nextSendAt,
      isActive: s.isActive,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }))

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Failed to get report schedules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()

  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { frequency, recipients } = body

    if (!frequency || !Array.isArray(recipients)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const repository = container.resolve<IReportScheduleRepository>(
      DI_TOKENS.ReportScheduleRepository
    )

    const schedule = ReportSchedule.create({
      userId: user.id,
      frequency,
      recipients,
    })

    const saved = await repository.save(schedule)

    return NextResponse.json(
      {
        id: saved.id,
        userId: saved.userId,
        frequency: saved.frequency,
        recipients: saved.recipients,
        nextSendAt: saved.nextSendAt,
        isActive: saved.isActive,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create report schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
