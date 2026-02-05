import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { IBillingKeyRepository } from '@/domain/repositories/IBillingKeyRepository'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return unauthorizedResponse()
  }

  const billingKeyRepository = container.resolve<IBillingKeyRepository>(
    DI_TOKENS.BillingKeyRepository
  )

  const billingKey = await billingKeyRepository.findActiveByUserId(user.id)

  if (!billingKey) {
    return NextResponse.json({ billingKey: null }, { status: 200 })
  }

  // Return card info only (DO NOT return encrypted billing key)
  return NextResponse.json({
    billingKey: {
      id: billingKey.id,
      cardCompany: billingKey.cardCompany,
      cardNumber: billingKey.cardNumber,
      method: billingKey.method,
      isActive: billingKey.isActive,
      authenticatedAt: billingKey.authenticatedAt,
    },
  })
}

export async function DELETE() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return unauthorizedResponse()
  }

  const billingKeyRepository = container.resolve<IBillingKeyRepository>(
    DI_TOKENS.BillingKeyRepository
  )

  const billingKey = await billingKeyRepository.findActiveByUserId(user.id)

  if (!billingKey) {
    return NextResponse.json(
      { error: '등록된 결제 수단이 없습니다' },
      { status: 404 }
    )
  }

  await billingKeyRepository.deactivate(billingKey.id)

  return NextResponse.json({
    message: '결제 수단이 삭제되었습니다',
  })
}
