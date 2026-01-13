/**
 * @fileoverview 한국어 명령어 처리 유스케이스 테스트
 * TDD RED 단계: 실패하는 테스트 먼저 작성
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProcessKoreanCommandUseCase } from '@/application/use-cases/ai-team/process-korean-command';
import { AITeamPort } from '@/application/ports/ai-team-port';
import { CommandType, CommandResult } from '@/domain/services/ai-team-command-types';

describe('ProcessKoreanCommandUseCase', () => {
  let useCase: ProcessKoreanCommandUseCase;
  let mockAITeamPort: AITeamPort;

  beforeEach(() => {
    mockAITeamPort = {
      getSystemStatus: vi.fn(),
      createFeatureRequest: vi.fn(),
      reportBug: vi.fn(),
      runQualityGates: vi.fn(),
      requestDeployment: vi.fn(),
      generateReport: vi.fn(),
    };
    useCase = new ProcessKoreanCommandUseCase(mockAITeamPort);
  });

  describe('명령어 파싱', () => {
    it('/상태 명령어를 올바르게 파싱해야 함', async () => {
      const result = await useCase.execute('/상태');

      expect(result.commandType).toBe(CommandType.STATUS);
      expect(result.success).toBe(true);
    });

    it('/기능요청 명령어를 올바르게 파싱해야 함', async () => {
      const result = await useCase.execute('/기능요청');

      expect(result.commandType).toBe(CommandType.FEATURE_REQUEST);
      expect(result.success).toBe(true);
    });

    it('/버그신고 명령어를 올바르게 파싱해야 함', async () => {
      const result = await useCase.execute('/버그신고');

      expect(result.commandType).toBe(CommandType.BUG_REPORT);
      expect(result.success).toBe(true);
    });

    it('/검증 명령어를 올바르게 파싱해야 함', async () => {
      const result = await useCase.execute('/검증');

      expect(result.commandType).toBe(CommandType.VERIFY);
      expect(result.success).toBe(true);
    });

    it('/배포 명령어를 올바르게 파싱해야 함', async () => {
      const result = await useCase.execute('/배포');

      expect(result.commandType).toBe(CommandType.DEPLOY);
      expect(result.success).toBe(true);
    });

    it('/보고서 일일 명령어를 올바르게 파싱해야 함', async () => {
      const result = await useCase.execute('/보고서 일일');

      expect(result.commandType).toBe(CommandType.REPORT);
      expect(result.parameters?.reportType).toBe('daily');
      expect(result.success).toBe(true);
    });

    it('/보고서 주간 명령어를 올바르게 파싱해야 함', async () => {
      const result = await useCase.execute('/보고서 주간');

      expect(result.commandType).toBe(CommandType.REPORT);
      expect(result.parameters?.reportType).toBe('weekly');
      expect(result.success).toBe(true);
    });
  });

  describe('별칭 명령어 지원', () => {
    it('/현황은 /상태와 동일하게 처리되어야 함', async () => {
      const result = await useCase.execute('/현황');

      expect(result.commandType).toBe(CommandType.STATUS);
    });

    it('/테스트는 /검증과 동일하게 처리되어야 함', async () => {
      const result = await useCase.execute('/테스트');

      expect(result.commandType).toBe(CommandType.VERIFY);
    });

    it('/새기능은 /기능요청과 동일하게 처리되어야 함', async () => {
      const result = await useCase.execute('/새기능');

      expect(result.commandType).toBe(CommandType.FEATURE_REQUEST);
    });
  });

  describe('영어 명령어 지원', () => {
    it('/status는 /상태와 동일하게 처리되어야 함', async () => {
      const result = await useCase.execute('/status');

      expect(result.commandType).toBe(CommandType.STATUS);
    });

    it('/feature는 /기능요청과 동일하게 처리되어야 함', async () => {
      const result = await useCase.execute('/feature');

      expect(result.commandType).toBe(CommandType.FEATURE_REQUEST);
    });

    it('/bug는 /버그신고와 동일하게 처리되어야 함', async () => {
      const result = await useCase.execute('/bug');

      expect(result.commandType).toBe(CommandType.BUG_REPORT);
    });

    it('/verify는 /검증과 동일하게 처리되어야 함', async () => {
      const result = await useCase.execute('/verify');

      expect(result.commandType).toBe(CommandType.VERIFY);
    });

    it('/deploy는 /배포와 동일하게 처리되어야 함', async () => {
      const result = await useCase.execute('/deploy');

      expect(result.commandType).toBe(CommandType.DEPLOY);
    });
  });

  describe('에러 처리', () => {
    it('알 수 없는 명령어는 에러를 반환해야 함', async () => {
      const result = await useCase.execute('/알수없는명령');

      expect(result.success).toBe(false);
      expect(result.commandType).toBe(CommandType.UNKNOWN);
      expect(result.error).toBeDefined();
    });

    it('빈 입력은 에러를 반환해야 함', async () => {
      const result = await useCase.execute('');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('슬래시가 없는 입력도 자연어로 분류되어야 함', async () => {
      // 자연어 의도 분류 지원으로 변경됨
      const result = await useCase.execute('상태');

      expect(result.success).toBe(true);
      expect(result.commandType).toBe(CommandType.STATUS);
    });
  });

  describe('추가 정보 명령어', () => {
    it('/변경사항 명령어를 파싱해야 함', async () => {
      const result = await useCase.execute('/변경사항');

      expect(result.commandType).toBe(CommandType.CHANGELOG);
      expect(result.success).toBe(true);
    });

    it('/진행상황 명령어를 파싱해야 함', async () => {
      const result = await useCase.execute('/진행상황');

      expect(result.commandType).toBe(CommandType.PROGRESS);
      expect(result.success).toBe(true);
    });

    it('/품질 명령어를 파싱해야 함', async () => {
      const result = await useCase.execute('/품질');

      expect(result.commandType).toBe(CommandType.QUALITY);
      expect(result.success).toBe(true);
    });

    it('/보안 명령어를 파싱해야 함', async () => {
      const result = await useCase.execute('/보안');

      expect(result.commandType).toBe(CommandType.SECURITY);
      expect(result.success).toBe(true);
    });
  });

  describe('작업 명령어', () => {
    it('/수정 #123 명령어를 파싱해야 함', async () => {
      const result = await useCase.execute('/수정 #123');

      expect(result.commandType).toBe(CommandType.FIX);
      expect(result.parameters?.issueNumber).toBe(123);
      expect(result.success).toBe(true);
    });

    it('/승인 명령어를 파싱해야 함', async () => {
      const result = await useCase.execute('/승인');

      expect(result.commandType).toBe(CommandType.APPROVE);
      expect(result.success).toBe(true);
    });

    it('/거부 명령어를 파싱해야 함', async () => {
      const result = await useCase.execute('/거부');

      expect(result.commandType).toBe(CommandType.REJECT);
      expect(result.success).toBe(true);
    });

    it('/롤백 명령어를 파싱해야 함', async () => {
      const result = await useCase.execute('/롤백');

      expect(result.commandType).toBe(CommandType.ROLLBACK);
      expect(result.success).toBe(true);
    });

    it('/문의 명령어를 파싱해야 함', async () => {
      const result = await useCase.execute('/문의');

      expect(result.commandType).toBe(CommandType.HELP);
      expect(result.success).toBe(true);
    });
  });
});
