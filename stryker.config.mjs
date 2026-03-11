// @ts-check

/**
 * Stryker Mutation Testing 설정
 *
 * 핵심 도메인 엔티티 (Campaign, KPI, Report)와 주요 use case에 대해
 * mutation testing을 수행합니다.
 *
 * 실행: npm run test:mutation
 *
 * 참고: https://stryker-mutator.io/docs/stryker-js/configuration/
 */

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  // ─── 기본 설정 ────────────────────────────────────────────────────────
  packageManager: 'npm',
  testRunner: 'vitest',
  reporters: ['html', 'clear-text', 'progress'],

  // ─── Mutation 대상: 핵심 도메인 + Use Cases ─────────────────────────
  mutate: [
    // Domain Entities (핵심)
    'src/domain/entities/Campaign.ts',
    'src/domain/entities/KPI.ts',
    'src/domain/entities/Report.ts',

    // Domain Value Objects
    'src/domain/value-objects/**/*.ts',
    '!src/domain/value-objects/index.ts',

    // Domain Errors
    'src/domain/errors/**/*.ts',
    '!src/domain/errors/index.ts',

    // Use Cases (핵심 비즈니스 로직)
    'src/application/use-cases/campaign/CreateCampaignUseCase.ts',
    'src/application/use-cases/campaign/GetCampaignUseCase.ts',
    'src/application/use-cases/campaign/ListCampaignsUseCase.ts',
    'src/application/use-cases/campaign/UpdateCampaignUseCase.ts',
    'src/application/use-cases/campaign/DeleteCampaignUseCase.ts',
    'src/application/use-cases/kpi/GetDashboardKPIUseCase.ts',
    'src/application/use-cases/kpi/SyncMetaInsightsUseCase.ts',
    'src/application/use-cases/report/GenerateWeeklyReportUseCase.ts',

    // 제외: 인터페이스, 타입, index
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],

  // ─── Vitest 설정 ─────────────────────────────────────────────────────
  vitest: {
    configFile: 'vitest.config.ts',
    dir: 'tests/',
  },

  // ─── 임계값 ──────────────────────────────────────────────────────────
  thresholds: {
    high: 80,
    low: 60,
    break: 50,   // 50% 미만이면 빌드 실패
  },

  // ─── 성능 최적화 ─────────────────────────────────────────────────────
  concurrency: 4,
  timeoutMS: 30000,
  timeoutFactor: 2.5,

  // ─── TypeScript ──────────────────────────────────────────────────────
  tsconfigFile: 'tsconfig.json',

  // ─── 무시할 Mutator ──────────────────────────────────────────────────
  // 로깅, 디버그 코드 등 mutation 가치가 낮은 것들
  ignoreMutators: [
    'StringLiteral',  // 문자열 리터럴 변경은 노이즈가 많음
  ],

  // ─── 결과 리포트 ─────────────────────────────────────────────────────
  htmlReporter: {
    fileName: 'reports/mutation/index.html',
  },

  // ─── 증분 모드 (반복 실행 시 빠름) ────────────────────────────────────
  incremental: true,
  incrementalFile: '.stryker-tmp/incremental.json',

  // ─── 정리 ────────────────────────────────────────────────────────────
  cleanTempDir: true,
}

export default config
