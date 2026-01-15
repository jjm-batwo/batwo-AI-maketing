import { PrismaClient } from '@/generated/prisma'

export interface MetaApiLogEntry {
  endpoint: string
  method: string
  statusCode: number
  success: boolean
  errorCode?: string
  errorMsg?: string
  latencyMs: number
  accountId?: string
}

export interface MetaApiStats {
  totalCalls: number
  successCalls: number
  errorCalls: number
  errorRate: number // 0-100 (percentage)
  avgLatencyMs: number
  callsByEndpoint: Record<string, number>
  dailyBreakdown: {
    date: string // YYYY-MM-DD
    calls: number
    errors: number
    errorRate: number
  }[]
}

export class MetaApiLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * API 호출 로그 기록
   */
  async log(entry: MetaApiLogEntry): Promise<void> {
    await this.prisma.metaApiLog.create({
      data: {
        endpoint: entry.endpoint,
        method: entry.method,
        statusCode: entry.statusCode,
        success: entry.success,
        errorCode: entry.errorCode ?? null,
        errorMsg: entry.errorMsg ?? null,
        latencyMs: entry.latencyMs,
        accountId: entry.accountId ?? null,
      },
    })
  }

  /**
   * 최근 N일간 통계 조회 (Meta 앱 검수용)
   * @param days 조회 기간 (기본 15일)
   */
  async getStats(days: number = 15): Promise<MetaApiStats> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // 전체 통계
    const allLogs = await this.prisma.metaApiLog.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        success: true,
        latencyMs: true,
        endpoint: true,
        createdAt: true,
      },
    })

    const totalCalls = allLogs.length
    const successCalls = allLogs.filter((log) => log.success).length
    const errorCalls = totalCalls - successCalls
    const errorRate = totalCalls > 0 ? (errorCalls / totalCalls) * 100 : 0
    const avgLatencyMs =
      totalCalls > 0
        ? allLogs.reduce((sum, log) => sum + log.latencyMs, 0) / totalCalls
        : 0

    // 엔드포인트별 호출 수
    const callsByEndpoint: Record<string, number> = {}
    allLogs.forEach((log) => {
      callsByEndpoint[log.endpoint] = (callsByEndpoint[log.endpoint] || 0) + 1
    })

    // 일별 분석
    const dailyMap = new Map<
      string,
      { calls: number; errors: number }
    >()

    allLogs.forEach((log) => {
      const dateKey = log.createdAt.toISOString().split('T')[0]
      const existing = dailyMap.get(dateKey) || { calls: 0, errors: 0 }
      existing.calls++
      if (!log.success) existing.errors++
      dailyMap.set(dateKey, existing)
    })

    const dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        calls: data.calls,
        errors: data.errors,
        errorRate: data.calls > 0 ? (data.errors / data.calls) * 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalCalls,
      successCalls,
      errorCalls,
      errorRate: Math.round(errorRate * 100) / 100,
      avgLatencyMs: Math.round(avgLatencyMs),
      callsByEndpoint,
      dailyBreakdown,
    }
  }

  /**
   * 오래된 로그 삭제 (30일 이상)
   */
  async cleanupOldLogs(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const result = await this.prisma.metaApiLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    })

    return result.count
  }

  /**
   * 검수 통과 기준 체크
   * - 최근 15일간 1,500회+ 호출
   * - 에러율 15% 미만
   */
  async checkAppReviewStatus(): Promise<{
    passed: boolean
    totalCalls: number
    errorRate: number
    requiredCalls: number
    maxErrorRate: number
    message: string
  }> {
    const stats = await this.getStats(15)
    const requiredCalls = 1500
    const maxErrorRate = 15

    const callsOk = stats.totalCalls >= requiredCalls
    const errorOk = stats.errorRate < maxErrorRate
    const passed = callsOk && errorOk

    let message = ''
    if (passed) {
      message = '✅ 앱 검수 기준 충족'
    } else {
      const issues: string[] = []
      if (!callsOk) {
        issues.push(
          `호출 수 부족: ${stats.totalCalls}/${requiredCalls}회`
        )
      }
      if (!errorOk) {
        issues.push(
          `에러율 초과: ${stats.errorRate.toFixed(1)}% (기준: <${maxErrorRate}%)`
        )
      }
      message = `❌ 기준 미충족: ${issues.join(', ')}`
    }

    return {
      passed,
      totalCalls: stats.totalCalls,
      errorRate: stats.errorRate,
      requiredCalls,
      maxErrorRate,
      message,
    }
  }
}
