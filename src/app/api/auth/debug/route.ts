import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  // SECURITY: Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    )
  }

  // Test database connection
  let dbStatus = 'not_tested'
  let dbError = null
  let userCount = 0
  try {
    userCount = await prisma.user.count()
    dbStatus = 'connected'
  } catch (error) {
    dbStatus = 'error'
    dbError = error instanceof Error ? error.message : String(error)
  }

  // Check Google OAuth configuration (without exposing sensitive data)
  const googleClientId = process.env.GOOGLE_CLIENT_ID ?? ''
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? ''

  // Google Client ID should end with .apps.googleusercontent.com
  const isValidGoogleClientIdFormat = googleClientId.includes('.apps.googleusercontent.com')

  // Try to fetch Google's well-known OIDC configuration
  let googleOidcStatus = 'not_tested'
  let googleOidcError = null
  try {
    const response = await fetch('https://accounts.google.com/.well-known/openid-configuration')
    if (response.ok) {
      googleOidcStatus = 'accessible'
    } else {
      googleOidcStatus = `error_${response.status}`
    }
  } catch (error) {
    googleOidcStatus = 'fetch_error'
    googleOidcError = error instanceof Error ? error.message : String(error)
  }

  const envCheck = {
    // Database status
    dbStatus,
    dbError,
    userCount,
    // OAuth configuration (minimized exposure)
    hasGoogleClientId: !!googleClientId,
    googleClientIdLength: googleClientId.length,
    isValidGoogleClientIdFormat,
    hasGoogleClientSecret: !!googleClientSecret,
    googleClientSecretLength: googleClientSecret.length,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    authSecretLength: process.env.AUTH_SECRET?.length ?? 0,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length ?? 0,
    nodeEnv: process.env.NODE_ENV ?? 'N/A',
    // Google OIDC check
    googleOidcStatus,
    googleOidcError,
    // Check for common configuration issues
    googleClientIdStartsWithQuote: googleClientId.startsWith('"'),
    googleClientIdEndsWithQuote: googleClientId.endsWith('"'),
    googleClientIdHasNewline: googleClientId.includes('\n'),
    googleClientIdHasSpace: googleClientId.includes(' '),
    authSecretStartsWithQuote: process.env.AUTH_SECRET?.startsWith('"') ?? false,
    authSecretEndsWithQuote: process.env.AUTH_SECRET?.endsWith('"') ?? false,
  }

  return NextResponse.json(envCheck)
}
