import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardLayout } from '@domain/entities/DashboardLayout'
import { DEFAULT_WIDGETS, type DashboardWidget } from '@domain/value-objects/DashboardWidget'
import { Prisma } from '@/generated/prisma'
import { z } from 'zod'

const createLayoutSchema = z.object({
  name: z.string().min(1, '레이아웃 이름은 필수입니다').max(100),
  widgets: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        position: z.object({
          x: z.number().min(0),
          y: z.number().min(0),
          w: z.number().min(1).max(12),
          h: z.number().min(1),
        }),
        config: z.object({
          metric: z.string().optional(),
          period: z.string().optional(),
          campaignId: z.string().optional(),
          chartType: z.string().optional(),
          title: z.string().optional(),
        }),
      }),
    )
    .optional(),
})

/**
 * GET /api/dashboard/layouts
 * 사용자 대시보드 레이아웃 목록 조회
 */
export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const layouts = await prisma.dashboardLayout.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    })

    // 레이아웃이 없으면 기본 레이아웃 자동 생성
    if (layouts.length === 0) {
      const defaultLayout = await prisma.dashboardLayout.create({
        data: {
          userId: user.id,
          name: '기본 대시보드',
          widgets: JSON.parse(JSON.stringify(DEFAULT_WIDGETS)) as Prisma.InputJsonValue,
          isDefault: true,
        },
      })

      return NextResponse.json({ layouts: [defaultLayout] })
    }

    return NextResponse.json({ layouts })
  } catch (error) {
    console.error('Failed to fetch dashboard layouts:', error)
    return NextResponse.json(
      { message: '대시보드 레이아웃을 불러오지 못했습니다' },
      { status: 500 },
    )
  }
}

/**
 * POST /api/dashboard/layouts
 * 새 레이아웃 생성
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const validation = createLayoutSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: '유효하지 않은 요청입니다', errors: validation.error.flatten() },
        { status: 400 },
      )
    }

    const { name, widgets } = validation.data

    // 도메인 검증
    const domainLayout = DashboardLayout.create({
      userId: user.id,
      name,
      widgets: widgets as DashboardWidget[] | undefined,
    })

    // 기존 레이아웃 수 확인 (최대 10개)
    const count = await prisma.dashboardLayout.count({
      where: { userId: user.id },
    })

    if (count >= 10) {
      return NextResponse.json(
        { message: '레이아웃은 최대 10개까지 생성할 수 있습니다' },
        { status: 400 },
      )
    }

    // 첫 번째 레이아웃이면 기본으로 설정
    const isFirstLayout = count === 0

    const created = await prisma.dashboardLayout.create({
      data: {
        userId: user.id,
        name: domainLayout.name,
        widgets: JSON.parse(JSON.stringify(domainLayout.widgets)) as Prisma.InputJsonValue,
        isDefault: isFirstLayout,
      },
    })

    return NextResponse.json({ layout: created }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('위젯')) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    console.error('Failed to create dashboard layout:', error)
    return NextResponse.json(
      { message: '레이아웃 생성에 실패했습니다' },
      { status: 500 },
    )
  }
}
