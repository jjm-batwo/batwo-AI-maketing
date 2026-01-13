/**
 * @fileoverview TDD 워크플로우 러너 테스트
 * TDD RED 단계: 실패하는 테스트 먼저 작성
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TDDWorkflowRunner } from '@/application/use-cases/ai-team/tdd-workflow-runner';
import { TDDStage } from '@/domain/services/ai-team-command-types';

describe('TDDWorkflowRunner', () => {
  let runner: TDDWorkflowRunner;

  beforeEach(() => {
    runner = new TDDWorkflowRunner();
  });

  describe('워크플로우 초기화', () => {
    it('새 워크플로우는 RED 단계로 시작해야 함', () => {
      const workflow = runner.createWorkflow('새 기능');

      expect(workflow.currentStage).toBe('RED');
      expect(workflow.stages).toEqual(['RED', 'GREEN', 'REFACTOR']);
    });

    it('워크플로우에 기능 설명이 포함되어야 함', () => {
      const workflow = runner.createWorkflow('사용자 인증 기능');

      expect(workflow.featureDescription).toBe('사용자 인증 기능');
    });
  });

  describe('단계 전환', () => {
    it('RED에서 GREEN으로 전환할 수 있어야 함', () => {
      const workflow = runner.createWorkflow('기능');
      const result = runner.advanceStage(workflow.id);

      expect(result.success).toBe(true);
      expect(result.workflow?.currentStage).toBe('GREEN');
    });

    it('GREEN에서 REFACTOR로 전환할 수 있어야 함', () => {
      const workflow = runner.createWorkflow('기능');
      runner.advanceStage(workflow.id); // RED → GREEN
      const result = runner.advanceStage(workflow.id); // GREEN → REFACTOR

      expect(result.success).toBe(true);
      expect(result.workflow?.currentStage).toBe('REFACTOR');
    });

    it('REFACTOR에서 COMPLETE로 전환할 수 있어야 함', () => {
      const workflow = runner.createWorkflow('기능');
      runner.advanceStage(workflow.id); // RED → GREEN
      runner.advanceStage(workflow.id); // GREEN → REFACTOR
      const result = runner.advanceStage(workflow.id); // REFACTOR → COMPLETE

      expect(result.success).toBe(true);
      expect(result.workflow?.currentStage).toBe('COMPLETE');
    });

    it('COMPLETE 이후에는 더 이상 전환되지 않아야 함', () => {
      const workflow = runner.createWorkflow('기능');
      runner.advanceStage(workflow.id); // RED → GREEN
      runner.advanceStage(workflow.id); // GREEN → REFACTOR
      runner.advanceStage(workflow.id); // REFACTOR → COMPLETE
      const result = runner.advanceStage(workflow.id); // COMPLETE → ?

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('단계별 가이드', () => {
    it('RED 단계 가이드를 제공해야 함', () => {
      const workflow = runner.createWorkflow('기능');
      const guide = runner.getStageGuide(workflow.id);

      expect(guide.stage).toBe('RED');
      expect(guide.instructions).toContain('실패하는 테스트');
      expect(guide.checklist).toBeDefined();
    });

    it('GREEN 단계 가이드를 제공해야 함', () => {
      const workflow = runner.createWorkflow('기능');
      runner.advanceStage(workflow.id);
      const guide = runner.getStageGuide(workflow.id);

      expect(guide.stage).toBe('GREEN');
      expect(guide.instructions).toContain('최소 구현');
    });

    it('REFACTOR 단계 가이드를 제공해야 함', () => {
      const workflow = runner.createWorkflow('기능');
      runner.advanceStage(workflow.id);
      runner.advanceStage(workflow.id);
      const guide = runner.getStageGuide(workflow.id);

      expect(guide.stage).toBe('REFACTOR');
      expect(guide.instructions).toContain('코드를 정리');
    });
  });

  describe('단계 검증', () => {
    it('RED 단계에서 테스트 실패 여부를 검증해야 함', async () => {
      const workflow = runner.createWorkflow('기능');
      const validation = await runner.validateStage(workflow.id, {
        testsExist: true,
        testsPassing: false, // RED: 테스트 실패해야 함
      });

      expect(validation.canAdvance).toBe(true);
    });

    it('RED 단계에서 테스트가 통과하면 경고해야 함', async () => {
      const workflow = runner.createWorkflow('기능');
      const validation = await runner.validateStage(workflow.id, {
        testsExist: true,
        testsPassing: true, // 잘못됨: RED에서는 실패해야 함
      });

      expect(validation.canAdvance).toBe(false);
      expect(validation.warning).toContain('RED 단계');
    });

    it('GREEN 단계에서 테스트 통과 여부를 검증해야 함', async () => {
      const workflow = runner.createWorkflow('기능');
      runner.advanceStage(workflow.id);
      const validation = await runner.validateStage(workflow.id, {
        testsExist: true,
        testsPassing: true, // GREEN: 테스트 통과해야 함
      });

      expect(validation.canAdvance).toBe(true);
    });

    it('GREEN 단계에서 테스트가 실패하면 진행 불가', async () => {
      const workflow = runner.createWorkflow('기능');
      runner.advanceStage(workflow.id);
      const validation = await runner.validateStage(workflow.id, {
        testsExist: true,
        testsPassing: false, // 잘못됨: GREEN에서는 통과해야 함
      });

      expect(validation.canAdvance).toBe(false);
    });

    it('REFACTOR 단계에서 테스트가 여전히 통과해야 함', async () => {
      const workflow = runner.createWorkflow('기능');
      runner.advanceStage(workflow.id);
      runner.advanceStage(workflow.id);
      const validation = await runner.validateStage(workflow.id, {
        testsExist: true,
        testsPassing: true, // REFACTOR: 테스트 유지
      });

      expect(validation.canAdvance).toBe(true);
    });
  });

  describe('워크플로우 상태 조회', () => {
    it('워크플로우 상태를 조회할 수 있어야 함', () => {
      const workflow = runner.createWorkflow('기능');
      const status = runner.getWorkflowStatus(workflow.id);

      expect(status).toBeDefined();
      expect(status?.currentStage).toBe('RED');
      expect(status?.progress).toBe(0);
    });

    it('진행률이 단계에 따라 업데이트되어야 함', () => {
      const workflow = runner.createWorkflow('기능');
      runner.advanceStage(workflow.id);
      const status = runner.getWorkflowStatus(workflow.id);

      expect(status?.progress).toBe(33); // 1/3 완료
    });

    it('존재하지 않는 워크플로우 조회 시 undefined 반환', () => {
      const status = runner.getWorkflowStatus('non-existent');

      expect(status).toBeUndefined();
    });
  });

  describe('워크플로우 이력', () => {
    it('단계 전환 이력이 기록되어야 함', () => {
      const workflow = runner.createWorkflow('기능');
      runner.advanceStage(workflow.id);
      runner.advanceStage(workflow.id);

      const history = runner.getWorkflowHistory(workflow.id);

      expect(history).toHaveLength(3); // 초기 + 2번 전환
      expect(history[0].stage).toBe('RED');
      expect(history[1].stage).toBe('GREEN');
      expect(history[2].stage).toBe('REFACTOR');
    });
  });
});
