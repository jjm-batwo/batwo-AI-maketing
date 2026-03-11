import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { container, DI_TOKENS } from '@/lib/di';
import { IReportScheduleRepository } from '@domain/repositories/IReportScheduleRepository';

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
    const scheduleId = resolvedParams.id;
    
    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    const repository = container.resolve<IReportScheduleRepository>(DI_TOKENS.ReportScheduleRepository);
    const existing = await repository.findById(scheduleId);
    
    if (!existing) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }
    
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await repository.delete(scheduleId);
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete report schedule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
