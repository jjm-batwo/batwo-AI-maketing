import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { PrismaCreativeRepository } from '@/infrastructure/database/repositories/PrismaCreativeRepository'
import { toCreativeDTO } from '@application/dto/creative/CreativeDTO'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const creativeRepository = new PrismaCreativeRepository(prisma)
    const creative = await creativeRepository.findById(id)

    if (!creative) {
      return NextResponse.json(
        { message: 'Creative not found' },
        { status: 404 }
      )
    }

    // 소유권 확인
    if (creative.userId !== user.id) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json(toCreativeDTO(creative))
  } catch (error) {
    console.error('Failed to fetch creative:', error)
    return NextResponse.json(
      { message: 'Failed to fetch creative' },
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
    const body = await request.json()
    const creativeRepository = new PrismaCreativeRepository(prisma)
    const creative = await creativeRepository.findById(id)

    if (!creative) {
      return NextResponse.json(
        { message: 'Creative not found' },
        { status: 404 }
      )
    }

    if (creative.userId !== user.id) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    let updated = creative

    // 카피 업데이트
    if (body.primaryText !== undefined || body.headline !== undefined || body.description !== undefined) {
      updated = updated.updateCopy({
        primaryText: body.primaryText,
        headline: body.headline,
        description: body.description,
      })
    }

    // 에셋 업데이트
    if (body.assets !== undefined) {
      updated = updated.updateAssets(body.assets)
    }

    const saved = await creativeRepository.update(updated)
    return NextResponse.json(toCreativeDTO(saved))
  } catch (error) {
    console.error('Failed to update creative:', error)
    return NextResponse.json(
      { message: 'Failed to update creative' },
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
    const creativeRepository = new PrismaCreativeRepository(prisma)
    const creative = await creativeRepository.findById(id)

    if (!creative) {
      return NextResponse.json(
        { message: 'Creative not found' },
        { status: 404 }
      )
    }

    if (creative.userId !== user.id) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    await creativeRepository.delete(id)
    return NextResponse.json({ message: 'Creative deleted' })
  } catch (error) {
    console.error('Failed to delete creative:', error)
    return NextResponse.json(
      { message: 'Failed to delete creative' },
      { status: 500 }
    )
  }
}
