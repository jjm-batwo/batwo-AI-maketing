import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import {
  requireAdmin,
  handleAdminAuth,
} from '@/infrastructure/auth/adminMiddleware'
import { getInvoiceRepository } from '@/lib/di/container'
import { InvoiceStatus } from '@domain/value-objects/InvoiceStatus'

interface Params {
  id: string
}

// 환불 승인
export async function POST(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const authResult = await requireAdmin()
  const authError = handleAdminAuth(authResult)
  if (authError) return authError

  try {
    const { id } = await context.params
    const body = await request.json()
    const invoiceRepository = getInvoiceRepository()

    const invoice = await invoiceRepository.findById(id)
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    if (invoice.status !== InvoiceStatus.REFUND_REQUESTED) {
      return NextResponse.json(
        { error: 'Invoice is not in refund requested status' },
        { status: 400 }
      )
    }

    // 환불 금액 결정 (부분 환불 지원)
    const refundAmountValue = body.refundAmount
      ? body.refundAmount
      : invoice.amount.amount

    // 환불 처리 (Invoice는 불변 객체이므로 새 인스턴스 반환)
    const processedInvoice = invoice.processRefund(refundAmountValue)

    const updatedInvoice = await invoiceRepository.update(processedInvoice)

    revalidateTag('admin-dashboard', 'default')

    return NextResponse.json({
      id: updatedInvoice.id,
      status: updatedInvoice.status,
      refundAmount: updatedInvoice.refundAmount?.amount,
      refundedAt: updatedInvoice.refundedAt,
      message: 'Refund approved successfully',
    })
  } catch (error) {
    console.error('Admin refund approve error:', error)
    return NextResponse.json(
      { error: 'Failed to approve refund' },
      { status: 500 }
    )
  }
}

// 환불 거절
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const authResult = await requireAdmin()
  const authError = handleAdminAuth(authResult)
  if (authError) return authError

  try {
    const { id } = await context.params
    const body = await request.json()
    const invoiceRepository = getInvoiceRepository()

    const invoice = await invoiceRepository.findById(id)
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    if (invoice.status !== InvoiceStatus.REFUND_REQUESTED) {
      return NextResponse.json(
        { error: 'Invoice is not in refund requested status' },
        { status: 400 }
      )
    }

    // 환불 거절 - 원래 상태(PAID)로 복구 (Invoice는 불변 객체이므로 새 인스턴스 반환)
    const rejectedInvoice = invoice.rejectRefund(body.reason)

    const updatedInvoice = await invoiceRepository.update(rejectedInvoice)

    revalidateTag('admin-dashboard', 'default')

    return NextResponse.json({
      id: updatedInvoice.id,
      status: updatedInvoice.status,
      message: 'Refund rejected',
    })
  } catch (error) {
    console.error('Admin refund reject error:', error)
    return NextResponse.json(
      { error: 'Failed to reject refund' },
      { status: 500 }
    )
  }
}
