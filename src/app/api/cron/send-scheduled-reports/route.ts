import { NextRequest, NextResponse } from 'next/server'
import { container, DI_TOKENS } from '@/lib/di'
import { SendScheduledReportsUseCase } from '@application/use-cases/report/SendScheduledReportsUseCase'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const useCase = container.resolve<SendScheduledReportsUseCase>(
      DI_TOKENS.SendScheduledReportsUseCase
    )
    const result = await useCase.execute()

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to execute send scheduled reports cron job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
