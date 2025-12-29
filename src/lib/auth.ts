import { auth } from '@/infrastructure/auth'
import { NextResponse } from 'next/server'

export async function getAuthenticatedUser() {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  return session.user
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: '인증이 필요합니다' },
    { status: 401 }
  )
}

export async function requireAuth() {
  const user = await getAuthenticatedUser()

  if (!user) {
    throw new AuthenticationError('인증이 필요합니다')
  }

  return user
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}
