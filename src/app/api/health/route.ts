/**
 * Health Check Endpoint
 *
 * 시스템 상태 확인을 위한 헬스체크 API
 * 로드밸런서, 모니터링 시스템에서 사용
 *
 * GET /api/health - 전체 시스템 상태
 * GET /api/health?check=db - 데이터베이스만 확인
 * GET /api/health?check=quick - 빠른 응답 (DB 체크 없음)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: CheckResult
    memory: CheckResult
    environment: CheckResult
  }
}

interface CheckResult {
  status: 'pass' | 'warn' | 'fail'
  message: string
  latency?: number
  details?: Record<string, unknown>
}

// 서버 시작 시간 (uptime 계산용)
const serverStartTime = Date.now()

/**
 * 데이터베이스 연결 체크
 */
async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now()

  try {
    // 간단한 쿼리로 연결 확인
    await prisma.$queryRaw`SELECT 1 as health`
    const latency = Date.now() - start

    // 지연 시간에 따른 상태
    if (latency < 100) {
      return {
        status: 'pass',
        message: 'Database connection healthy',
        latency,
      }
    } else if (latency < 500) {
      return {
        status: 'warn',
        message: 'Database connection slow',
        latency,
      }
    } else {
      return {
        status: 'warn',
        message: 'Database connection very slow',
        latency,
      }
    }
  } catch (error) {
    return {
      status: 'fail',
      message: 'Database connection failed',
      latency: Date.now() - start,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

/**
 * 메모리 사용량 체크
 */
function checkMemory(): CheckResult {
  if (typeof process.memoryUsage !== 'function') {
    return {
      status: 'pass',
      message: 'Memory check not available (Edge runtime)',
    }
  }

  const usage = process.memoryUsage()
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024)
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024)
  const usagePercent = Math.round((usage.heapUsed / usage.heapTotal) * 100)

  const details = {
    heapUsedMB,
    heapTotalMB,
    usagePercent,
    rssMB: Math.round(usage.rss / 1024 / 1024),
  }

  if (usagePercent < 70) {
    return {
      status: 'pass',
      message: `Memory usage: ${usagePercent}%`,
      details,
    }
  } else if (usagePercent < 85) {
    return {
      status: 'warn',
      message: `High memory usage: ${usagePercent}%`,
      details,
    }
  } else {
    return {
      status: 'fail',
      message: `Critical memory usage: ${usagePercent}%`,
      details,
    }
  }
}

/**
 * 환경변수 체크
 */
function checkEnvironment(): CheckResult {
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ]

  const optionalVars = [
    'SENTRY_DSN',
    'OPENAI_API_KEY',
    'META_APP_ID',
  ]

  const missingRequired = requiredVars.filter((v) => !process.env[v])
  const missingOptional = optionalVars.filter((v) => !process.env[v])

  if (missingRequired.length > 0) {
    return {
      status: 'fail',
      message: 'Missing required environment variables',
      details: {
        missing: missingRequired,
      },
    }
  }

  if (missingOptional.length > 0) {
    return {
      status: 'warn',
      message: 'Missing optional environment variables',
      details: {
        missing: missingOptional,
      },
    }
  }

  return {
    status: 'pass',
    message: 'All environment variables configured',
    details: {
      nodeEnv: process.env.NODE_ENV,
    },
  }
}

/**
 * 전체 상태 계산
 */
function calculateOverallStatus(
  checks: HealthStatus['checks']
): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(checks).map((c) => c.status)

  if (statuses.some((s) => s === 'fail')) {
    return 'unhealthy'
  }
  if (statuses.some((s) => s === 'warn')) {
    return 'degraded'
  }
  return 'healthy'
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const checkType = searchParams.get('check') || 'full'

  // 빠른 응답 (Kubernetes liveness probe용)
  if (checkType === 'quick') {
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  }

  // DB만 체크 (Kubernetes readiness probe용)
  if (checkType === 'db') {
    const dbCheck = await checkDatabase()
    const status = dbCheck.status === 'fail' ? 503 : 200

    return NextResponse.json(
      {
        status: dbCheck.status === 'fail' ? 'unhealthy' : 'healthy',
        timestamp: new Date().toISOString(),
        checks: { database: dbCheck },
      },
      { status }
    )
  }

  // 전체 헬스체크
  const checks = {
    database: await checkDatabase(),
    memory: checkMemory(),
    environment: checkEnvironment(),
  }

  const overallStatus = calculateOverallStatus(checks)
  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    uptime: Math.round((Date.now() - serverStartTime) / 1000),
    checks,
  }

  return NextResponse.json(healthStatus, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
