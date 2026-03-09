/**
 * @fileoverview Feature Planner 설정
 * 클린 아키텍처: Application 계층 - 기능 계획 설정 유스케이스
 *
 * 바투 AI 마케팅 솔루션에 특화된 Feature Planner 설정
 *
 * 역할:
 * - 기능 계획 생성
 * - 클린 아키텍처 계층별 작업 분해
 * - TDD 단계별 계획 생성
 * - 복잡도 분석
 * - 프로젝트 특화 템플릿 제공
 */

/**
 * 기능 계층
 */
export type FeatureLayer = 'domain' | 'application' | 'infrastructure' | 'presentation'

/**
 * 복잡도 레벨
 */
export type ComplexityLevel = 'low' | 'medium' | 'high'

/**
 * TDD 단계
 */
export type TDDStageType = 'RED' | 'GREEN' | 'REFACTOR'

/**
 * TDD 단계 상세 정보
 */
export interface TDDStep {
  stage: TDDStageType
  description: string
  files: string[]
  commands: string[]
  expectedOutcome: string
}

/**
 * 계층별 작업
 */
export interface LayerTasks {
  domain?: string[]
  application?: string[]
  infrastructure?: string[]
  presentation?: string[]
}

/**
 * 복잡도 분석 결과
 */
export interface ComplexityAnalysis {
  level: ComplexityLevel
  estimatedHours: number
  affectedLayers: FeatureLayer[]
  factors: string[]
}

/**
 * 기능 계획
 */
export interface FeaturePlan {
  id: string
  title: string
  layers: LayerTasks
  tddSteps: TDDStep[]
  complexity: ComplexityAnalysis
  requiresApproval: boolean
  approvalReasons: string[]
  createdAt: Date
}

/**
 * 계획 검증 결과
 */
export interface PlanValidation {
  isValid: boolean
  architectureCompliant: boolean
  tddComplete: boolean
  allLayersDefined: boolean
  errors: string[]
}

/**
 * 파일 경로 정보
 */
export interface FilePaths {
  entity?: string
  useCase?: string
  repository?: string
  component?: string
  test: string
}

/**
 * 프로젝트 템플릿
 */
export interface ProjectTemplate {
  domainEntities: string[]
  useCases: string[]
  apiEndpoints?: string[]
  infrastructureComponents?: string[]
  externalApis?: string[]
}

/**
 * 복잡도 키워드
 */
const COMPLEXITY_KEYWORDS = {
  high: [
    '데이터베이스',
    'database',
    '스키마',
    'schema',
    'API',
    '연동',
    'integration',
    'Meta',
    'OpenAI',
    '마이그레이션',
    'migration',
    '인증',
    'auth',
    '보안',
    'security',
  ],
  medium: [
    '목록',
    'list',
    '필터',
    'filter',
    '정렬',
    'sort',
    '검색',
    'search',
    '차트',
    'chart',
    '대시보드',
    'dashboard',
    '폼',
    'form',
  ],
  low: ['버튼', 'button', '텍스트', 'text', '스타일', 'style', '색상', 'color', '아이콘', 'icon'],
}

/**
 * 승인 필요 키워드
 */
const APPROVAL_KEYWORDS = {
  database_schema: ['데이터베이스', 'database', '스키마', 'schema', '마이그레이션', 'migration'],
  api_change: ['API', '엔드포인트', 'endpoint', '라우트', 'route'],
  security: ['보안', 'security', '인증', 'auth', '권한', 'permission'],
  new_library: ['라이브러리', 'library', '패키지', 'package', '의존성', 'dependency'],
}

/**
 * 계층 한국어 매핑
 */
const LAYER_KOREAN: Record<FeatureLayer, string> = {
  domain: '도메인',
  application: '애플리케이션',
  infrastructure: '인프라스트럭처',
  presentation: '프레젠테이션',
}

/**
 * 복잡도 한국어 매핑
 */
const COMPLEXITY_KOREAN: Record<ComplexityLevel, string> = {
  low: '간단',
  medium: '중간',
  high: '복잡',
}

/**
 * 프로젝트 특화 템플릿
 */
