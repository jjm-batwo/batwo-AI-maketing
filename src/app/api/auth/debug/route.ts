import { NextResponse } from 'next/server'

export async function GET() {
  // Only allow in development or with special header for debugging
  const envCheck = {
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    googleClientIdLength: process.env.GOOGLE_CLIENT_ID?.length ?? 0,
    googleClientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 10) ?? 'N/A',
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    googleClientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length ?? 0,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    authSecretLength: process.env.AUTH_SECRET?.length ?? 0,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length ?? 0,
    authUrl: process.env.AUTH_URL ?? 'N/A',
    nextAuthUrl: process.env.NEXTAUTH_URL ?? 'N/A',
    nodeEnv: process.env.NODE_ENV ?? 'N/A',
    // Check for common issues
    googleClientIdStartsWithQuote: process.env.GOOGLE_CLIENT_ID?.startsWith('"') ?? false,
    googleClientIdEndsWithQuote: process.env.GOOGLE_CLIENT_ID?.endsWith('"') ?? false,
    authSecretStartsWithQuote: process.env.AUTH_SECRET?.startsWith('"') ?? false,
    authSecretEndsWithQuote: process.env.AUTH_SECRET?.endsWith('"') ?? false,
  }

  return NextResponse.json(envCheck)
}
