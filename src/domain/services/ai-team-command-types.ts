/**
 * @fileoverview AI 팀 명령어 관련 도메인 타입
 * 클린 아키텍처: 외부 의존성 없음
 */

/**
 * 명령어 유형 열거형
 */
export enum CommandType {
  // 기본 명령어
  STATUS = 'STATUS',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  BUG_REPORT = 'BUG_REPORT',
  VERIFY = 'VERIFY',
  DEPLOY = 'DEPLOY',
  REPORT = 'REPORT',

  // 정보 확인 명령어
  CHANGELOG = 'CHANGELOG',
  PROGRESS = 'PROGRESS',
  QUALITY = 'QUALITY',
  SECURITY = 'SECURITY',

  // 작업 명령어
  FIX = 'FIX',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  ROLLBACK = 'ROLLBACK',
  HELP = 'HELP',

  // 알 수 없는 명령어
  UNKNOWN = 'UNKNOWN',
}

/**
 * 보고서 유형
 */
export type ReportType = 'daily' | 'weekly' | 'monthly';

/**
 * 명령어 파라미터
 */
export interface CommandParameters {
  reportType?: ReportType;
  issueNumber?: number;
  description?: string;
}

/**
 * 명령어 처리 결과
 */
export interface CommandResult {
  success: boolean;
  commandType: CommandType;
  parameters?: CommandParameters;
  message?: string;
  error?: string;
  data?: unknown;
}

/**
 * 시스템 상태 정보
 */
export interface SystemStatus {
  build: {
    status: 'success' | 'failure' | 'pending';
    lastBuildTime?: Date;
  };
  tests: {
    passed: number;
    total: number;
    coverage: number;
  };
  security: {
    vulnerabilities: number;
    lastScanTime?: Date;
  };
  architecture: {
    compliant: boolean;
    violations: string[];
  };
  activeTasks: Array<{
    id: number;
    title: string;
    progress: number;
    stage: 'RED' | 'GREEN' | 'REFACTOR' | 'COMPLETE';
  }>;
  lastDeployment?: Date;
}

/**
 * 기능 요청 정보
 */
export interface FeatureRequest {
  title: string;
  description: string;
  architectureLayers: {
    domain: string[];
    application: string[];
    infrastructure: string[];
    presentation: string[];
  };
  tddPlan: {
    redTests: string[];
    greenImplementation: string[];
    refactorTasks: string[];
  };
  estimatedHours: number;
  planFilePath: string;
}

/**
 * 버그 리포트 정보
 */
export interface BugReport {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
}

/**
 * 품질 게이트 결과
 */
export interface QualityGateResult {
  passed: boolean;
  gates: Array<{
    name: string;
    passed: boolean;
    details: string;
    duration: number;
  }>;
  totalDuration: number;
}

/**
 * 보고서 데이터
 */
export interface ReportData {
  type: ReportType;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: string;
  changes: Array<{
    type: 'feature' | 'bugfix' | 'improvement';
    title: string;
    status: 'completed' | 'in-progress' | 'pending';
  }>;
  metrics: {
    testsAdded: number;
    coverage: number;
    tddCompliance: number;
    architectureCompliance: number;
  };
}

/**
 * 에이전트 유형
 */
export type AgentType =
  | 'pm'
  | 'qa'
  | 'security'
  | 'analytics'
  | 'developer'
  | 'architect'
  | 'documentation'
  | 'devops'
  | 'planner'
  | 'system';

/**
 * TDD 워크플로우 단계
 */
export type TDDStage = 'RED' | 'GREEN' | 'REFACTOR' | 'COMPLETE';

/**
 * TDD 워크플로우 정보
 */
export interface TDDWorkflow {
  stages: TDDStage[];
  currentStage: TDDStage;
  testFilePath?: string;
  implementationFilePath?: string;
}

/**
 * 명령어 라우팅 결과
 */
export interface CommandRoutingResult {
  success: boolean;
  agentType?: AgentType;
  action?: string;
  parameters?: CommandParameters;
  requiresApproval?: boolean;
  approvalReason?: string;
  requiresFeaturePlanner?: boolean;
  tddWorkflow?: TDDWorkflow;
  architectureValidation?: boolean;
  error?: string;
}

/**
 * TDD 워크플로우 전체 상태
 */
export interface TDDWorkflowState {
  id: string;
  featureDescription: string;
  currentStage: TDDStage;
  stages: TDDStage[];
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * TDD 단계 전환 결과
 */
export interface TDDStageTransitionResult {
  success: boolean;
  workflow?: TDDWorkflowState;
  error?: string;
}

/**
 * TDD 단계 가이드
 */
export interface TDDStageGuide {
  stage: TDDStage;
  instructions: string;
  checklist: string[];
}

/**
 * TDD 단계 검증 입력
 */
export interface TDDValidationInput {
  testsExist: boolean;
  testsPassing: boolean;
  coveragePercent?: number;
}

/**
 * TDD 단계 검증 결과
 */
export interface TDDValidationResult {
  canAdvance: boolean;
  warning?: string;
  errors?: string[];
}

/**
 * TDD 워크플로우 이력 항목
 */
export interface TDDHistoryEntry {
  stage: TDDStage;
  timestamp: Date;
  notes?: string;
}

// ============================================
// 자연어 의도 분류 관련 타입
// ============================================

/**
 * 신뢰도 임계값 설정
 */
export interface ConfidenceThresholds {
  /** >= 0.8: 즉시 실행 */
  high: number;
  /** 0.5 ~ 0.8: 확인 후 실행 */
  medium: number;
  /** < 0.5: 명확화 요청 */
  low: number;
}

/**
 * 기본 신뢰도 임계값
 */
export const DEFAULT_CONFIDENCE_THRESHOLDS: ConfidenceThresholds = {
  high: 0.8,
  medium: 0.5,
  low: 0.3,
};

/**
 * 의도 패턴 정의
 */
export interface IntentPattern {
  /** 대상 명령어 타입 */
  commandType: CommandType;
  /** 주요 키워드 (높은 가중치) */
  keywords: string[];
  /** 구문 패턴 (가장 높은 가중치) */
  phrases: string[];
  /** 제외 키워드 (점수 감소) */
  negativeKeywords?: string[];
  /** 맥락 단서 (낮은 가중치) */
  contextClues?: string[];
  /** 기본 가중치 */
  weight: number;
}

/**
 * 의도 분류 결과
 */
export interface IntentClassificationResult {
  /** 분류된 명령어 타입 */
  commandType: CommandType;
  /** 신뢰도 점수 (0.0 ~ 1.0) */
  confidence: number;
  /** 매칭된 패턴 목록 */
  matchedPatterns: string[];
  /** 사용자 확인 필요 여부 */
  requiresConfirmation: boolean;
  /** 확인 질문 (낮은 신뢰도 시) */
  suggestedQuestion?: string;
  /** 원본 입력 */
  originalInput: string;
  /** 추출된 파라미터 */
  parameters?: CommandParameters;
}

/**
 * 점수 계산 결과 (내부용)
 */
export interface IntentScoreResult {
  commandType: CommandType;
  score: number;
  matchedPatterns: string[];
}
