import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { toCreativeDTO } from '@application/dto/creative/CreativeDTO'
import type { ICreativeRepository } from '@domain/repositories/ICreativeRepository'
import { CreativeFormat } from '@domain/value-objects/CreativeFormat'
import { CTAType } from '@domain/value-objects/CTAType'
import { CreateCreativeUseCase } from '@application/use-cases/creative/CreateCreativeUseCase'
import { revalidateTag } from 'next/cache'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const creativeRepository = container.resolve<ICreativeRepository>(DI_TOKENS.CreativeRepository)
    const creatives = await creativeRepository.findByUserId(user.id)

    return NextResponse.json({
      creatives: creatives.map(toCreativeDTO),
    })
  } catch (error) {
    console.error('Failed to fetch creatives:', error)
    return NextResponse.json({ message: 'Failed to fetch creatives' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()

    const useCase = container.resolve<CreateCreativeUseCase>(DI_TOKENS.CreateCreativeUseCase)

    const result = await useCase.execute({
      userId: user.id,
      name: body.name,
      format: body.format as CreativeFormat,
      primaryText: body.primaryText,
      headline: body.headline,
      description: body.description,
      callToAction: body.callToAction as CTAType | undefined,
      linkUrl: body.linkUrl,
      assets: body.assets,
    })

    revalidateTag('campaigns', 'default')

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Failed to create creative:', error)
    return NextResponse.json({ message: 'Failed to create creative' }, { status: 500 })
  }
}
