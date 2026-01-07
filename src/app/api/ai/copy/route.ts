import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { getAIService, getQuotaService } from '@/lib/di/container'
import type { GenerateAdCopyInput } from '@application/ports/IAIService'

const VALID_TONES = ['professional', 'casual', 'playful', 'urgent'] as const
const VALID_OBJECTIVES = ['awareness', 'consideration', 'conversion'] as const

type Tone = (typeof VALID_TONES)[number]
type Objective = (typeof VALID_OBJECTIVES)[number]

interface GenerateCopyRequestBody {
  productName: string
  productDescription: string
  targetAudience: string
  tone: Tone
  objective: Objective
  keywords?: string[]
  variantCount?: number
}

function isValidTone(tone: string): tone is Tone {
  return VALID_TONES.includes(tone as Tone)
}

function isValidObjective(objective: string): objective is Objective {
  return VALID_OBJECTIVES.includes(objective as Objective)
}

/**
 * POST /api/ai/copy
 * AI 광고 카피 생성
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = (await request.json()) as GenerateCopyRequestBody

    // Validate required fields
    if (!body.productName || !body.productDescription || !body.targetAudience) {
      return NextResponse.json(
        { message: '필수 필드가 누락되었습니다 (productName, productDescription, targetAudience)' },
        { status: 400 }
      )
    }

    // Validate tone
    if (!body.tone || !isValidTone(body.tone)) {
      return NextResponse.json(
        { message: `유효하지 않은 tone입니다. 가능한 값: ${VALID_TONES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate objective
    if (!body.objective || !isValidObjective(body.objective)) {
      return NextResponse.json(
        { message: `유효하지 않은 objective입니다. 가능한 값: ${VALID_OBJECTIVES.join(', ')}` },
        { status: 400 }
      )
    }

    // Check quota
    const quotaService = getQuotaService()
    const hasQuota = await quotaService.checkQuota(user.id, 'AI_COPY_GEN')
    if (!hasQuota) {
      return NextResponse.json(
        { message: 'AI 카피 생성 쿼터가 초과되었습니다. 내일 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    // Generate ad copy
    const aiService = getAIService()
    const input: GenerateAdCopyInput = {
      productName: body.productName,
      productDescription: body.productDescription,
      targetAudience: body.targetAudience,
      tone: body.tone,
      objective: body.objective,
      keywords: body.keywords,
      variantCount: body.variantCount ?? 3,
    }

    const variants = await aiService.generateAdCopy(input)

    // Log usage only on success
    await quotaService.logUsage(user.id, 'AI_COPY_GEN')

    return NextResponse.json({
      variants,
      remainingQuota: await getRemainingQuota(user.id, quotaService),
    })
  } catch (error) {
    console.error('Failed to generate ad copy:', error)
    return NextResponse.json(
      { message: 'AI 카피 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}

async function getRemainingQuota(
  userId: string,
  quotaService: ReturnType<typeof getQuotaService>
): Promise<number> {
  const status = await quotaService.getRemainingQuota(userId)
  return status.AI_COPY_GEN?.remaining ?? 0
}