const PROJECT_TEMPLATES: Record<string, ProjectTemplate> = {
  campaign: {
    domainEntities: ['Campaign', 'CampaignStatus', 'CampaignType'],
    useCases: ['CreateCampaign', 'UpdateCampaign', 'ListCampaigns', 'FilterCampaigns'],
    apiEndpoints: ['/api/campaigns', '/api/campaigns/[id]'],
  },
  report: {
    domainEntities: ['Report', 'ReportPeriod', 'ReportMetrics'],
    useCases: ['GenerateReport', 'ExportReport', 'ScheduleReport'],
    apiEndpoints: ['/api/reports', '/api/reports/generate'],
  },
  kpi: {
    domainEntities: ['KPI', 'KPIValue', 'KPITarget'],
    useCases: ['CalculateKPI', 'TrackKPI', 'CompareKPIs'],
    apiEndpoints: ['/api/kpis', '/api/kpis/calculate'],
  },
  'meta-ads': {
    domainEntities: ['AdAccount', 'Campaign', 'AdSet', 'Ad'],
    useCases: ['SyncCampaigns', 'CreateAd', 'UpdateBudget'],
    infrastructureComponents: ['MetaAdsClient', 'MetaAdsRepository'],
    externalApis: ['Meta Marketing API', 'Meta Graph API'],
  },
}

/**
 * Feature Planner 설정 클래스
 */
export class FeaturePlannerConfig {
  private planCounter = 0

  /**
   * 기능 계획 생성
   */
  createPlan(description: string): FeaturePlan {
    const id = this.generatePlanId()
    const complexity = this.analyzeComplexity(description)
    const approvalInfo = this.checkApprovalRequirements(description)

    const plan: FeaturePlan = {
      id,
      title: description,
      layers: this.generateLayerTasks(description, complexity),
      tddSteps: this.generateAllTDDSteps(description),
      complexity,
      requiresApproval: approvalInfo.required,
      approvalReasons: approvalInfo.reasons,
      createdAt: new Date(),
    }

    return plan
  }

