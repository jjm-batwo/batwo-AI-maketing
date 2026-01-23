/**
 * @fileoverview GitHub Issue 관리자 테스트
 * TDD RED 단계: 실패하는 테스트 먼저 작성
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  GitHubIssueManager,
  IssueCreateInput,
} from '@/application/use-cases/ai-team/github-issue-manager';

describe('GitHubIssueManager', () => {
  let manager: GitHubIssueManager;

  beforeEach(() => {
    manager = new GitHubIssueManager();
  });

  describe('Issue 생성', () => {
    it('기능 요청 Issue를 생성해야 함', () => {
      const input: IssueCreateInput = {
        title: '캠페인 날짜별 필터링 기능',
        description: '캠페인 목록에서 날짜별로 필터링이 필요합니다',
        type: 'feature',
        priority: 'medium',
      };

      const issue = manager.createIssue(input);

      expect(issue.id).toBeDefined();
      expect(issue.title).toBe('캠페인 날짜별 필터링 기능');
      expect(issue.type).toBe('feature');
      expect(issue.status).toBe('open');
      expect(issue.labels).toContain('type:feature');
      expect(issue.labels).toContain('priority:medium');
    });

    it('버그 신고 Issue를 생성해야 함', () => {
      const input: IssueCreateInput = {
        title: 'KPI 계산 오류',
        description: 'KPI가 잘못 계산됩니다',
        type: 'bug',
        priority: 'high',
      };

      const issue = manager.createIssue(input);

      expect(issue.type).toBe('bug');
      expect(issue.labels).toContain('type:bug');
      expect(issue.labels).toContain('priority:high');
    });

    it('보안 Issue를 생성해야 함', () => {
      const input: IssueCreateInput = {
        title: 'API 키 노출 위험',
        description: '환경 변수 처리 필요',
        type: 'security',
        priority: 'critical',
      };

      const issue = manager.createIssue(input);

      expect(issue.type).toBe('security');
      expect(issue.labels).toContain('type:security');
      expect(issue.labels).toContain('priority:critical');
    });

    it('생성 시간을 기록해야 함', () => {
      const beforeCreate = new Date();

      const input: IssueCreateInput = {
        title: '테스트 Issue',
        description: '설명',
        type: 'feature',
        priority: 'low',
      };

      const issue = manager.createIssue(input);

      expect(issue.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    });
  });

  describe('Issue 상태 관리', () => {
    it('Issue 상태를 업데이트해야 함', () => {
      const input: IssueCreateInput = {
        title: '테스트',
        description: '설명',
        type: 'feature',
        priority: 'medium',
      };

      const issue = manager.createIssue(input);
      const updated = manager.updateIssueStatus(issue.id, 'in_progress');

      expect(updated.status).toBe('in_progress');
      expect(updated.labels).toContain('status:in-progress');
    });

    it('완료 시 Issue를 닫아야 함', () => {
      const input: IssueCreateInput = {
        title: '테스트',
        description: '설명',
        type: 'feature',
        priority: 'medium',
      };

      const issue = manager.createIssue(input);
      const updated = manager.updateIssueStatus(issue.id, 'completed');

      expect(updated.status).toBe('completed');
      expect(updated.closedAt).toBeDefined();
    });

    it('Issue를 다시 열 수 있어야 함', () => {
      const input: IssueCreateInput = {
        title: '테스트',
        description: '설명',
        type: 'feature',
        priority: 'medium',
      };

      const issue = manager.createIssue(input);
      manager.updateIssueStatus(issue.id, 'completed');
      const reopened = manager.updateIssueStatus(issue.id, 'open');

      expect(reopened.status).toBe('open');
      expect(reopened.closedAt).toBeUndefined();
    });
  });

  describe('TDD 단계별 코멘트', () => {
    it('RED 단계 시작 코멘트를 생성해야 함', () => {
      const input: IssueCreateInput = {
        title: '기능 구현',
        description: '설명',
        type: 'feature',
        priority: 'medium',
      };

      const issue = manager.createIssue(input);
      const comment = manager.addTDDStageComment(issue.id, 'RED', 'start');

      expect(comment.stage).toBe('RED');
      expect(comment.action).toBe('start');
      expect(comment.content).toContain('🔴 RED 단계');
      expect(comment.content).toContain('시작');
    });

    it('GREEN 단계 완료 코멘트를 생성해야 함', () => {
      const input: IssueCreateInput = {
        title: '기능 구현',
        description: '설명',
        type: 'feature',
        priority: 'medium',
      };

      const issue = manager.createIssue(input);
      const comment = manager.addTDDStageComment(issue.id, 'GREEN', 'complete', '테스트 통과');

      expect(comment.stage).toBe('GREEN');
      expect(comment.action).toBe('complete');
      expect(comment.content).toContain('🟢 GREEN 단계');
      expect(comment.content).toContain('완료');
      expect(comment.content).toContain('테스트 통과');
    });

    it('REFACTOR 단계 코멘트를 생성해야 함', () => {
      const input: IssueCreateInput = {
        title: '기능 구현',
        description: '설명',
        type: 'feature',
        priority: 'medium',
      };

      const issue = manager.createIssue(input);
      const comment = manager.addTDDStageComment(issue.id, 'REFACTOR', 'complete');

      expect(comment.stage).toBe('REFACTOR');
      expect(comment.content).toContain('🔵 REFACTOR 단계');
    });

    it('Issue에 코멘트 히스토리를 유지해야 함', () => {
      const input: IssueCreateInput = {
        title: '기능 구현',
        description: '설명',
        type: 'feature',
        priority: 'medium',
      };

      const issue = manager.createIssue(input);
      manager.addTDDStageComment(issue.id, 'RED', 'start');
      manager.addTDDStageComment(issue.id, 'RED', 'complete');
      manager.addTDDStageComment(issue.id, 'GREEN', 'start');

      const updatedIssue = manager.getIssue(issue.id);

      expect(updatedIssue?.comments.length).toBe(3);
    });
  });

  describe('라벨 관리', () => {
    it('라벨을 추가해야 함', () => {
      const input: IssueCreateInput = {
        title: '테스트',
        description: '설명',
        type: 'feature',
        priority: 'medium',
      };

      const issue = manager.createIssue(input);
      const updated = manager.addLabel(issue.id, 'needs-review');

      expect(updated.labels).toContain('needs-review');
    });

    it('라벨을 제거해야 함', () => {
      const input: IssueCreateInput = {
        title: '테스트',
        description: '설명',
        type: 'feature',
        priority: 'medium',
      };

      const issue = manager.createIssue(input);
      manager.addLabel(issue.id, 'needs-review');
      const updated = manager.removeLabel(issue.id, 'needs-review');

      expect(updated.labels).not.toContain('needs-review');
    });

    it('상태 라벨은 하나만 유지해야 함', () => {
      const input: IssueCreateInput = {
        title: '테스트',
        description: '설명',
        type: 'feature',
        priority: 'medium',
      };

      const issue = manager.createIssue(input);
      manager.updateIssueStatus(issue.id, 'in_progress');
      const updated = manager.updateIssueStatus(issue.id, 'review');

      const statusLabels = updated.labels.filter((l) => l.startsWith('status:'));
      expect(statusLabels.length).toBe(1);
      expect(statusLabels[0]).toBe('status:review');
    });
  });

  describe('Issue 조회', () => {
    it('ID로 Issue를 조회해야 함', () => {
      const input: IssueCreateInput = {
        title: '테스트 Issue',
        description: '설명',
        type: 'feature',
        priority: 'medium',
      };

      const created = manager.createIssue(input);
      const found = manager.getIssue(created.id);

      expect(found).toBeDefined();
      expect(found?.title).toBe('테스트 Issue');
    });

    it('존재하지 않는 Issue는 undefined를 반환해야 함', () => {
      const found = manager.getIssue('non-existent-id');

      expect(found).toBeUndefined();
    });

    it('열린 Issue 목록을 조회해야 함', () => {
      manager.createIssue({
        title: 'Issue 1',
        description: '',
        type: 'feature',
        priority: 'low',
      });
      const issue2 = manager.createIssue({
        title: 'Issue 2',
        description: '',
        type: 'bug',
        priority: 'high',
      });
      manager.createIssue({
        title: 'Issue 3',
        description: '',
        type: 'feature',
        priority: 'medium',
      });

      manager.updateIssueStatus(issue2.id, 'completed');

      const openIssues = manager.getOpenIssues();

      expect(openIssues.length).toBe(2);
      expect(openIssues.every((i) => i.status !== 'completed')).toBe(true);
    });

    it('타입별로 Issue를 필터링해야 함', () => {
      manager.createIssue({
        title: 'Feature 1',
        description: '',
        type: 'feature',
        priority: 'low',
      });
      manager.createIssue({
        title: 'Bug 1',
        description: '',
        type: 'bug',
        priority: 'high',
      });
      manager.createIssue({
        title: 'Feature 2',
        description: '',
        type: 'feature',
        priority: 'medium',
      });

      const features = manager.getIssuesByType('feature');
      const bugs = manager.getIssuesByType('bug');

      expect(features.length).toBe(2);
      expect(bugs.length).toBe(1);
    });
  });

  describe('하위 작업 분해', () => {
    it('Issue를 하위 작업으로 분해해야 함', () => {
      const parentIssue = manager.createIssue({
        title: '대시보드 구현',
        description: '메인 대시보드 페이지 구현',
        type: 'feature',
        priority: 'high',
      });

      const subtasks = [
        { title: 'UI 컴포넌트 설계', description: '' },
        { title: 'API 엔드포인트 구현', description: '' },
        { title: '차트 라이브러리 연동', description: '' },
      ];

      const childIssues = manager.createSubtasks(parentIssue.id, subtasks);

      expect(childIssues.length).toBe(3);
      expect(childIssues[0].parentId).toBe(parentIssue.id);
      expect(childIssues[0].labels).toContain('subtask');
    });

    it('부모 Issue에 하위 작업 참조를 추가해야 함', () => {
      const parentIssue = manager.createIssue({
        title: '대시보드 구현',
        description: '',
        type: 'feature',
        priority: 'high',
      });

      manager.createSubtasks(parentIssue.id, [
        { title: '작업 1', description: '' },
        { title: '작업 2', description: '' },
      ]);

      const updated = manager.getIssue(parentIssue.id);

      expect(updated?.subtaskIds?.length).toBe(2);
    });
  });

  describe('라벨 생성 유틸리티', () => {
    it('우선순위 라벨을 생성해야 함', () => {
      expect(manager.createPriorityLabel('critical')).toBe('priority:critical');
      expect(manager.createPriorityLabel('high')).toBe('priority:high');
      expect(manager.createPriorityLabel('medium')).toBe('priority:medium');
      expect(manager.createPriorityLabel('low')).toBe('priority:low');
    });

    it('타입 라벨을 생성해야 함', () => {
      expect(manager.createTypeLabel('bug')).toBe('type:bug');
      expect(manager.createTypeLabel('feature')).toBe('type:feature');
      expect(manager.createTypeLabel('security')).toBe('type:security');
    });

    it('상태 라벨을 생성해야 함', () => {
      expect(manager.createStatusLabel('in_progress')).toBe('status:in-progress');
      expect(manager.createStatusLabel('review')).toBe('status:review');
      expect(manager.createStatusLabel('completed')).toBe('status:completed');
    });
  });
});
