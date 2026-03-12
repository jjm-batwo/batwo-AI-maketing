import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { isMetaConnected } from '@/lib/meta/metaAccountHelper'

// Meta 연결 상태 확인 API
export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const status = await isMetaConnected(user.id)
  return NextResponse.json(status)
}
