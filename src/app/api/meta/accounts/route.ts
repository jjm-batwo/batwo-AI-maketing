import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const accounts = await prisma.metaAdAccount.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        metaAccountId: true,
        businessName: true,
        createdAt: true,
        tokenExpiry: true,
      },
    })

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Failed to fetch Meta accounts:', error)
    return NextResponse.json(
      { message: 'Failed to fetch Meta accounts' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    await prisma.metaAdAccount.deleteMany({
      where: { userId: user.id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to disconnect Meta accounts:', error)
    return NextResponse.json(
      { message: 'Failed to disconnect Meta accounts' },
      { status: 500 }
    )
  }
}
