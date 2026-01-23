/**
 * @fileoverview 보고서 생성기 테스트
 * TDD RED 단계: 실패하는 테스트 먼저 작성
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ReportGenerator,
  DailyReportData,
  WeeklyReportData,
  IncidentReportData,
  TDDComplianceData,
} from '@/application/use-cases/ai-team/report-generator';

describe('ReportGenerator', () => {
  let generator: ReportGenerator;

  beforeEach(() => {
    generator = new ReportGenerator();
  });

  describe('일일 보고서', () => {
    it('일일 요약 보고서를 생성해야 함', () => {
      const data: DailyReportData = {
        date: new Date('2026-01-09'),
        changes: [
          { description: '캠페인 목록 정렬 기능 추가', type: 'feature' },
          { description: 'KPI 계산 버그 수정', type: 'bugfix' },
        ],
        quality: {
          testsTotal: 263,
          testsPassed: 263,
          buildSuccess: true,
          securityIssues: 0,
        },
        tddCompliance: {
          totalFeatures: 5,
          tddCompliant: 5,
          complianceRate: 100,
        },
        nextPlan: '주간 보고서 기능 개선',
      };

      const report = generator.generateDailyReport(data);

      expect(report).toContain('📊 바투 AI 일일 개발 요약');
      expect(report).toContain('2026-01-09');
      expect(report).toContain('캠페인 목록 정렬 기능 추가');
      expect(report).toContain('테스트: 263/263');
      expect(report).toContain('빌드: 성공');
    });

    it('변경 사항이 없으면 표시해야 함', () => {
      const data: DailyReportData = {
        date: new Date('2026-01-09'),
        changes: [],
        quality: {
          testsTotal: 263,
          testsPassed: 263,
          buildSuccess: true,
          securityIssues: 0,
        },
        tddCompliance: {
          totalFeatures: 0,
          tddCompliant: 0,
          complianceRate: 100,
        },
      };

      const report = generator.generateDailyReport(data);

      expect(report).toContain('변경 사항 없음');
    });

    it('빌드 실패 시 경고를 표시해야 함', () => {
      const data: DailyReportData = {
        date: new Date('2026-01-09'),
        changes: [],
        quality: {
          testsTotal: 263,
          testsPassed: 260,
          buildSuccess: false,
          securityIssues: 0,
        },
        tddCompliance: {
          totalFeatures: 0,
          tddCompliant: 0,
          complianceRate: 100,
        },
      };

      const report = generator.generateDailyReport(data);

      expect(report).toContain('⚠️');
      expect(report).toContain('빌드: 실패');
    });

    it('TDD 준수율을 표시해야 함', () => {
      const data: DailyReportData = {
        date: new Date('2026-01-09'),
        changes: [{ description: '기능 추가', type: 'feature' }],
        quality: {
          testsTotal: 100,
          testsPassed: 100,
          buildSuccess: true,
          securityIssues: 0,
        },
        tddCompliance: {
          totalFeatures: 10,
          tddCompliant: 8,
          complianceRate: 80,
        },
      };

      const report = generator.generateDailyReport(data);

      expect(report).toContain('TDD 준수율: 80%');
    });
  });

  describe('주간 보고서', () => {
    it('주간 진행 보고서를 생성해야 함', () => {
      const data: WeeklyReportData = {
        weekStart: new Date('2026-01-06'),
        weekEnd: new Date('2026-01-12'),
        goals: [
          { description: '캠페인 관리 개선', completed: true },
          { description: 'KPI 대시보드 구현', completed: true },
          { description: '주간 보고서 자동화', completed: false },
        ],
        completedTasks: [
          '캠페인 CRUD API 완성',
          '대시보드 차트 추가',
          '모바일 반응형 개선',
        ],
        inProgressTasks: ['주간 보고서 기능'],
        delayedTasks: [],
        qualityMetrics: {
          coverageStart: 90,
          coverageEnd: 95,
          bugsFound: 3,
          bugsFixed: 5,
        },
        tddCompliance: {
          totalFeatures: 15,
          tddCompliant: 14,
          complianceRate: 93,
        },
        nextWeekPlan: ['사용자 인증 강화', '성능 최적화'],
      };

      const report = generator.generateWeeklyReport(data);

      expect(report).toContain('📊 바투 AI 주간 진행 보고서');
      expect(report).toContain('2026-01-06');
      expect(report).toContain('목표 달성률');
      expect(report).toContain('캠페인 CRUD API 완성');
    });

    it('목표 달성률을 계산해야 함', () => {
      const data: WeeklyReportData = {
        weekStart: new Date('2026-01-06'),
        weekEnd: new Date('2026-01-12'),
        goals: [
          { description: '목표1', completed: true },
          { description: '목표2', completed: true },
          { description: '목표3', completed: false },
          { description: '목표4', completed: false },
        ],
        completedTasks: [],
        inProgressTasks: [],
        delayedTasks: [],
        qualityMetrics: {
          coverageStart: 90,
          coverageEnd: 92,
          bugsFound: 2,
          bugsFixed: 2,
        },
        tddCompliance: {
          totalFeatures: 4,
          tddCompliant: 4,
          complianceRate: 100,
        },
        nextWeekPlan: [],
      };

      const report = generator.generateWeeklyReport(data);

      expect(report).toContain('50%'); // 2/4 = 50%
    });

    it('커버리지 변화를 표시해야 함', () => {
      const data: WeeklyReportData = {
        weekStart: new Date('2026-01-06'),
        weekEnd: new Date('2026-01-12'),
        goals: [],
        completedTasks: [],
        inProgressTasks: [],
        delayedTasks: [],
        qualityMetrics: {
          coverageStart: 85,
          coverageEnd: 95,
          bugsFound: 0,
          bugsFixed: 0,
        },
        tddCompliance: {
          totalFeatures: 0,
          tddCompliant: 0,
          complianceRate: 100,
        },
        nextWeekPlan: [],
      };

      const report = generator.generateWeeklyReport(data);

      expect(report).toContain('85%');
      expect(report).toContain('95%');
      expect(report).toContain('+10%'); // 증가량
    });

    it('지연된 작업을 강조해야 함', () => {
      const data: WeeklyReportData = {
        weekStart: new Date('2026-01-06'),
        weekEnd: new Date('2026-01-12'),
        goals: [],
        completedTasks: [],
        inProgressTasks: [],
        delayedTasks: ['중요 기능 A', '중요 기능 B'],
        qualityMetrics: {
          coverageStart: 90,
          coverageEnd: 90,
          bugsFound: 0,
          bugsFixed: 0,
        },
        tddCompliance: {
          totalFeatures: 0,
          tddCompliant: 0,
          complianceRate: 100,
        },
        nextWeekPlan: [],
      };

      const report = generator.generateWeeklyReport(data);

      expect(report).toContain('⚠️ 지연된 작업');
      expect(report).toContain('중요 기능 A');
    });
  });

  describe('장애 보고서', () => {
    it('장애 보고서를 생성해야 함', () => {
      const data: IncidentReportData = {
        incidentTime: new Date('2026-01-09T14:30:00'),
        recoveryTime: new Date('2026-01-09T15:15:00'),
        severity: 'high',
        description: 'API 서버 다운',
        rootCause: '메모리 누수로 인한 서버 크래시',
        actions: ['서버 재시작', '메모리 누수 코드 수정', '모니터링 알림 추가'],
        prevention: ['메모리 사용량 모니터링 강화', '자동 재시작 설정'],
      };

      const report = generator.generateIncidentReport(data);

      expect(report).toContain('🚨 장애 보고서');
      expect(report).toContain('API 서버 다운');
      expect(report).toContain('45분'); // 복구 시간
      expect(report).toContain('메모리 누수');
    });

    it('심각도에 따라 다른 아이콘을 사용해야 함', () => {
      const lowData: IncidentReportData = {
        incidentTime: new Date('2026-01-09T14:30:00'),
        recoveryTime: new Date('2026-01-09T14:45:00'),
        severity: 'low',
        description: '마이너 버그',
        rootCause: '타이포',
        actions: ['수정'],
        prevention: ['코드 리뷰'],
      };

      const criticalData: IncidentReportData = {
        incidentTime: new Date('2026-01-09T14:30:00'),
        recoveryTime: new Date('2026-01-09T18:00:00'),
        severity: 'critical',
        description: '데이터 손실',
        rootCause: '백업 실패',
        actions: ['복구'],
        prevention: ['백업 이중화'],
      };

      const lowReport = generator.generateIncidentReport(lowData);
      const criticalReport = generator.generateIncidentReport(criticalData);

      expect(lowReport).toContain('🟡'); // 낮음
      expect(criticalReport).toContain('🔴'); // 심각
    });

    it('복구 시간을 계산해야 함', () => {
      const data: IncidentReportData = {
        incidentTime: new Date('2026-01-09T10:00:00'),
        recoveryTime: new Date('2026-01-09T12:30:00'),
        severity: 'medium',
        description: '서비스 지연',
        rootCause: 'DB 쿼리 지연',
        actions: ['인덱스 추가'],
        prevention: ['쿼리 최적화'],
      };

      const report = generator.generateIncidentReport(data);

      expect(report).toContain('2시간 30분');
    });
  });

  describe('TDD 준수 보고서', () => {
    it('TDD 준수 상세 보고서를 생성해야 함', () => {
      const data: TDDComplianceData = {
        period: { start: new Date('2026-01-01'), end: new Date('2026-01-09') },
        features: [
          { name: '캠페인 생성', redPhase: true, greenPhase: true, refactorPhase: true },
          { name: 'KPI 계산', redPhase: true, greenPhase: true, refactorPhase: false },
          { name: '보고서 생성', redPhase: false, greenPhase: false, refactorPhase: false },
        ],
        overallCompliance: 67,
        recommendations: ['보고서 생성 기능 TDD 적용 필요'],
      };

      const report = generator.generateTDDComplianceReport(data);

      expect(report).toContain('🔴🟢🔵 TDD 준수 보고서');
      expect(report).toContain('캠페인 생성');
      expect(report).toContain('67%');
    });

    it('각 단계별 통과 여부를 표시해야 함', () => {
      const data: TDDComplianceData = {
        period: { start: new Date('2026-01-01'), end: new Date('2026-01-09') },
        features: [
          { name: '기능 A', redPhase: true, greenPhase: true, refactorPhase: true },
        ],
        overallCompliance: 100,
        recommendations: [],
      };

      const report = generator.generateTDDComplianceReport(data);

      expect(report).toContain('🔴 ✅');
      expect(report).toContain('🟢 ✅');
      expect(report).toContain('🔵 ✅');
    });

    it('미준수 항목에 대한 권장 사항을 표시해야 함', () => {
      const data: TDDComplianceData = {
        period: { start: new Date('2026-01-01'), end: new Date('2026-01-09') },
        features: [
          { name: '기능 X', redPhase: false, greenPhase: true, refactorPhase: false },
        ],
        overallCompliance: 33,
        recommendations: [
          '테스트를 먼저 작성하세요',
          '리팩토링 단계를 수행하세요',
        ],
      };

      const report = generator.generateTDDComplianceReport(data);

      expect(report).toContain('권장 사항');
      expect(report).toContain('테스트를 먼저 작성하세요');
      expect(report).toContain('🔴 ❌');
      expect(report).toContain('🔵 ❌');
    });
  });

  describe('날짜 포맷팅', () => {
    it('한국어 날짜 형식으로 포맷해야 함', () => {
      const date = new Date('2026-01-09');
      const formatted = generator.formatDate(date);

      expect(formatted).toBe('2026-01-09');
    });

    it('기간을 포맷해야 함', () => {
      const start = new Date('2026-01-06');
      const end = new Date('2026-01-12');
      const formatted = generator.formatPeriod(start, end);

      expect(formatted).toContain('2026-01-06');
      expect(formatted).toContain('2026-01-12');
    });
  });

  describe('변경 유형 한국어 변환', () => {
    it('변경 유형을 한국어로 변환해야 함', () => {
      expect(generator.getChangeTypeKorean('feature')).toBe('기능 추가');
      expect(generator.getChangeTypeKorean('bugfix')).toBe('버그 수정');
      expect(generator.getChangeTypeKorean('refactor')).toBe('리팩토링');
      expect(generator.getChangeTypeKorean('docs')).toBe('문서 수정');
      expect(generator.getChangeTypeKorean('test')).toBe('테스트 추가');
      expect(generator.getChangeTypeKorean('security')).toBe('보안 수정');
    });
  });
});