  /**
   * 복잡도 분석
   */
  analyzeComplexity(description: string): ComplexityAnalysis {
    const lowerDesc = description.toLowerCase()
    const affectedLayers: FeatureLayer[] = []
    const factors: string[] = []

    // 고복잡도 키워드 체크
    let highCount = 0
    for (const keyword of COMPLEXITY_KEYWORDS.high) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        highCount++
        factors.push(keyword)
      }
    }

    // 중복잡도 키워드 체크
    let mediumCount = 0
    for (const keyword of COMPLEXITY_KEYWORDS.medium) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        mediumCount++
      }
    }

    // 저복잡도 키워드 체크
    let lowCount = 0
    for (const keyword of COMPLEXITY_KEYWORDS.low) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        lowCount++
      }
    }

    // 영향받는 계층 결정
    if (
      lowerDesc.includes('데이터베이스') ||
      lowerDesc.includes('database') ||
      lowerDesc.includes('마이그레이션')
    ) {
      affectedLayers.push('infrastructure')
    }
    if (lowerDesc.includes('api') || lowerDesc.includes('엔드포인트')) {
      affectedLayers.push('application')
    }
    if (lowerDesc.includes('ui') || lowerDesc.includes('컴포넌트') || lowerDesc.includes('버튼')) {
      affectedLayers.push('presentation')
    }
    if (
      lowerDesc.includes('도메인') ||
      lowerDesc.includes('비즈니스') ||
      lowerDesc.includes('엔티티')
    ) {
      affectedLayers.push('domain')
    }

    // 복잡도 레벨 결정
    let level: ComplexityLevel
    let estimatedHours: number

    if (highCount >= 2 || (highCount >= 1 && description.length > 50)) {
      level = 'high'
      estimatedHours = 12 + highCount * 2
    } else if (highCount >= 1 || mediumCount >= 2) {
      level = 'medium'
      estimatedHours = 4 + mediumCount
    } else {
      level = 'low'
      estimatedHours = 1 + lowCount * 0.5
    }

    return {
      level,
      estimatedHours,
      affectedLayers,
      factors,
    }
  }

  /**
   * 계층별 파일 경로 생성
   */
  generateFilePaths(name: string, layer: FeatureLayer): FilePaths {
    const kebabName = this.toKebabCase(name)

    switch (layer) {
      case 'domain':
        return {
          entity: `src/domain/entities/${kebabName}.ts`,
          test: `tests/unit/domain/entities/${kebabName}.test.ts`,
        }
      case 'application':
        return {
          useCase: `src/application/use-cases/${kebabName}.ts`,
          test: `tests/unit/application/use-cases/${kebabName}.test.ts`,
        }
      case 'infrastructure':
        return {
          repository: `src/infrastructure/database/${kebabName}.ts`,
          test: `tests/integration/database/${kebabName}.test.ts`,
        }
      case 'presentation':
        return {
          component: `src/presentation/components/${kebabName}.tsx`,
          test: `tests/unit/presentation/components/${kebabName}.test.tsx`,
        }
    }
  }

  /**
   * TDD 단계 상세 생성
   */
  generateTDDStep(stage: TDDStageType, featureName: string): TDDStep {
    const kebabName = this.toKebabCase(featureName)

    switch (stage) {
      case 'RED':
        return {
          stage: 'RED',
          description: `실패하는 테스트 먼저 작성: ${featureName}`,
          files: [`tests/unit/application/use-cases/${kebabName}.test.ts`],
          commands: ['npm test'],
          expectedOutcome: '테스트가 실패해야 함 (RED 상태 확인)',
        }
      case 'GREEN':
        return {
          stage: 'GREEN',
          description: `최소 구현으로 테스트 통과: ${featureName}`,
          files: [`src/application/use-cases/${kebabName}.ts`],
          commands: ['npm test'],
          expectedOutcome: '테스트 통과 확인',
        }
      case 'REFACTOR':
        return {
          stage: 'REFACTOR',
          description: `코드 정리 및 리팩토링: ${featureName}`,
          files: [
            `src/application/use-cases/${kebabName}.ts`,
            `tests/unit/application/use-cases/${kebabName}.test.ts`,
          ],
          commands: ['npm test', 'npm run lint'],
          expectedOutcome: '테스트 유지하며 코드 품질 개선',
        }
    }
  }

  /**
   * 프로젝트 특화 템플릿 조회
   */
  getTemplate(templateName: string): ProjectTemplate {
    return (
      PROJECT_TEMPLATES[templateName] || {
        domainEntities: [],
        useCases: [],
      }
    )
  }

  /**
   * 계획 검증
   */
  validatePlan(plan: FeaturePlan): PlanValidation {
    const errors: string[] = []

    // 계층 정의 확인
    const allLayersDefined =
      plan.layers.domain !== undefined ||
      plan.layers.application !== undefined ||
      plan.layers.infrastructure !== undefined ||
      plan.layers.presentation !== undefined

    // TDD 완전성 확인
    const tddComplete =
      plan.tddSteps.length >= 3 &&
      plan.tddSteps.some((s) => s.stage === 'RED') &&
      plan.tddSteps.some((s) => s.stage === 'GREEN') &&
      plan.tddSteps.some((s) => s.stage === 'REFACTOR')

    // 아키텍처 준수 확인 (기본적으로 true, 실제 검증은 architecture-validator가 담당)
    const architectureCompliant = true

    if (!allLayersDefined) {
      errors.push('최소 하나 이상의 계층이 정의되어야 합니다')
    }

    if (!tddComplete) {
      errors.push('TDD 단계(RED, GREEN, REFACTOR)가 모두 포함되어야 합니다')
    }

    return {
      isValid: errors.length === 0,
      architectureCompliant,
      tddComplete,
      allLayersDefined,
      errors,
    }
  }

  /**
   * 계획서 마크다운 생성
   */
  generateMarkdown(plan: FeaturePlan): string {
    const lines: string[] = []

    lines.push(`# 📋 기능: ${plan.title}`)
    lines.push('')
    lines.push(`- **계획 ID**: ${plan.id}`)
    lines.push(`- **생성일**: ${plan.createdAt.toISOString().split('T')[0]}`)
    lines.push(`- **복잡도**: ${this.getComplexityKorean(plan.complexity.level)}`)
    lines.push(`- **예상 작업 시간**: ${plan.complexity.estimatedHours}시간`)
    lines.push('')

    // 클린 아키텍처 분석
    lines.push('## 🏗️ 클린 아키텍처 분석')
    lines.push('')

    if (plan.layers.domain?.length) {
      lines.push(`### Domain 계층`)
      plan.layers.domain.forEach((task) => lines.push(`- ${task}`))
      lines.push('')
    }

    if (plan.layers.application?.length) {
      lines.push(`### Application 계층`)
      plan.layers.application.forEach((task) => lines.push(`- ${task}`))
      lines.push('')
    }

    if (plan.layers.infrastructure?.length) {
      lines.push(`### Infrastructure 계층`)
      plan.layers.infrastructure.forEach((task) => lines.push(`- ${task}`))
      lines.push('')
    }

    if (plan.layers.presentation?.length) {
      lines.push(`### Presentation 계층`)
      plan.layers.presentation.forEach((task) => lines.push(`- ${task}`))
      lines.push('')
    }

    // TDD 계획
    lines.push('## 🔴🟢🔵 TDD 계획')
    lines.push('')

    for (const step of plan.tddSteps) {
      const emoji = step.stage === 'RED' ? '🔴' : step.stage === 'GREEN' ? '🟢' : '🔵'
      lines.push(`### ${emoji} ${step.stage}`)
      lines.push('')
      lines.push(`**설명**: ${step.description}`)
      lines.push('')
      lines.push('**파일**:')
      step.files.forEach((file) => lines.push(`- \`${file}\``))
      lines.push('')
      lines.push('**명령어**:')
      step.commands.forEach((cmd) => lines.push(`- \`${cmd}\``))
      lines.push('')
      lines.push(`**예상 결과**: ${step.expectedOutcome}`)
      lines.push('')
    }

    // 파일 경로
    lines.push('## 📁 파일 경로')
    lines.push('')
    lines.push('### src/')
    lines.push('- `src/application/use-cases/` - 유스케이스')
    lines.push('- `src/domain/entities/` - 엔티티')
    lines.push('')
    lines.push('### tests/')
    lines.push('- `tests/unit/` - 단위 테스트')
    lines.push('- `tests/integration/` - 통합 테스트')
    lines.push('')

    // 승인 필요 여부
    if (plan.requiresApproval) {
      lines.push('## ⚠️ 승인 필요')
      lines.push('')
      plan.approvalReasons.forEach((reason) => lines.push(`- ${reason}`))
      lines.push('')
    }

    return lines.join('\n')
  }

  /**
   * 계획 파일 저장 경로 생성
   */
  getPlanSavePath(plan: FeaturePlan): string {
    const kebabTitle = this.toKebabCase(plan.title)
    // 한글 제거하고 영문/숫자만 남기기
    const sanitized = kebabTitle
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    const filename = sanitized || 'feature'
    return `docs/plans/PLAN_${filename}.md`
  }

  /**
   * 복잡도 한국어 변환
   */
  getComplexityKorean(level: ComplexityLevel): string {
    return COMPLEXITY_KOREAN[level] || level
  }

  /**
   * 계층 한국어 변환
   */
  getLayerKorean(layer: FeatureLayer): string {
    return LAYER_KOREAN[layer] || layer
  }

  /**
   * 계층별 작업 생성
   */
  private generateLayerTasks(description: string, complexity: ComplexityAnalysis): LayerTasks {
    // 모든 계층에 기본 작업 생성 (클린 아키텍처 완전성 보장)
    const tasks: LayerTasks = {
      domain: ['비즈니스 로직 정의'],
      application: ['유스케이스 구현'],
      infrastructure: ['리포지토리/어댑터 구현'],
      presentation: ['UI 컴포넌트 구현'],
    }

    // 복잡도에 따라 추가 작업 생성
    if (complexity.level === 'high' || complexity.affectedLayers.includes('domain')) {
      tasks.domain = ['비즈니스 로직 정의', '엔티티 설계', '값 객체 정의']
    }

    if (complexity.level === 'high' || complexity.affectedLayers.includes('infrastructure')) {
      tasks.infrastructure = ['리포지토리 구현', '외부 API 어댑터']
    }

    return tasks
  }

  /**
   * 전체 TDD 단계 생성
   */
  private generateAllTDDSteps(description: string): TDDStep[] {
    const featureName = this.extractFeatureName(description)

    return [
      this.generateTDDStep('RED', featureName),
      this.generateTDDStep('GREEN', featureName),
      this.generateTDDStep('REFACTOR', featureName),
    ]
  }

  /**
   * 승인 필요 여부 확인
   */
  private checkApprovalRequirements(description: string): {
    required: boolean
    reasons: string[]
  } {
    const lowerDesc = description.toLowerCase()
    const reasons: string[] = []

    for (const [reason, keywords] of Object.entries(APPROVAL_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerDesc.includes(keyword.toLowerCase())) {
          if (!reasons.includes(reason)) {
            reasons.push(reason)
          }
          break
        }
      }
    }

    return {
      required: reasons.length > 0,
      reasons,
    }
  }

  /**
   * 기능 이름 추출
   */
  private extractFeatureName(description: string): string {
    // 간단한 추출 로직 - 첫 10단어 이내
    const words = description.split(' ').slice(0, 5)
    return words.join(' ')
  }

  /**
   * kebab-case 변환
   */
  private toKebabCase(str: string): string {
    return (
      str
        // PascalCase/camelCase를 분리
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
    )
  }

  /**
   * 계획 ID 생성
   */
  private generatePlanId(): string {
    this.planCounter++
    const timestamp = Date.now()
    return `plan-${timestamp}-${this.planCounter}`
  }
}
