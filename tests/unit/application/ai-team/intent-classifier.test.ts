/**
 * @fileoverview 자연어 의도 분류기 테스트
 * TDD RED 단계: 실패하는 테스트 먼저 작성
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IntentClassifier } from '@/application/use-cases/ai-team/intent-classifier';
import { CommandType } from '@/domain/services/ai-team-command-types';

describe('IntentClassifier', () => {
  let classifier: IntentClassifier;

  beforeEach(() => {
    classifier = new IntentClassifier();
  });

  describe('슬래시 명령어 호환성 (100% 신뢰도)', () => {
    it.each([
      ['/상태', CommandType.STATUS],
      ['/기능요청', CommandType.FEATURE_REQUEST],
      ['/버그신고', CommandType.BUG_REPORT],
      ['/검증', CommandType.VERIFY],
      ['/배포', CommandType.DEPLOY],
      ['/보고서', CommandType.REPORT],
      ['/변경사항', CommandType.CHANGELOG],
      ['/진행상황', CommandType.PROGRESS],
      ['/품질', CommandType.QUALITY],
      ['/보안', CommandType.SECURITY],
      ['/승인', CommandType.APPROVE],
      ['/거부', CommandType.REJECT],
      ['/롤백', CommandType.ROLLBACK],
      ['/문의', CommandType.HELP],
    ])('%s → %s (신뢰도 1.0)', (input, expected) => {
      const result = classifier.classify(input);

      expect(result.commandType).toBe(expected);
      expect(result.confidence).toBe(1.0);
      expect(result.requiresConfirmation).toBe(false);
    });

    it('슬래시 명령어는 확인 질문이 없어야 함', () => {
      const result = classifier.classify('/상태');

      expect(result.suggestedQuestion).toBeUndefined();
    });
  });

  describe('자연어 STATUS 의도 분류', () => {
    it.each([
      '현재 상태 어때?',
      '지금 시스템 상황이 어때',
      '프로젝트 현황 알려줘',
      '빌드 상태 확인해줘',
      '상태 좀 봐줘',
    ])('"%s" → STATUS', (input) => {
      const result = classifier.classify(input);

      expect(result.commandType).toBe(CommandType.STATUS);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('자연어 FEATURE_REQUEST 의도 분류', () => {
    it.each([
      '캠페인 필터링 기능 추가해줘',
      '새로운 대시보드 만들어줘',
      '사용자 인증 기능 개발해줘',
      '로그인 화면 구현해줘',
      '기능 하나 추가하고 싶어',
    ])('"%s" → FEATURE_REQUEST', (input) => {
      const result = classifier.classify(input);

      expect(result.commandType).toBe(CommandType.FEATURE_REQUEST);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('자연어 BUG_REPORT 의도 분류', () => {
    it.each([
      '로그인이 안 돼요',
      '버튼 클릭했는데 에러 나요',
      '데이터가 안 보여요',
      '오류가 발생했어요',
      '버그 있어요',
      '문제가 생겼어요',
    ])('"%s" → BUG_REPORT', (input) => {
      const result = classifier.classify(input);

      expect(result.commandType).toBe(CommandType.BUG_REPORT);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('자연어 VERIFY 의도 분류', () => {
    it.each([
      '테스트 돌려줘',
      '품질 검증해줘',
      '코드 체크해줘',
      '테스트 실행해줘',
      '검사해줘',
    ])('"%s" → VERIFY', (input) => {
      const result = classifier.classify(input);

      expect(result.commandType).toBe(CommandType.VERIFY);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('자연어 DEPLOY 의도 분류', () => {
    it.each([
      '배포해줘',
      '프로덕션에 올려줘',
      '릴리즈 진행해줘',
      '서버에 배포해줘',
      '라이브로 올려줘',
    ])('"%s" → DEPLOY', (input) => {
      const result = classifier.classify(input);

      expect(result.commandType).toBe(CommandType.DEPLOY);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('자연어 SECURITY 의도 분류', () => {
    it.each([
      '보안 검사해줘',
      '취약점 확인해줘',
      '보안 점검해줘',
    ])('"%s" → SECURITY', (input) => {
      const result = classifier.classify(input);

      expect(result.commandType).toBe(CommandType.SECURITY);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('자연어 ROLLBACK 의도 분류', () => {
    it.each([
      '롤백해줘',
      '이전 버전으로 되돌려줘',
      '복구해줘',
    ])('"%s" → ROLLBACK', (input) => {
      const result = classifier.classify(input);

      expect(result.commandType).toBe(CommandType.ROLLBACK);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('자연어 HELP 의도 분류', () => {
    it.each([
      '도와줘',
      '도움말',
      '뭘 할 수 있어?',
      '어떻게 사용해?',
    ])('"%s" → HELP', (input) => {
      const result = classifier.classify(input);

      expect(result.commandType).toBe(CommandType.HELP);
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('신뢰도 임계값 동작', () => {
    it('명확한 의도는 높은 신뢰도 (>= 0.8)', () => {
      const result = classifier.classify('테스트 실행해줘');

      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.requiresConfirmation).toBe(false);
    });

    it('중간 신뢰도 (0.5 ~ 0.8)는 확인 필요', () => {
      // "확인 좀" - VERIFY와 STATUS 모두 해당 가능한 모호한 입력
      const result = classifier.classify('확인 좀');

      expect(result.confidence).toBeGreaterThanOrEqual(0.3);
      expect(result.confidence).toBeLessThan(0.8);
      expect(result.requiresConfirmation).toBe(true);
      expect(result.suggestedQuestion).toBeDefined();
    });

    it('낮은 신뢰도 (< 0.5)는 명확화 요청', () => {
      const result = classifier.classify('안녕');

      expect(result.confidence).toBeLessThan(0.5);
      expect(result.requiresConfirmation).toBe(true);
      expect(result.suggestedQuestion).toBeDefined();
    });
  });

  describe('엣지 케이스', () => {
    it('빈 입력은 UNKNOWN 반환', () => {
      const result = classifier.classify('');

      expect(result.commandType).toBe(CommandType.UNKNOWN);
      expect(result.confidence).toBe(0);
    });

    it('공백만 있는 입력은 UNKNOWN 반환', () => {
      const result = classifier.classify('   ');

      expect(result.commandType).toBe(CommandType.UNKNOWN);
      expect(result.confidence).toBe(0);
    });

    it('특수문자만 있는 입력은 UNKNOWN 반환', () => {
      const result = classifier.classify('???');

      expect(result.commandType).toBe(CommandType.UNKNOWN);
      expect(result.confidence).toBeLessThan(0.3);
    });

    it('복합 의도는 가장 높은 점수 선택', () => {
      // "기능 추가하는데 버그 있어요" - 두 의도 혼재
      // BUG_REPORT가 더 긴급하므로 높은 가중치
      const result = classifier.classify('기능 추가하는데 버그 있어요');

      expect(result.commandType).toBe(CommandType.BUG_REPORT);
    });
  });

  describe('원본 입력 보존', () => {
    it('분류 결과에 원본 입력이 포함되어야 함', () => {
      const input = '캠페인 필터링 기능 추가해줘';
      const result = classifier.classify(input);

      expect(result.originalInput).toBe(input);
    });
  });

  describe('매칭 패턴 추적', () => {
    it('분류 결과에 매칭된 패턴이 포함되어야 함', () => {
      const result = classifier.classify('테스트 돌려줘');

      expect(result.matchedPatterns).toBeDefined();
      expect(result.matchedPatterns.length).toBeGreaterThan(0);
    });
  });

  describe('확인 질문 생성', () => {
    it('낮은 신뢰도 시 적절한 확인 질문 생성', () => {
      const result = classifier.classify('이거 좀 봐줘');

      if (result.requiresConfirmation) {
        expect(result.suggestedQuestion).toContain('시려는');
      }
    });
  });
});
