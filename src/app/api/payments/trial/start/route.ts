import { NextRequest, NextResponse } from 'next/server'
import { DI_TOKENS, container } from '@/lib/di/container'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startTrialUseCase = container.resolve(DI_TOKENS.StartTrialUseCase)
    const result = await startTrialUseCase.execute({
      userId: session.user.id,
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
