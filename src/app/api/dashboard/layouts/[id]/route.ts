import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardLayout } from '@domain/entities/DashboardLayout'
import { type DashboardWidget } from '@domain/value-objects/DashboardWidget'
import { Prisma } from '@/generated/prisma'
import { z } from 'zod'

const updateLayoutSchema = z.object({
  name: z.string().min(1).max(100).optional(),
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
  isDefault: z.boolean().optional(),
})

/**
 * GET /api/dashboard/layouts/[id]
 * 특정 레이아웃 상세 조회
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    const layout = await prisma.dashboardLayout.findFirst({
      where: { id, userId: user.id },
    })

    if (!layout) {
      return NextResponse.json(
        { message: '레이아웃을 찾을 수 없습니다' },
        { status: 404 },
      )
    }

    return NextResponse.json({ layout })
  } catch (error) {
    console.error('Failed to fetch dashboard layout:', error)
    return NextResponse.json(
      { message: '레이아웃을 불러오지 못했습니다' },
      { status: 500 },
    )
  }
}

/**
 * PUT /api/dashboard/layouts/[id]
 * 위젯 위치/설정 업데이트
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const body = await request.json()
    const validation = updateLayoutSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: '유효하지 않은 요청입니다', errors: validation.error.flatten() },
        { status: 400 },
      )
    }

    // 소유권 확인
    const existing = await prisma.dashboardLayout.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { message: '레이아웃을 찾을 수 없습니다' },
        { status: 404 },
      )
    }

    // 도메인 엔티티로 검증
    let domainLayout = DashboardLayout.restore({
      id: existing.id,
      userId: existing.userId,
      name: existing.name,
      widgets: existing.widgets as unknown as DashboardWidget[],
      isDefault: existing.isDefault,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
    })

    const { name, widgets, isDefault } = validation.data

    if (name) {
      domainLayout = domainLayout.rename(name)
    }

    if (widgets) {
      domainLayout = domainLayout.updateWidgets(widgets as DashboardWidget[])
    }

    if (isDefault !== undefined) {
      domainLayout = domainLayout.setDefault(isDefault)

      // 기본으로 설정 시 다른 레이아웃의 기본 해제
      if (isDefault) {
        await prisma.dashboardLayout.updateMany({
          where: { userId: user.id, id: { not: id } },
          data: { isDefault: false },
        })
      }
    }

    const updated = await prisma.dashboardLayout.update({
      where: { id },
      data: {
        name: domainLayout.name,
        widgets: JSON.parse(JSON.stringify(domainLayout.widgets)) as Prisma.InputJsonValue,
        isDefault: domainLayout.isDefault,
      },
    })

    return NextResponse.json({ layout: updated })
  } catch (error) {
    if (error instanceof Error &&
      (error.message.includes('위젯') || error.message.includes('레이아웃'))) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    console.error('Failed to update dashboard layout:', error)
    return NextResponse.json(
      { message: '레이아웃 업데이트에 실패했습니다' },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/dashboard/layouts/[id]
 * 레이아웃 삭제
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    const existing = await prisma.dashboardLayout.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { message: '레이아웃을 찾을 수 없습니다' },
        { status: 404 },
      )
    }

    // 기본 레이아웃은 삭제 불가
    if (existing.isDefault) {
      return NextResponse.json(
        { message: '기본 레이아웃은 삭제할 수 없습니다' },
        { status: 400 },
      )
    }

    await prisma.dashboardLayout.delete({
      where: { id },
    })

    return NextResponse.json({ message: '레이아웃이 삭제되었습니다' })
  } catch (error) {
    console.error('Failed to delete dashboard layout:', error)
    return NextResponse.json(
      { message: '레이아웃 삭제에 실패했습니다' },
      { status: 500 },
    )
  }
}
