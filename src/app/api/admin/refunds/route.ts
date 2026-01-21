import { NextResponse } from 'next/server'
import {
  requireAdmin,
  handleAdminAuth,
} from '@/infrastructure/auth/adminMiddleware'
import { getInvoiceRepository } from '@/lib/di/container'
import { Invoice } from '@domain/entities/Invoice'

export async function GET() {
  const authResult = await requireAdmin()
  const authError = handleAdminAuth(authResult)
  if (authError) return authError

  try {
    const invoiceRepository = getInvoiceRepository()
    const pendingRefunds = await invoiceRepository.findPendingRefunds()

    return NextResponse.json({
      data: pendingRefunds.map((invoice: Invoice) => ({
        id: invoice.id,
        subscriptionId: invoice.subscriptionId,
        amount: invoice.amount.amount,
        currency: invoice.amount.currency,
        status: invoice.status,
        refundAmount: invoice.refundAmount?.amount,
        refundReason: invoice.refundReason,
        createdAt: invoice.createdAt,
        paidAt: invoice.paidAt,
      })),
      total: pendingRefunds.length,
    })
  } catch (error) {
    console.error('Admin refunds list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch refunds' },
      { status: 500 }
    )
  }
}
