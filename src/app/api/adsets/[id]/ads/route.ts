import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { CreateAdUseCase } from '@application/use-cases/ad/CreateAdUseCase'
import { toAdDTO } from '@application/dto/ad/AdDTO'
import type { IAdRepository } from '@domain/repositories/IAdRepository'
import { revalidateTag } from 'next/cache'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id: adSetId } = await params
    const adRepository = container.resolve<IAdRepository>(DI_TOKENS.AdRepository)
    const ads = await adRepository.findByAdSetId(adSetId)

    return NextResponse.json({
      ads: ads.map(toAdDTO),
    })
  } catch (error) {
    console.error('Failed to fetch ads:', error)
    return NextResponse.json({ message: 'Failed to fetch ads' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id: adSetId } = await params
    const body = await request.json()
    const createAdUseCase = container.resolve<CreateAdUseCase>(DI_TOKENS.CreateAdUseCase)
    const savedAd = await createAdUseCase.execute({
      adSetId,
      name: body.name,
      creativeId: body.creativeId,
    })

    revalidateTag('campaigns', 'default')
    revalidateTag('kpi', 'default')

    return NextResponse.json(savedAd, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create ad'
    if (message.includes('AdSet not found')) {
      return NextResponse.json({ message: 'AdSet not found' }, { status: 404 })
    }

    if (message.includes('Creative not found')) {
      return NextResponse.json({ message: 'Creative not found' }, { status: 404 })
    }

    console.error('Failed to create ad:', error)
    return NextResponse.json({ message: 'Failed to create ad' }, { status: 500 })
  }
}
