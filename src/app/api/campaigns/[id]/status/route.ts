import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import {
  PauseCampaignUseCase,
  PauseCampaignError,
} from '@application/use-cases/campaign/PauseCampaignUseCase'
import {
  ResumeCampaignUseCase,
  ResumeCampaignError,
} from '@application/use-cases/campaign/ResumeCampaignUseCase'
import {
  CampaignNotFoundError,
  UnauthorizedCampaignAccessError,
} from '@application/use-cases/campaign/UpdateCampaignUseCase'

interface StatusChangeRequest {
  action: 'pause' | 'resume'
  syncToMeta?: boolean
  accessToken?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const body: StatusChangeRequest = await request.json()

    if (!body.action || !['pause', 'resume'].includes(body.action)) {
      return NextResponse.json(
        { message: 'Invalid action. Must be "pause" or "resume"' },
        { status: 400 }
      )
    }

    if (body.action === 'pause') {
      const pauseCampaign = container.resolve<PauseCampaignUseCase>(
        DI_TOKENS.PauseCampaignUseCase
      )

      const result = await pauseCampaign.execute({
        campaignId: id,
        userId: user.id,
        syncToMeta: body.syncToMeta,
        accessToken: body.accessToken,
      })

      return NextResponse.json(result)
    } else {
      const resumeCampaign = container.resolve<ResumeCampaignUseCase>(
        DI_TOKENS.ResumeCampaignUseCase
      )

      const result = await resumeCampaign.execute({
        campaignId: id,
        userId: user.id,
        syncToMeta: body.syncToMeta,
        accessToken: body.accessToken,
      })

      return NextResponse.json(result)
    }
  } catch (error) {
    if (error instanceof CampaignNotFoundError) {
      return NextResponse.json(
        { message: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (error instanceof UnauthorizedCampaignAccessError) {
      return NextResponse.json(
        { message: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (error instanceof PauseCampaignError || error instanceof ResumeCampaignError) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      )
    }

    console.error('Failed to change campaign status:', error)
    return NextResponse.json(
      { message: 'Failed to change campaign status' },
      { status: 500 }
    )
  }
}
