import { NextRequest, NextResponse } from 'next/server'
import { DI_TOKENS, container } from '@/lib/di/container'
import { ExpireTrialsUseCase } from '@application/use-cases/payment/ExpireTrialsUseCase'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expireTrialsUseCase = container.resolve<ExpireTrialsUseCase>(DI_TOKENS.ExpireTrialsUseCase)
    const result = await expireTrialsUseCase.execute()

    return NextResponse.json(result)
  } catch (error) {
    console.error('[ExpireTrialsCron] Error executing cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expireTrialsUseCase = container.resolve<ExpireTrialsUseCase>(DI_TOKENS.ExpireTrialsUseCase)
    const result = await expireTrialsUseCase.execute()

    return NextResponse.json(result)
  } catch (error) {
    console.error('[ExpireTrialsCron] Error executing cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
