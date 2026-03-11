import { NextResponse } from 'next/server'
import { auth } from '@/infrastructure/auth/auth'
import { DI_TOKENS, container } from '@/lib/di/container'
import { AdAccountAuditService } from '@/application/services/AdAccountAuditService'

export async function GET() {
  const session = await auth()
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  try {
    const auditService = container.resolve<AdAccountAuditService>(DI_TOKENS.AdAccountAuditService)
    const report = await auditService.generateAudit(session.user.id)

    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    console.error('[AccountAuditAPI] Error generating audit:', error)
    return NextResponse.json({ error: '진단에 실패했습니다' }, { status: 500 })
  }
}
