/**
 * @fileoverview 품질 게이트 러너
 * 클린 아키텍처: Application 계층 - 품질 검증 자동화
 *
 * 역할:
 * - 품질 게이트 순서대로 실행
 * - 각 게이트 결과 수집
 * - 전체 품질 보고서 생성
 */

/**
 * 게이트 유형
 */
export type GateType =
  | 'architecture'
  | 'typeCheck'
  | 'lint'
  | 'unitTest'
  | 'integrationTest'
  | 'build'
  | 'security'

/**
 * 개별 게이트 설정
 */
export interface GateConfig {
  enabled: boolean
  command?: string
  coverageThreshold?: number
}

/**
 * 전체 품질 게이트 설정
 */
export interface QualityGateConfig {
  typeCheck: GateConfig
  lint: GateConfig
  unitTest: GateConfig
  integrationTest: GateConfig
  build: GateConfig
  architecture: GateConfig
  security: GateConfig
  stopOnFailure?: boolean
}

/**
 * 게이트 실행 결과
 */
export interface GateResult {
  name: GateType
  passed: boolean
  duration: number
  message?: string
}

/**
 * 전체 실행 요약
 */
export interface QualityGateSummary {
  passed: boolean
  totalGates: number
  passedGates: number
  failedGates: number
  totalDuration: number
  timestamp: Date
}

/**
 * 커버리지 검사 결과
 */
export interface CoverageResult {
  passed: boolean
  actual: number
  threshold: number
  message?: string
}

/**
 * 게이트 실행 순서
 */
const GATE_ORDER: GateType[] = [
  'architecture',
  'typeCheck',
  'lint',
  'unitTest',
  'integrationTest',
  'build',
  'security',
]

/**
 * 게이트 한국어 이름
 */
const GATE_DISPLAY_NAMES: Record<GateType, string> = {
  architecture: '아키텍처 검증',
  typeCheck: '타입 체크',
  lint: '린트 검사',
  unitTest: '단위 테스트',
  integrationTest: '통합 테스트',
  build: '빌드',
  security: '보안 검사',
}

/**
 * 품질 게이트 러너
 */
export class QualityGateRunner {
  private config: QualityGateConfig

  constructor(config: QualityGateConfig) {
    this.config = config
  }

  /**
   * 활성화된 게이트 목록 반환
   */
  getEnabledGates(): GateType[] {
    return GATE_ORDER.filter((gate) => {
      const gateConfig = this.config[gate as keyof QualityGateConfig]
      return typeof gateConfig === 'object' && gateConfig.enabled
    })
  }

  /**
   * 실행 순서 반환
   */
  getExecutionOrder(): GateType[] {
    return GATE_ORDER.filter((gate) => this.getEnabledGates().includes(gate))
  }

  /**
   * 개별 게이트 결과 생성
   */
  createGateResult(
    name: GateType,
    passed: boolean,
    duration: number,
    message?: string
  ): GateResult {
    return {
      name,
      passed,
      duration,
      message,
    }
  }

  /**
   * 전체 실행 요약 생성
   */
  createSummary(results: GateResult[]): QualityGateSummary {
    const passedGates = results.filter((r) => r.passed).length
    const failedGates = results.filter((r) => !r.passed).length
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

    return {
      passed: failedGates === 0,
      totalGates: results.length,
      passedGates,
      failedGates,
      totalDuration,
      timestamp: new Date(),
    }
  }

  /**
   * 실패 시 중단 여부
   */
  shouldStopOnFailure(): boolean {
    return this.config.stopOnFailure ?? false
  }

  /**
   * 커버리지 검사
   */
  checkCoverage(actual: number, threshold: number): CoverageResult {
    const passed = actual >= threshold

    return {
      passed,
      actual,
      threshold,
      message: passed
        ? `커버리지 ${actual}% (임계값: ${threshold}%)`
        : `커버리지 ${actual}%가 임계값 ${threshold}% 미만입니다.`,
    }
  }

  /**
   * 게이트 한국어 이름 반환
   */
  getGateDisplayName(gate: GateType | string): string {
    return GATE_DISPLAY_NAMES[gate as GateType] || gate
  }

  /**
   * 마크다운 보고서 생성
   */
  generateReport(results: GateResult[], summary: QualityGateSummary): string {
    const lines: string[] = []

    // 헤더
    lines.push('# 📊 품질 게이트 결과')
    lines.push('')

    // 요약
    const statusIcon = summary.passed ? '✅' : '❌'
    lines.push(`## ${statusIcon} 전체 결과: ${summary.passed ? '통과' : '실패'}`)
    lines.push('')
    lines.push(`- **통과**: ${summary.passedGates}/${summary.totalGates}`)
    lines.push(`- **실패**: ${summary.failedGates}`)
    lines.push(`- **총 소요 시간**: ${this.formatDuration(summary.totalDuration)}`)
    lines.push('')

    // 상세 결과
    lines.push('## 📋 상세 결과')
    lines.push('')
    lines.push('| 게이트 | 상태 | 소요 시간 | 메시지 |')
    lines.push('|--------|------|-----------|--------|')

    for (const result of results) {
      const icon = result.passed ? '✅' : '❌'
      const displayName = this.getGateDisplayName(result.name)
      const duration = this.formatDuration(result.duration)
      const message = result.message || '-'
      lines.push(`| ${displayName} | ${icon} | ${duration} | ${message} |`)
    }

    lines.push('')
    lines.push(`_생성 시간: ${summary.timestamp.toLocaleString('ko-KR')}_`)

    return lines.join('\n')
  }

  /**
   * 시간 포맷팅
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`
    }
    const seconds = (ms / 1000).toFixed(1)
    return `${seconds}s`
  }
}
