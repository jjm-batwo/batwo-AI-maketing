import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { container, DI_TOKENS } from '@/lib/di'
import { getAuthenticatedUser } from '@/lib/auth'
import { revalidateTag } from 'next/cache'
import type {
  BulkUpdateCampaignsUseCase,
  BulkAction,
} from '@/application/use-cases/campaign/BulkUpdateCampaignsUseCase'

const bulkActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('status_change'), status: z.enum(['ACTIVE', 'PAUSED']) }),
  z.object({
    type: z.literal('budget_change'),
    mode: z.enum(['absolute', 'percentage']),
    value: z.number(),
  }),
  z.object({ type: z.literal('delete') }),
])

const requestSchema = z.object({
  campaignIds: z.array(z.string()).min(1).max(50),
  action: bulkActionSchema,
})

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const useCase = container.resolve(DI_TOKENS.BulkUpdateCampaignsUseCase) as BulkUpdateCampaignsUseCase

    const result = await useCase.execute({
      userId: user.id,
      campaignIds: parsed.data.campaignIds,
      action: parsed.data.action as BulkAction,
    })

    revalidateTag('campaigns', 'default')

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 422 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
