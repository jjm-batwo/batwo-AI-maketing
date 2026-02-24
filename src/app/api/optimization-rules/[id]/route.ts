import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { revalidateTag } from 'next/cache'
import { updateOptimizationRuleSchema, validateBody } from '@/lib/validations'
import {
  getOptimizationRuleRepository,
  getUpdateOptimizationRuleUseCase,
  getDeleteOptimizationRuleUseCase,
} from '@/lib/di/container'
import { toOptimizationRuleDTO } from '@application/dto/optimization/OptimizationRuleDTO'
import {
  OptimizationRuleNotFoundError,
  UnauthorizedOptimizationRuleError,
} from '@application/use-cases/optimization/UpdateOptimizationRuleUseCase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    const rule = await getOptimizationRuleRepository().findById(id)

    if (!rule) {
      return NextResponse.json(
        { message: '최적화 규칙을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (rule.userId !== user.id) {
      return NextResponse.json(
        { message: '최적화 규칙을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json(toOptimizationRuleDTO(rule))
  } catch (error) {
    console.error('최적화 규칙 조회 실패:', error)
    return NextResponse.json(
      { message: '최적화 규칙을 불러오지 못했습니다' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    const validation = await validateBody(request, updateOptimizationRuleSchema)
    if (!validation.success) return validation.error

    const body = validation.data

    const result = await getUpdateOptimizationRuleUseCase().execute({
      ruleId: id,
      userId: user.id,
      ...body,
    })

    revalidateTag('optimization-rules', 'default')

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof OptimizationRuleNotFoundError) {
      return NextResponse.json(
        { message: '최적화 규칙을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (error instanceof UnauthorizedOptimizationRuleError) {
      return NextResponse.json(
        { message: '최적화 규칙을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    console.error('최적화 규칙 수정 실패:', error)
    return NextResponse.json(
      { message: '최적화 규칙을 수정하지 못했습니다' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    await getDeleteOptimizationRuleUseCase().execute({
      ruleId: id,
      userId: user.id,
    })

    revalidateTag('optimization-rules', 'default')

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof OptimizationRuleNotFoundError) {
      return NextResponse.json(
        { message: '최적화 규칙을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (error instanceof UnauthorizedOptimizationRuleError) {
      return NextResponse.json(
        { message: '최적화 규칙을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    console.error('최적화 규칙 삭제 실패:', error)
    return NextResponse.json(
      { message: '최적화 규칙을 삭제하지 못했습니다' },
      { status: 500 }
    )
  }
}
