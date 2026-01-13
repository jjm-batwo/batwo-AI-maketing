/**
 * @fileoverview 보고서 생성기
 * 클린 아키텍처: Application 계층 - 보고서 생성 자동화
 *
 * 역할:
 * - 일일 개발 요약 보고서
 * - 주간 진행 보고서
 * - 장애 보고서
 * - TDD 준수 보고서
 */

/**
 * 변경 유형
 */
export type ChangeType = 'feature' | 'bugfix' | 'refactor' | 'docs' | 'test' | 'security';

/**
 * 변경 항목
 */
export interface ChangeItem {
  description: string;
  type: ChangeType;
}

/**
 * 품질 메트릭
 */
export interface QualityMetrics {
  testsTotal: number;
  testsPassed: number;
  buildSuccess: boolean;
  securityIssues: number;
}

/**
 * TDD 준수 메트릭
 */
export interface TDDMetrics {
  totalFeatures: number;
  tddCompliant: number;
  complianceRate: number;
}

/**
 * 일일 보고서 데이터
 */
export interface DailyReportData {
  date: Date;
  changes: ChangeItem[];
  quality: QualityMetrics;
  tddCompliance: TDDMetrics;
  nextPlan?: string;
}

/**
 * 목표 항목
 */
export interface GoalItem {
  description: string;
  completed: boolean;
}

/**
 * 주간 품질 메트릭
 */
export interface WeeklyQualityMetrics {
  coverageStart: number;
  coverageEnd: number;
  bugsFound: number;
  bugsFixed: number;
}

/**
 * 주간 보고서 데이터
 */
export interface WeeklyReportData {
  weekStart: Date;
  weekEnd: Date;
  goals: GoalItem[];
  completedTasks: string[];
  inProgressTasks: string[];
  delayedTasks: string[];
  qualityMetrics: WeeklyQualityMetrics;
  tddCompliance: TDDMetrics;
  nextWeekPlan: string[];
}

/**
 * 심각도 레벨
 */
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * 장애 보고서 데이터
 */
export interface IncidentReportData {
  incidentTime: Date;
  recoveryTime: Date;
  severity: SeverityLevel;
  description: string;
  rootCause: string;
  actions: string[];
  prevention: string[];
}

/**
 * TDD 기능 준수 상태
 */
export interface TDDFeatureCompliance {
  name: string;
  redPhase: boolean;
  greenPhase: boolean;
  refactorPhase: boolean;
}

/**
 * TDD 준수 보고서 데이터
 */
export interface TDDComplianceData {
  period: { start: Date; end: Date };
  features: TDDFeatureCompliance[];
  overallCompliance: number;
  recommendations: string[];
}

/**
 * 변경 유형 한국어 맵핑
 */
const CHANGE_TYPE_KOREAN: Record<ChangeType, string> = {
  feature: '기능 추가',
  bugfix: '버그 수정',
  refactor: '리팩토링',
  docs: '문서 수정',
  test: '테스트 추가',
  security: '보안 수정',
};

/**
 * 심각도 아이콘
 */
const SEVERITY_ICONS: Record<SeverityLevel, string> = {
  low: '🟡',
  medium: '🟠',
  high: '🔴',
  critical: '🔴',
};

/**
 * 보고서 생성기
 */
