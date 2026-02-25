import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { PrismaCreativeRepository } from '@/infrastructure/database/repositories/PrismaCreativeRepository'
import { CreateCreativeUseCase } from '@application/use-cases/creative/CreateCreativeUseCase'
import { toCreativeDTO } from '@application/dto/creative/CreativeDTO'
import { CreativeFormat } from '@domain/value-objects/CreativeFormat'
import { CTAType } from '@domain/value-objects/CTAType'
import { prisma } from '@/lib/prisma'
import { revalidateTag } from 'next/cache'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const creativeRepository = new PrismaCreativeRepository(prisma)
    const creatives = await creativeRepository.findByUserId(user.id)

    return NextResponse.json({
      creatives: creatives.map(toCreativeDTO),
    })
  } catch (error) {
    console.error('Failed to fetch creatives:', error)
    return NextResponse.json(
      { message: 'Failed to fetch creatives' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()

    const creativeRepository = new PrismaCreativeRepository(prisma)
    const useCase = new CreateCreativeUseCase(creativeRepository)

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
    return NextResponse.json(
      { message: 'Failed to create creative' },
      { status: 500 }
    )
  }
}
