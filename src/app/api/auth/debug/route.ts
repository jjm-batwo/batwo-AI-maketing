import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
  // Check Google OAuth configuration
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
    hasGoogleClientId: !!googleClientId,
    googleClientIdLength: googleClientId.length,
    googleClientIdPrefix: googleClientId.substring(0, 15),
    googleClientIdSuffix: googleClientId.substring(googleClientId.length - 30),
    isValidGoogleClientIdFormat,
    hasGoogleClientSecret: !!googleClientSecret,
    googleClientSecretLength: googleClientSecret.length,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    authSecretLength: process.env.AUTH_SECRET?.length ?? 0,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length ?? 0,
    authUrl: process.env.AUTH_URL ?? 'N/A',
    nextAuthUrl: process.env.NEXTAUTH_URL ?? 'N/A',
    nodeEnv: process.env.NODE_ENV ?? 'N/A',
    // Google OIDC check
    googleOidcStatus,
    googleOidcError,
    // Check for common issues
    googleClientIdStartsWithQuote: googleClientId.startsWith('"'),
    googleClientIdEndsWithQuote: googleClientId.endsWith('"'),
    googleClientIdHasNewline: googleClientId.includes('\n'),
    googleClientIdHasSpace: googleClientId.includes(' '),
    authSecretStartsWithQuote: process.env.AUTH_SECRET?.startsWith('"') ?? false,
    authSecretEndsWithQuote: process.env.AUTH_SECRET?.endsWith('"') ?? false,
  }

  return NextResponse.json(envCheck)
}
