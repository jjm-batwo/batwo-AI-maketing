/**
 * @fileoverview 승인 워크플로우 테스트
 * TDD RED 단계: 실패하는 테스트 먼저 작성
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  ApprovalWorkflow,
} from '@/application/use-cases/ai-team/approval-workflow';

describe('ApprovalWorkflow', () => {
  let workflow: ApprovalWorkflow;

  beforeEach(() => {
    vi.useFakeTimers();
    workflow = new ApprovalWorkflow();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('승인 요청 생성', () => {
    it('데이터베이스 스키마 변경 승인 요청을 생성해야 함', () => {
      const request = workflow.requestApproval({
        type: 'database_schema',
        title: 'User 테이블에 role 컬럼 추가',
        description: '사용자 권한 관리를 위한 role 필드 추가',
        changes: ['prisma/schema.prisma'],
        requestedBy: 'developer-agent',
      });

      expect(request.id).toBeDefined();
      expect(request.type).toBe('database_schema');
      expect(request.status).toBe('pending');
      expect(request.title).toBe('User 테이블에 role 컬럼 추가');
    });

    it('API 변경 승인 요청을 생성해야 함', () => {
      const request = workflow.requestApproval({
        type: 'api_change',
        title: 'POST /api/campaigns 엔드포인트 변경',
        description: '요청 형식 변경으로 기존 클라이언트 영향 있음',
        changes: ['src/app/api/campaigns/route.ts'],
        requestedBy: 'developer-agent',
      });

      expect(request.type).toBe('api_change');
      expect(request.status).toBe('pending');
    });

    it('새 라이브러리 추가 승인 요청을 생성해야 함', () => {
      const request = workflow.requestApproval({
        type: 'new_library',
        title: 'lodash 라이브러리 추가',
        description: '유틸리티 함수 사용을 위한 lodash 추가',
        changes: ['package.json'],
        requestedBy: 'developer-agent',
        metadata: {
          libraryName: 'lodash',
          version: '^4.17.21',
        },
      });

      expect(request.type).toBe('new_library');
      expect(request.metadata?.libraryName).toBe('lodash');
    });

    it('보안 변경 승인 요청을 생성해야 함', () => {
      const request = workflow.requestApproval({
        type: 'security',
        title: '인증 미들웨어 수정',
        description: 'JWT 검증 로직 변경',
        changes: ['src/infrastructure/auth/auth.ts'],
        requestedBy: 'developer-agent',
      });

      expect(request.type).toBe('security');
      expect(request.status).toBe('pending');
    });

    it('프로덕션 배포 승인 요청을 생성해야 함', () => {
      const request = workflow.requestApproval({
        type: 'production_deploy',
        title: 'v1.2.0 프로덕션 배포',
        description: '새 캠페인 필터링 기능 포함',
        changes: [],
        requestedBy: 'pm-agent',
        metadata: {
          version: '1.2.0',
          releaseNotes: '캠페인 필터링, 버그 수정',
        },
      });

      expect(request.type).toBe('production_deploy');
      expect(request.metadata?.version).toBe('1.2.0');
    });

    it('승인 요청 시 생성 시간을 기록해야 함', () => {
      vi.setSystemTime(new Date('2026-01-09T10:00:00+09:00'));

      const request = workflow.requestApproval({
        type: 'database_schema',
        title: '테스트 변경',
        description: '설명',
        changes: [],
        requestedBy: 'developer-agent',
      });

      expect(request.createdAt.toISOString()).toContain('2026-01-09');
    });
  });

  describe('승인/거부 처리', () => {
    it('승인 요청을 승인해야 함', () => {
      const request = workflow.requestApproval({
        type: 'api_change',
        title: 'API 변경',
        description: '설명',
        changes: [],
        requestedBy: 'developer-agent',
      });

      const approved = workflow.approve(request.id, 'user', '확인했습니다');

      expect(approved.status).toBe('approved');
      expect(approved.approvedBy).toBe('user');
      expect(approved.approvalComment).toBe('확인했습니다');
      expect(approved.approvedAt).toBeDefined();
    });

    it('승인 요청을 거부해야 함', () => {
      const request = workflow.requestApproval({
        type: 'security',
        title: '보안 변경',
        description: '설명',
        changes: [],
        requestedBy: 'developer-agent',
      });

      const rejected = workflow.reject(request.id, 'user', '보안 검토 필요');

      expect(rejected.status).toBe('rejected');
      expect(rejected.rejectedBy).toBe('user');
      expect(rejected.rejectionReason).toBe('보안 검토 필요');
      expect(rejected.rejectedAt).toBeDefined();
    });

    it('이미 처리된 요청은 다시 승인할 수 없어야 함', () => {
      const request = workflow.requestApproval({
        type: 'api_change',
        title: '변경',
        description: '설명',
        changes: [],
        requestedBy: 'developer-agent',
      });

      workflow.approve(request.id, 'user');

      expect(() => workflow.approve(request.id, 'user2')).toThrow(
        '이미 처리된 승인 요청입니다'
      );
    });

    it('이미 처리된 요청은 다시 거부할 수 없어야 함', () => {
      const request = workflow.requestApproval({
        type: 'api_change',
        title: '변경',
        description: '설명',
        changes: [],
        requestedBy: 'developer-agent',
      });

      workflow.reject(request.id, 'user');

      expect(() => workflow.reject(request.id, 'user2')).toThrow(
        '이미 처리된 승인 요청입니다'
      );
    });
  });

  describe('대기 중인 승인 요청 조회', () => {
    it('모든 대기 중인 승인 요청을 조회해야 함', () => {
      workflow.requestApproval({
        type: 'api_change',
        title: '변경 1',
        description: '',
        changes: [],
        requestedBy: 'developer-agent',
      });
      workflow.requestApproval({
        type: 'security',
        title: '변경 2',
        description: '',
        changes: [],
        requestedBy: 'developer-agent',
      });
      const request3 = workflow.requestApproval({
        type: 'database_schema',
        title: '변경 3',
        description: '',
        changes: [],
        requestedBy: 'developer-agent',
      });

      workflow.approve(request3.id, 'user');

      const pending = workflow.getPendingRequests();

      expect(pending.length).toBe(2);
    });

    it('타입별 대기 중인 승인 요청을 필터링해야 함', () => {
      workflow.requestApproval({
        type: 'api_change',
        title: '변경 1',
        description: '',
        changes: [],
        requestedBy: 'developer-agent',
      });
      workflow.requestApproval({
        type: 'security',
        title: '변경 2',
        description: '',
        changes: [],
        requestedBy: 'developer-agent',
      });
      workflow.requestApproval({
        type: 'api_change',
        title: '변경 3',
        description: '',
        changes: [],
        requestedBy: 'developer-agent',
      });

      const apiChanges = workflow.getPendingRequestsByType('api_change');

      expect(apiChanges.length).toBe(2);
    });
  });

  describe('승인 요청 히스토리', () => {
    it('모든 승인 요청 히스토리를 조회해야 함', () => {
      const req1 = workflow.requestApproval({
        type: 'api_change',
        title: '변경 1',
        description: '',
        changes: [],
        requestedBy: 'developer-agent',
      });
      workflow.requestApproval({
        type: 'security',
        title: '변경 2',
        description: '',
        changes: [],
        requestedBy: 'developer-agent',
      });

      workflow.approve(req1.id, 'user');

      const history = workflow.getApprovalHistory();

      expect(history.length).toBe(2);
    });

    it('승인된 요청만 조회해야 함', () => {
      const req1 = workflow.requestApproval({
        type: 'api_change',
        title: '변경 1',
        description: '',
        changes: [],
        requestedBy: 'developer-agent',
      });
      const req2 = workflow.requestApproval({
        type: 'security',
        title: '변경 2',
        description: '',
        changes: [],
        requestedBy: 'developer-agent',
      });

      workflow.approve(req1.id, 'user');
      workflow.reject(req2.id, 'user');

      const approved = workflow.getApprovedRequests();

      expect(approved.length).toBe(1);
      expect(approved[0].status).toBe('approved');
    });

    it('거부된 요청만 조회해야 함', () => {
      const req1 = workflow.requestApproval({
        type: 'api_change',
        title: '변경 1',
        description: '',
        changes: [],
        requestedBy: 'developer-agent',
      });
      const req2 = workflow.requestApproval({
        type: 'security',
        title: '변경 2',
        description: '',
        changes: [],
        requestedBy: 'developer-agent',
      });

      workflow.approve(req1.id, 'user');
      workflow.reject(req2.id, 'user');

      const rejected = workflow.getRejectedRequests();

      expect(rejected.length).toBe(1);
      expect(rejected[0].status).toBe('rejected');
    });
  });

  describe('승인 필요 여부 판단', () => {
    it('데이터베이스 스키마 변경은 승인이 필요해야 함', () => {
      const needsApproval = workflow.needsApproval('database_schema');

      expect(needsApproval).toBe(true);
    });

    it('API 변경은 승인이 필요해야 함', () => {
      const needsApproval = workflow.needsApproval('api_change');

      expect(needsApproval).toBe(true);
    });

    it('새 라이브러리 추가는 승인이 필요해야 함', () => {
      const needsApproval = workflow.needsApproval('new_library');

      expect(needsApproval).toBe(true);
    });

    it('보안 변경은 승인이 필요해야 함', () => {
      const needsApproval = workflow.needsApproval('security');

      expect(needsApproval).toBe(true);
    });

    it('프로덕션 배포는 승인이 필요해야 함', () => {
      const needsApproval = workflow.needsApproval('production_deploy');

      expect(needsApproval).toBe(true);
    });
  });

  describe('알림 대상 관리', () => {
    it('승인 요청 시 알림 대상을 설정해야 함', () => {
      const request = workflow.requestApproval({
        type: 'security',
        title: '보안 변경',
        description: '',
        changes: [],
        requestedBy: 'developer-agent',
        notifyTargets: ['admin@example.com', 'security@example.com'],
      });

      expect(request.notifyTargets).toContain('admin@example.com');
      expect(request.notifyTargets?.length).toBe(2);
    });

    it('타입별 기본 알림 대상을 설정할 수 있어야 함', () => {
      workflow.setDefaultNotifyTargets('security', [
        'security-team@example.com',
      ]);

      const request = workflow.requestApproval({
        type: 'security',
        title: '보안 변경',
        description: '',
        changes: [],
        requestedBy: 'developer-agent',
      });

      expect(request.notifyTargets).toContain('security-team@example.com');
    });
  });

  describe('승인 요청 취소', () => {
    it('대기 중인 승인 요청을 취소해야 함', () => {
      const request = workflow.requestApproval({
        type: 'api_change',
        title: '변경',
        description: '',
        changes: [],
        requestedBy: 'developer-agent',
      });

      const cancelled = workflow.cancel(request.id, '계획 변경');

      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.cancellationReason).toBe('계획 변경');
    });

    it('이미 처리된 요청은 취소할 수 없어야 함', () => {
      const request = workflow.requestApproval({
        type: 'api_change',
        title: '변경',
        description: '',
        changes: [],
        requestedBy: 'developer-agent',
      });

      workflow.approve(request.id, 'user');

      expect(() => workflow.cancel(request.id, '취소')).toThrow(
        '이미 처리된 승인 요청은 취소할 수 없습니다'
      );
    });
  });

  describe('승인 유형 한국어 변환', () => {
    it('승인 유형을 한국어로 변환해야 함', () => {
      expect(workflow.getApprovalTypeKorean('database_schema')).toBe(
        '데이터베이스 스키마 변경'
      );
      expect(workflow.getApprovalTypeKorean('api_change')).toBe('API 변경');
      expect(workflow.getApprovalTypeKorean('new_library')).toBe(
        '새 라이브러리 추가'
      );
      expect(workflow.getApprovalTypeKorean('security')).toBe('보안 변경');
      expect(workflow.getApprovalTypeKorean('production_deploy')).toBe(
        '프로덕션 배포'
      );
    });
  });

  describe('승인 상태 한국어 변환', () => {
    it('승인 상태를 한국어로 변환해야 함', () => {
      expect(workflow.getApprovalStatusKorean('pending')).toBe('대기 중');
      expect(workflow.getApprovalStatusKorean('approved')).toBe('승인됨');
      expect(workflow.getApprovalStatusKorean('rejected')).toBe('거부됨');
      expect(workflow.getApprovalStatusKorean('cancelled')).toBe('취소됨');
    });
  });
});
