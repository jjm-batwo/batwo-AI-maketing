import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getContainer } from '@/lib/di';
import { DI_TOKENS } from '@/lib/di/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry') || 'ECOMMERCE'; // from User model if available, but default ECOMMERCE
    const period = parseInt(searchParams.get('period') || '30');

    const container = getContainer();
    const benchmarkService = container.get(DI_TOKENS.PerformanceBenchmarkService);
    const data = await benchmarkService.getBenchmark(user.id, industry, period);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Benchmark API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
