/**
 * @fileoverview 품질 게이트 러너 테스트
 * TDD RED 단계: 실패하는 테스트 먼저 작성
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { QualityGateRunner, QualityGateConfig } from '@/application/use-cases/ai-team/quality-gate-runner';

describe('QualityGateRunner', () => {
  let runner: QualityGateRunner;
  let mockConfig: QualityGateConfig;

  beforeEach(() => {
    mockConfig = {
      typeCheck: { enabled: true, command: 'npm run type-check' },
      lint: { enabled: true, command: 'npm run lint' },
      unitTest: { enabled: true, command: 'npm test', coverageThreshold: 90 },
      integrationTest: { enabled: true, command: 'npm run test:int' },
      build: { enabled: true, command: 'npm run build' },
      architecture: { enabled: true },
      security: { enabled: true },
    };
    runner = new QualityGateRunner(mockConfig);
  });

  describe('게이트 설정', () => {
    it('기본 게이트 목록을 반환해야 함', () => {
      const gates = runner.getEnabledGates();

      expect(gates).toContain('typeCheck');
      expect(gates).toContain('lint');
      expect(gates).toContain('unitTest');
      expect(gates).toContain('build');
      expect(gates).toContain('architecture');
    });

    it('비활성화된 게이트는 제외되어야 함', () => {
      const config: QualityGateConfig = {
        typeCheck: { enabled: false, command: '' },
        lint: { enabled: true, command: 'npm run lint' },
        unitTest: { enabled: false, command: '' },
        integrationTest: { enabled: false, command: '' },
        build: { enabled: true, command: 'npm run build' },
        architecture: { enabled: false },
        security: { enabled: false },
      };
      const customRunner = new QualityGateRunner(config);
      const gates = customRunner.getEnabledGates();

      expect(gates).not.toContain('typeCheck');
      expect(gates).toContain('lint');
      expect(gates).not.toContain('unitTest');
      expect(gates).toContain('build');
    });
  });

  describe('게이트 실행 순서', () => {
    it('올바른 순서로 게이트가 실행되어야 함', () => {
      const order = runner.getExecutionOrder();

      // 아키텍처 검증이 먼저
      expect(order.indexOf('architecture')).toBeLessThan(order.indexOf('typeCheck'));
      // 타입 체크가 린트보다 먼저
      expect(order.indexOf('typeCheck')).toBeLessThan(order.indexOf('lint'));
      // 린트가 테스트보다 먼저
      expect(order.indexOf('lint')).toBeLessThan(order.indexOf('unitTest'));
      // 단위 테스트가 통합 테스트보다 먼저
      expect(order.indexOf('unitTest')).toBeLessThan(order.indexOf('integrationTest'));
      // 빌드가 마지막 (보안 검사 제외)
      expect(order.indexOf('integrationTest')).toBeLessThan(order.indexOf('build'));
    });
  });

  describe('개별 게이트 결과', () => {
    it('성공한 게이트 결과를 생성해야 함', () => {
      const result = runner.createGateResult('typeCheck', true, 1500, 'No errors found');

      expect(result.name).toBe('typeCheck');
      expect(result.passed).toBe(true);
      expect(result.duration).toBe(1500);
      expect(result.message).toBe('No errors found');
    });

    it('실패한 게이트 결과를 생성해야 함', () => {
      const result = runner.createGateResult('lint', false, 2000, '5 errors found');

      expect(result.name).toBe('lint');
      expect(result.passed).toBe(false);
      expect(result.duration).toBe(2000);
      expect(result.message).toBe('5 errors found');
    });
  });

  describe('전체 실행 결과', () => {
    it('모든 게이트가 통과하면 성공을 반환해야 함', () => {
      const gateResults = [
        runner.createGateResult('architecture', true, 100),
        runner.createGateResult('typeCheck', true, 1500),
        runner.createGateResult('lint', true, 2000),
        runner.createGateResult('unitTest', true, 5000),
        runner.createGateResult('build', true, 10000),
      ];

      const summary = runner.createSummary(gateResults);

      expect(summary.passed).toBe(true);
      expect(summary.totalGates).toBe(5);
      expect(summary.passedGates).toBe(5);
      expect(summary.failedGates).toBe(0);
    });

    it('하나라도 실패하면 전체 실패를 반환해야 함', () => {
      const gateResults = [
        runner.createGateResult('typeCheck', true, 1500),
        runner.createGateResult('lint', false, 2000, 'Errors found'),
        runner.createGateResult('unitTest', true, 5000),
      ];

      const summary = runner.createSummary(gateResults);

      expect(summary.passed).toBe(false);
      expect(summary.passedGates).toBe(2);
      expect(summary.failedGates).toBe(1);
    });

    it('총 실행 시간을 계산해야 함', () => {
      const gateResults = [
        runner.createGateResult('typeCheck', true, 1000),
        runner.createGateResult('lint', true, 2000),
        runner.createGateResult('unitTest', true, 3000),
      ];

      const summary = runner.createSummary(gateResults);

      expect(summary.totalDuration).toBe(6000);
    });
  });

  describe('실패 시 중단', () => {
    it('실패 시 후속 게이트 건너뛰기 옵션을 지원해야 함', () => {
      const config: QualityGateConfig = {
        ...mockConfig,
        stopOnFailure: true,
      };
      const runnerWithStop = new QualityGateRunner(config);

      expect(runnerWithStop.shouldStopOnFailure()).toBe(true);
    });

    it('기본값은 실패해도 계속 진행', () => {
      expect(runner.shouldStopOnFailure()).toBe(false);
    });
  });

  describe('커버리지 검사', () => {
    it('커버리지가 임계값 이상이면 통과해야 함', () => {
      const result = runner.checkCoverage(95, 90);

      expect(result.passed).toBe(true);
    });

    it('커버리지가 임계값 미만이면 실패해야 함', () => {
      const result = runner.checkCoverage(85, 90);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('85%');
      expect(result.message).toContain('90%');
    });

    it('정확히 임계값이면 통과해야 함', () => {
      const result = runner.checkCoverage(90, 90);

      expect(result.passed).toBe(true);
    });
  });

  describe('보고서 생성', () => {
    it('마크다운 형식 보고서를 생성해야 함', () => {
      const gateResults = [
        runner.createGateResult('typeCheck', true, 1500, 'No errors'),
        runner.createGateResult('lint', true, 2000, 'Clean'),
      ];
      const summary = runner.createSummary(gateResults);

      const report = runner.generateReport(gateResults, summary);

      expect(report).toContain('품질 게이트 결과');
      expect(report).toContain('타입 체크');
      expect(report).toContain('✅');
    });

    it('실패한 게이트를 강조해야 함', () => {
      const gateResults = [
        runner.createGateResult('typeCheck', true, 1500),
        runner.createGateResult('lint', false, 2000, 'Errors found'),
      ];
      const summary = runner.createSummary(gateResults);

      const report = runner.generateReport(gateResults, summary);

      expect(report).toContain('❌');
      expect(report).toContain('린트 검사');
    });
  });

  describe('한국어 게이트 이름', () => {
    it('게이트 이름을 한국어로 변환해야 함', () => {
      expect(runner.getGateDisplayName('typeCheck')).toBe('타입 체크');
      expect(runner.getGateDisplayName('lint')).toBe('린트 검사');
      expect(runner.getGateDisplayName('unitTest')).toBe('단위 테스트');
      expect(runner.getGateDisplayName('integrationTest')).toBe('통합 테스트');
      expect(runner.getGateDisplayName('build')).toBe('빌드');
      expect(runner.getGateDisplayName('architecture')).toBe('아키텍처 검증');
      expect(runner.getGateDisplayName('security')).toBe('보안 검사');
    });
  });
});