export class ReportGenerator {
  /**
   * 일일 보고서 생성
   */
  generateDailyReport(data: DailyReportData): string {
    const lines: string[] = [];

    // 헤더
    lines.push(`📊 바투 AI 일일 개발 요약 - ${this.formatDate(data.date)}`);
    lines.push('');

    // 변경 사항
    if (data.changes.length > 0) {
      lines.push('✅ 오늘의 변경 사항');
      for (const change of data.changes) {
        const typeKorean = this.getChangeTypeKorean(change.type);
        lines.push(`- [${typeKorean}] ${change.description}`);
      }
    } else {
      lines.push('📝 변경 사항 없음');
    }
    lines.push('');

    // 품질 검증
    const qualityIcon = this.getQualityIcon(data.quality);
    lines.push(`${qualityIcon} 품질 검증: ${data.quality.buildSuccess ? '모두 통과' : '일부 실패'}`);
    lines.push(`- 테스트: ${data.quality.testsPassed}/${data.quality.testsTotal} ${data.quality.testsPassed === data.quality.testsTotal ? '✅' : '⚠️'}`);
    lines.push(`- 빌드: ${data.quality.buildSuccess ? '성공 ✅' : '실패 ⚠️'}`);

    if (data.quality.securityIssues > 0) {
      lines.push(`- 보안: ${data.quality.securityIssues}개 이슈 ⚠️`);
    }
    lines.push('');

    // TDD 준수율
    lines.push(`🔴🟢🔵 TDD 준수율: ${data.tddCompliance.complianceRate}% (${data.tddCompliance.tddCompliant}/${data.tddCompliance.totalFeatures})`);
    lines.push('');

    // 다음 계획
    if (data.nextPlan) {
      lines.push(`📅 내일 예정: ${data.nextPlan}`);
    }

    return lines.join('\n');
  }

