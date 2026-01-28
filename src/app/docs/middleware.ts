import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware to protect API docs in production
 */
export function middleware(_request: NextRequest) {
  // Only allow in development or staging
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
    return NextResponse.json(
      { message: 'API documentation is not available in production' },
      { status: 404 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/docs/:path*',
}
