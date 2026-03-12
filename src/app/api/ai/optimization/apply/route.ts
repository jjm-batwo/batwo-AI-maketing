import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/auth'
import { container } from '@/lib/di/container'
import { DI_TOKENS } from '@/lib/di/types'
import { z } from 'zod'
import { ApplyOptimizationUseCase } from '@/application/use-cases/ai/ApplyOptimizationUseCase'
import { ActionType } from '@/domain/value-objects/ApplyAction'

const applySchema = z.object({
  type: z.enum(['budget_change', 'status_change', 'bid_strategy_change', 'targeting_change']),
  campaignId: z.string(),
  description: z.string(),
  currentValue: z.unknown(),
  suggestedValue: z.unknown(),
  expectedImpact: z.string(),
  confidence: z.number().min(0).max(1),
  conversationId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = applySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const useCase = container.resolve<ApplyOptimizationUseCase>(DI_TOKENS.ApplyOptimizationUseCase)
    const result = await useCase.execute({
      userId: session.user.id,
      action: {
        ...parsed.data,
        type: parsed.data.type as ActionType,
      },
      conversationId: parsed.data.conversationId,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 })
  }
}