  /**
   * 주간 보고서 생성
   */
  generateWeeklyReport(data: WeeklyReportData): string {
    const lines: string[] = [];

    // 헤더
    lines.push(`📊 바투 AI 주간 진행 보고서`);
    lines.push(`기간: ${this.formatPeriod(data.weekStart, data.weekEnd)}`);
    lines.push('');

    // 목표 달성률
    const completedGoals = data.goals.filter((g) => g.completed).length;
    const totalGoals = data.goals.length;
    const achievementRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 100;

    lines.push(`🎯 목표 달성률: ${achievementRate}% (${completedGoals}/${totalGoals})`);
    lines.push('');

    // 목표 상세
    if (data.goals.length > 0) {
      lines.push('### 주간 목표');
      for (const goal of data.goals) {
        const icon = goal.completed ? '✅' : '❌';
        lines.push(`- ${icon} ${goal.description}`);
      }
      lines.push('');
    }

    // 완료된 작업
    if (data.completedTasks.length > 0) {
      lines.push('### ✅ 완료된 작업');
      for (const task of data.completedTasks) {
        lines.push(`- ${task}`);
      }
      lines.push('');
    }

    // 진행 중인 작업
    if (data.inProgressTasks.length > 0) {
      lines.push('### 🔄 진행 중인 작업');
      for (const task of data.inProgressTasks) {
        lines.push(`- ${task}`);
      }
      lines.push('');
    }

    // 지연된 작업
    if (data.delayedTasks.length > 0) {
      lines.push('### ⚠️ 지연된 작업');
      for (const task of data.delayedTasks) {
        lines.push(`- ${task}`);
      }
      lines.push('');
    }

    // 품질 지표
    const coverageChange = data.qualityMetrics.coverageEnd - data.qualityMetrics.coverageStart;
    const changeSign = coverageChange >= 0 ? '+' : '';

    lines.push('### 📈 품질 지표');
    lines.push(`- 커버리지: ${data.qualityMetrics.coverageStart}% → ${data.qualityMetrics.coverageEnd}% (${changeSign}${coverageChange}%)`);
    lines.push(`- 발견된 버그: ${data.qualityMetrics.bugsFound}개`);
    lines.push(`- 수정된 버그: ${data.qualityMetrics.bugsFixed}개`);
    lines.push('');

    // TDD 준수율
    lines.push(`🔴🟢🔵 TDD 준수율: ${data.tddCompliance.complianceRate}%`);
    lines.push('');

    // 다음 주 계획
    if (data.nextWeekPlan.length > 0) {
      lines.push('### 📅 다음 주 계획');
      for (const plan of data.nextWeekPlan) {
        lines.push(`- ${plan}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 장애 보고서 생성
   */
  generateIncidentReport(data: IncidentReportData): string {
    const lines: string[] = [];

    const severityIcon = SEVERITY_ICONS[data.severity];
    const recoveryDuration = this.calculateDuration(data.incidentTime, data.recoveryTime);

    // 헤더
    lines.push(`🚨 장애 보고서`);
    lines.push('');

    // 요약
    lines.push(`## ${severityIcon} ${data.description}`);
    lines.push('');
    lines.push(`- **심각도**: ${this.getSeverityKorean(data.severity)}`);
    lines.push(`- **발생 시간**: ${this.formatDateTime(data.incidentTime)}`);
    lines.push(`- **복구 시간**: ${this.formatDateTime(data.recoveryTime)}`);
    lines.push(`- **복구 소요**: ${recoveryDuration}`);
    lines.push('');

    // 원인 분석
    lines.push('### 📋 원인 분석');
    lines.push(data.rootCause);
    lines.push('');

    // 조치 사항
    lines.push('### 🔧 조치 사항');
    for (const action of data.actions) {
      lines.push(`- ${action}`);
    }
    lines.push('');

    // 재발 방지
    lines.push('### 🛡️ 재발 방지책');
    for (const prevention of data.prevention) {
      lines.push(`- ${prevention}`);
    }

    return lines.join('\n');
  }

  /**
   * TDD 준수 보고서 생성
   */
  generateTDDComplianceReport(data: TDDComplianceData): string {
    const lines: string[] = [];

    // 헤더
    lines.push('🔴🟢🔵 TDD 준수 보고서');
    lines.push(`기간: ${this.formatPeriod(data.period.start, data.period.end)}`);
    lines.push('');

    // 전체 준수율
    lines.push(`## 전체 준수율: ${data.overallCompliance}%`);
    lines.push('');

    // 기능별 상세
    if (data.features.length > 0) {
      lines.push('### 기능별 TDD 준수 현황');
      lines.push('');
      lines.push('| 기능 | 🔴 RED | 🟢 GREEN | 🔵 REFACTOR |');
      lines.push('|------|--------|----------|-------------|');

      for (const feature of data.features) {
        const redIcon = feature.redPhase ? '✅' : '❌';
        const greenIcon = feature.greenPhase ? '✅' : '❌';
        const refactorIcon = feature.refactorPhase ? '✅' : '❌';
        lines.push(`| ${feature.name} | 🔴 ${redIcon} | 🟢 ${greenIcon} | 🔵 ${refactorIcon} |`);
      }
      lines.push('');
    }

    // 권장 사항
    if (data.recommendations.length > 0) {
      lines.push('### 📝 권장 사항');
      for (const rec of data.recommendations) {
        lines.push(`- ${rec}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 날짜 포맷팅
   */
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 기간 포맷팅
   */
  formatPeriod(start: Date, end: Date): string {
    return `${this.formatDate(start)} ~ ${this.formatDate(end)}`;
  }

  /**
   * 날짜/시간 포맷팅
   */
  private formatDateTime(date: Date): string {
    const dateStr = this.formatDate(date);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${dateStr} ${hours}:${minutes}`;
  }

  /**
   * 변경 유형 한국어 변환
   */
  getChangeTypeKorean(type: ChangeType | string): string {
    return CHANGE_TYPE_KOREAN[type as ChangeType] || type;
  }

  /**
   * 심각도 한국어 변환
   */
  private getSeverityKorean(severity: SeverityLevel): string {
    const map: Record<SeverityLevel, string> = {
      low: '낮음',
      medium: '중간',
      high: '높음',
      critical: '심각',
    };
    return map[severity];
  }

  /**
   * 품질 아이콘 결정
   */
  private getQualityIcon(quality: QualityMetrics): string {
    if (!quality.buildSuccess || quality.testsPassed < quality.testsTotal) {
      return '⚠️';
    }
    if (quality.securityIssues > 0) {
      return '🔶';
    }
    return '🧪';
  }

  /**
   * 기간 계산 (분 단위 → 읽기 쉬운 형식)
   */
  private calculateDuration(start: Date, end: Date): string {
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes}분`;
    }

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (minutes === 0) {
      return `${hours}시간`;
    }

    return `${hours}시간 ${minutes}분`;
  }
}
