import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { revalidateTag } from 'next/cache'
import {
  createOptimizationRuleSchema,
  optimizationRuleQuerySchema,
  validateBody,
  validateQuery,
} from '@/lib/validations'
import {
  getCreateOptimizationRuleUseCase,
  getListOptimizationRulesUseCase,
} from '@/lib/di/container'

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)

    const validation = validateQuery(searchParams, optimizationRuleQuerySchema)
    if (!validation.success) return validation.error

    const { campaignId } = validation.data

    const rules = await getListOptimizationRulesUseCase().execute({
      userId: user.id,
      campaignId,
    })

    return NextResponse.json({ rules })
  } catch (error) {
    console.error('최적화 규칙 목록 조회 실패:', error)
    return NextResponse.json(
      { message: '최적화 규칙 목록을 불러오지 못했습니다' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const validation = await validateBody(request, createOptimizationRuleSchema)
    if (!validation.success) return validation.error

    const body = validation.data

    const result = await getCreateOptimizationRuleUseCase().execute({
      ...body,
      userId: user.id,
    })

    revalidateTag('optimization-rules', 'default')

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('최적화 규칙 생성 실패:', error)
    return NextResponse.json(
      { message: '최적화 규칙을 생성하지 못했습니다' },
      { status: 500 }
    )
  }
}
