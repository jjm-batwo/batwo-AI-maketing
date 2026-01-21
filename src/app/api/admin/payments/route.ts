import { NextRequest, NextResponse } from 'next/server'
import {
  requireAdmin,
  handleAdminAuth,
} from '@/infrastructure/auth/adminMiddleware'
import { getInvoiceRepository } from '@/lib/di/container'
import { InvoiceStatus } from '@domain/value-objects/InvoiceStatus'

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin()
  const authError = handleAdminAuth(authResult)
  if (authError) return authError

  try {
    const invoiceRepository = getInvoiceRepository()
    const searchParams = request.nextUrl.searchParams

    // 쿼리 파라미터 파싱
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const status = searchParams.get('status') as InvoiceStatus | undefined
    const userId = searchParams.get('userId') || undefined
    const createdAtFrom = searchParams.get('createdAtFrom')
    const createdAtTo = searchParams.get('createdAtTo')
    const paidAtFrom = searchParams.get('paidAtFrom')
    const paidAtTo = searchParams.get('paidAtTo')

    const result = await invoiceRepository.findByFilters(
      {
        status,
        userId,
        createdAtFrom: createdAtFrom ? new Date(createdAtFrom) : undefined,
        createdAtTo: createdAtTo ? new Date(createdAtTo) : undefined,
        paidAtFrom: paidAtFrom ? new Date(paidAtFrom) : undefined,
        paidAtTo: paidAtTo ? new Date(paidAtTo) : undefined,
      },
      { page, limit }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Admin payments list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
