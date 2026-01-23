/**
 * @fileoverview PM Agent 조율 로직 테스트
 * TDD RED 단계: 실패하는 테스트 먼저 작성
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PMAgentCoordinator } from '@/application/use-cases/ai-team/pm-agent-coordinator';
import { CommandType } from '@/domain/services/ai-team-command-types';

describe('PMAgentCoordinator', () => {
  let coordinator: PMAgentCoordinator;

  beforeEach(() => {
    coordinator = new PMAgentCoordinator();
  });

  describe('명령어 라우팅', () => {
    it('STATUS 명령어는 시스템 상태 조회로 라우팅되어야 함', async () => {
      const result = await coordinator.routeCommand({
        success: true,
        commandType: CommandType.STATUS,
      });

      expect(result.agentType).toBe('system');
      expect(result.action).toBe('getStatus');
    });

    it('FEATURE_REQUEST 명령어는 Feature Planner로 라우팅되어야 함', async () => {
      const result = await coordinator.routeCommand({
        success: true,
        commandType: CommandType.FEATURE_REQUEST,
      });

      expect(result.agentType).toBe('planner');
      expect(result.action).toBe('createFeaturePlan');
      expect(result.requiresFeaturePlanner).toBe(true);
    });

    it('BUG_REPORT 명령어는 QA Agent로 라우팅되어야 함', async () => {
      const result = await coordinator.routeCommand({
        success: true,
        commandType: CommandType.BUG_REPORT,
      });

      expect(result.agentType).toBe('qa');
      expect(result.action).toBe('createBugReport');
    });

    it('VERIFY 명령어는 QA Agent로 라우팅되어야 함', async () => {
      const result = await coordinator.routeCommand({
        success: true,
        commandType: CommandType.VERIFY,
      });

      expect(result.agentType).toBe('qa');
      expect(result.action).toBe('runQualityGates');
    });

    it('DEPLOY 명령어는 승인 필요 표시와 함께 DevOps로 라우팅되어야 함', async () => {
      const result = await coordinator.routeCommand({
        success: true,
        commandType: CommandType.DEPLOY,
      });

      expect(result.agentType).toBe('devops');
      expect(result.action).toBe('requestDeployment');
      expect(result.requiresApproval).toBe(true);
    });

    it('REPORT 명령어는 Analytics Agent로 라우팅되어야 함', async () => {
      const result = await coordinator.routeCommand({
        success: true,
        commandType: CommandType.REPORT,
        parameters: { reportType: 'daily' },
      });

      expect(result.agentType).toBe('analytics');
      expect(result.action).toBe('generateReport');
      expect(result.parameters?.reportType).toBe('daily');
    });
  });

  describe('TDD 워크플로우 조율', () => {
    it('기능 요청 시 TDD 워크플로우 단계가 설정되어야 함', async () => {
      const result = await coordinator.routeCommand({
        success: true,
        commandType: CommandType.FEATURE_REQUEST,
      });

      expect(result.tddWorkflow).toBeDefined();
      expect(result.tddWorkflow?.stages).toContain('RED');
      expect(result.tddWorkflow?.stages).toContain('GREEN');
      expect(result.tddWorkflow?.stages).toContain('REFACTOR');
    });

    it('버그 수정 시 TDD 워크플로우가 적용되어야 함', async () => {
      const result = await coordinator.routeCommand({
        success: true,
        commandType: CommandType.FIX,
        parameters: { issueNumber: 123 },
      });

      expect(result.tddWorkflow).toBeDefined();
      expect(result.tddWorkflow?.currentStage).toBe('RED');
    });
  });

  describe('클린 아키텍처 검증', () => {
    it('기능 요청 시 아키텍처 검증이 활성화되어야 함', async () => {
      const result = await coordinator.routeCommand({
        success: true,
        commandType: CommandType.FEATURE_REQUEST,
      });

      expect(result.architectureValidation).toBe(true);
    });

    it('코드 수정 명령어 시 아키텍처 검증이 활성화되어야 함', async () => {
      const result = await coordinator.routeCommand({
        success: true,
        commandType: CommandType.FIX,
        parameters: { issueNumber: 123 },
      });

      expect(result.architectureValidation).toBe(true);
    });
  });

  describe('승인 필요 작업', () => {
    it('DEPLOY는 승인이 필요해야 함', async () => {
      const result = await coordinator.routeCommand({
        success: true,
        commandType: CommandType.DEPLOY,
      });

      expect(result.requiresApproval).toBe(true);
      expect(result.approvalReason).toBe('프로덕션 배포');
    });

    it('ROLLBACK은 승인이 필요해야 함', async () => {
      const result = await coordinator.routeCommand({
        success: true,
        commandType: CommandType.ROLLBACK,
      });

      expect(result.requiresApproval).toBe(true);
      expect(result.approvalReason).toBe('롤백 작업');
    });
  });

  describe('에러 처리', () => {
    it('실패한 명령어 결과는 에러 응답을 반환해야 함', async () => {
      const result = await coordinator.routeCommand({
        success: false,
        commandType: CommandType.UNKNOWN,
        error: '알 수 없는 명령어',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('알 수 없는 명령어');
    });
  });

  describe('에이전트 타입별 라우팅', () => {
    it('SECURITY 명령어는 보안 에이전트로 라우팅되어야 함', async () => {
      const result = await coordinator.routeCommand({
        success: true,
        commandType: CommandType.SECURITY,
      });

      expect(result.agentType).toBe('security');
      expect(result.action).toBe('runSecurityScan');
    });

    it('QUALITY 명령어는 QA 에이전트로 라우팅되어야 함', async () => {
      const result = await coordinator.routeCommand({
        success: true,
        commandType: CommandType.QUALITY,
      });

      expect(result.agentType).toBe('qa');
      expect(result.action).toBe('getQualityMetrics');
    });

    it('CHANGELOG 명령어는 Documentation 에이전트로 라우팅되어야 함', async () => {
      const result = await coordinator.routeCommand({
        success: true,
        commandType: CommandType.CHANGELOG,
      });

      expect(result.agentType).toBe('documentation');
      expect(result.action).toBe('getChangelog');
    });

    it('PROGRESS 명령어는 PM 에이전트가 직접 처리해야 함', async () => {
      const result = await coordinator.routeCommand({
        success: true,
        commandType: CommandType.PROGRESS,
      });

      expect(result.agentType).toBe('pm');
      expect(result.action).toBe('getProgress');
    });

    it('HELP 명령어는 PM 에이전트가 처리해야 함', async () => {
      const result = await coordinator.routeCommand({
        success: true,
        commandType: CommandType.HELP,
      });

      expect(result.agentType).toBe('pm');
      expect(result.action).toBe('showHelp');
    });

    it('APPROVE 명령어는 PM 에이전트가 처리해야 함', async () => {
      const result = await coordinator.routeCommand({
        success: true,
        commandType: CommandType.APPROVE,
      });

      expect(result.agentType).toBe('pm');
      expect(result.action).toBe('approveTask');
    });

    it('REJECT 명령어는 PM 에이전트가 처리해야 함', async () => {
      const result = await coordinator.routeCommand({
        success: true,
        commandType: CommandType.REJECT,
      });

      expect(result.agentType).toBe('pm');
      expect(result.action).toBe('rejectTask');
    });
  });
});
