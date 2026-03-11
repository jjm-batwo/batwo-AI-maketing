import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { container, DI_TOKENS } from '@/lib/di';
import { IReportRepository } from '@domain/repositories/IReportRepository';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const reportId = resolvedParams.id;
    
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const expiresInDays = body.expiresInDays || 7;

    const repository = container.resolve<IReportRepository>(DI_TOKENS.ReportRepository);
    const existing = await repository.findById(reportId);
    
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedReport = existing.generateShareToken(expiresInDays);
    await repository.update(updatedReport);
    
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reports/share/${updatedReport.shareToken}`;

    return NextResponse.json({ 
      shareToken: updatedReport.shareToken,
      shareExpiresAt: updatedReport.shareExpiresAt,
      shareUrl,
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to generate report share token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const reportId = resolvedParams.id;
    
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const repository = container.resolve<IReportRepository>(DI_TOKENS.ReportRepository);
    const existing = await repository.findById(reportId);
    
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedReport = existing.revokeShareToken();
    await repository.update(updatedReport);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to revoke report share token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
