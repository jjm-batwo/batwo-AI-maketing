import { NextRequest, NextResponse } from 'next/server'
import {
  requireAdmin,
  handleAdminAuth,
} from '@/infrastructure/auth/adminMiddleware'
import { getInvoiceRepository } from '@/lib/di/container'

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin()
  const authError = handleAdminAuth(authResult)
  if (authError) return authError

  try {
    const invoiceRepository = getInvoiceRepository()
    const searchParams = request.nextUrl.searchParams

    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')

    const stats = await invoiceRepository.getPaymentStats(
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined
    )

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Admin payments stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment stats' },
      { status: 500 }
    )
  }
}
