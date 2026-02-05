import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { IPaymentLogRepository, PaymentLogData } from '@/domain/repositories/IPaymentLogRepository'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return unauthorizedResponse()
  }

  const { id } = await params

  const paymentLogRepository = container.resolve<IPaymentLogRepository>(
    DI_TOKENS.PaymentLogRepository
  )

  // Get all payment logs for user and find the matching one
  const allPaymentLogs = await paymentLogRepository.findByUserId(user.id)
  const paymentLog = allPaymentLogs.find((log: PaymentLogData) => log.id === id)

  if (!paymentLog) {
    return NextResponse.json(
      { error: '결제 내역을 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  // Return payment receipt details
  return NextResponse.json({
    id: paymentLog.id,
    orderId: paymentLog.orderId,
    paymentKey: paymentLog.paymentKey,
    amount: paymentLog.amount,
    status: paymentLog.status,
    method: paymentLog.method,
    receiptUrl: paymentLog.receiptUrl,
    createdAt: paymentLog.createdAt,
  })
}
