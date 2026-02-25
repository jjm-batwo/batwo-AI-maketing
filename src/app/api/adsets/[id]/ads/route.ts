import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { PrismaAdRepository } from '@/infrastructure/database/repositories/PrismaAdRepository'
import { PrismaCreativeRepository } from '@/infrastructure/database/repositories/PrismaCreativeRepository'
import { CreateAdUseCase } from '@application/use-cases/ad/CreateAdUseCase'
import { toAdDTO } from '@application/dto/ad/AdDTO'
import { AdMapper } from '@/infrastructure/database/mappers/AdMapper'
import { prisma } from '@/lib/prisma'
import { revalidateTag } from 'next/cache'

// AdSet 리포지토리는 동일 워커에서 생성될 수 있으므로 인라인으로 처리
async function getAdSetById(id: string) {
  return prisma.adSet.findUnique({ where: { id } })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id: adSetId } = await params
    const ads = await prisma.ad.findMany({
      where: { adSetId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      ads: ads.map((ad) => toAdDTO(AdMapper.toDomain(ad))),
    })
  } catch (error) {
    console.error('Failed to fetch ads:', error)
    return NextResponse.json(
      { message: 'Failed to fetch ads' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id: adSetId } = await params
    const body = await request.json()

    // AdSet 존재 확인
    const adSet = await getAdSetById(adSetId)
    if (!adSet) {
      return NextResponse.json(
        { message: 'AdSet not found' },
        { status: 404 }
      )
    }

    const adRepository = new PrismaAdRepository(prisma)
    const creativeRepository = new PrismaCreativeRepository(prisma)

    // Creative 존재 확인 (인라인 — AdSet 리포지토리 의존성 회피)
    const creative = await creativeRepository.findById(body.creativeId)
    if (!creative) {
      return NextResponse.json(
        { message: 'Creative not found' },
        { status: 404 }
      )
    }

    const { Ad } = await import('@domain/entities/Ad')
    const ad = Ad.create({
      adSetId,
      name: body.name,
      creativeId: body.creativeId,
    })

    const savedAd = await adRepository.save(ad)

    revalidateTag('campaigns', 'default')
    revalidateTag('kpi', 'default')

    return NextResponse.json(toAdDTO(savedAd), { status: 201 })
  } catch (error) {
    console.error('Failed to create ad:', error)
    return NextResponse.json(
      { message: 'Failed to create ad' },
      { status: 500 }
    )
  }
}
