import { NextResponse } from 'next/server'
import { getOpenApiSpec } from '@/lib/openapi'

/**
 * GET /api/docs - OpenAPI JSON spec
 */
export async function GET() {
  const spec = getOpenApiSpec()

  if (!spec) {
    return NextResponse.json(
      { message: 'API documentation is not available in production' },
      { status: 404 }
    )
  }

  return NextResponse.json(spec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
