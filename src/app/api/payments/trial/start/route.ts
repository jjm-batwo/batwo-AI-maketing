import { NextRequest, NextResponse } from 'next/server'
import { DI_TOKENS, container } from '@/lib/di/container'
import { getAuthenticatedUser } from '@/lib/auth'
import { StartTrialUseCase } from '@application/use-cases/payment/StartTrialUseCase'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startTrialUseCase = container.resolve<StartTrialUseCase>(DI_TOKENS.StartTrialUseCase)
    const result = await startTrialUseCase.execute({
      userId: user.id,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    if (error.name === 'InvalidSubscriptionError') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('[StartTrialAPI] Error starting trial:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
