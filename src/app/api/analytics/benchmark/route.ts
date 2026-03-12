import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/auth/auth'
import { DI_TOKENS, container } from '@/lib/di/container'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const user = session?.user
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const industry = searchParams.get('industry') || 'ECOMMERCE' // from User model if available, but default ECOMMERCE
    const period = parseInt(searchParams.get('period') || '30')

    const benchmarkService = container.resolve<any>(DI_TOKENS.PerformanceBenchmarkService)
    const data = await benchmarkService.getBenchmark(user.id, industry, period)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Benchmark API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
