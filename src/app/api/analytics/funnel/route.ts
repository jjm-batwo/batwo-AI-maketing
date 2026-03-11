import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/infrastructure/auth/auth';
import { getConversionFunnelService } from '@/lib/di/container';

export async function GET(request: NextRequest) {
  const session = await auth();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const pixelId = searchParams.get('pixelId');
  const period = searchParams.get('period') || '30d';

  if (!pixelId) {
    return NextResponse.json({ error: 'pixelId is required' }, { status: 400 });
  }

  try {
    const funnelService = getConversionFunnelService();
    const funnel = await funnelService.getFunnel(pixelId, period);

    return NextResponse.json({ success: true, data: funnel });
  } catch (error) {
    console.error('Failed to fetch funnel data:', error);
    return NextResponse.json({ error: 'Failed to fetch funnel data' }, { status: 500 });
  }
}
