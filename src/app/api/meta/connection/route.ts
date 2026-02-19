import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Meta 연결 상태 확인 API
export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const account = await prisma.metaAdAccount.findFirst({
      where: { userId: user.id },
      select: { id: true, tokenExpiry: true },
    })

    const isConnected = !!account
    const isExpired = account?.tokenExpiry
      ? new Date(account.tokenExpiry) < new Date()
      : false

    return NextResponse.json({
      isConnected: isConnected && !isExpired,
      hasAccount: isConnected,
      isExpired,
    })
  } catch (error) {
    console.error('Failed to check Meta connection:', error)
    return NextResponse.json(
      { isConnected: false, hasAccount: false, isExpired: false },
      { status: 200 }
    )
  }
}
