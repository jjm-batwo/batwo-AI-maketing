/**
 * @fileoverview 자연어 의도 분류기
 * 클린 아키텍처: Application 계층 - 규칙 기반 의도 분류
 */

import {
  CommandType,
  CommandParameters,
  IntentPattern,
  IntentClassificationResult,
  IntentScoreResult,
  ConfidenceThresholds,
  DEFAULT_CONFIDENCE_THRESHOLDS,
  ReportType,
} from '@/domain/services/ai-team-command-types';

/**
 * 슬래시 명령어 매핑 (기존 호환성)
 */
const SLASH_COMMAND_MAP: Record<string, CommandType> = {
  // 한국어 명령어
  상태: CommandType.STATUS,
  기능요청: CommandType.FEATURE_REQUEST,
  버그신고: CommandType.BUG_REPORT,
  검증: CommandType.VERIFY,
  배포: CommandType.DEPLOY,
  보고서: CommandType.REPORT,
  변경사항: CommandType.CHANGELOG,
  진행상황: CommandType.PROGRESS,
  품질: CommandType.QUALITY,
  보안: CommandType.SECURITY,
  수정: CommandType.FIX,
  승인: CommandType.APPROVE,
  거부: CommandType.REJECT,
  롤백: CommandType.ROLLBACK,
  문의: CommandType.HELP,
  // 별칭
  현황: CommandType.STATUS,
  테스트: CommandType.VERIFY,
  새기능: CommandType.FEATURE_REQUEST,
  // 영어 명령어
  status: CommandType.STATUS,
  feature: CommandType.FEATURE_REQUEST,
  bug: CommandType.BUG_REPORT,
  verify: CommandType.VERIFY,
  deploy: CommandType.DEPLOY,
  report: CommandType.REPORT,
  changelog: CommandType.CHANGELOG,
  progress: CommandType.PROGRESS,
  quality: CommandType.QUALITY,
  security: CommandType.SECURITY,
  fix: CommandType.FIX,
  approve: CommandType.APPROVE,
  reject: CommandType.REJECT,
  rollback: CommandType.ROLLBACK,
  help: CommandType.HELP,
};

/**
 * 기본 의도 패턴 정의
 */
const DEFAULT_INTENT_PATTERNS: IntentPattern[] = [
  // STATUS
  {
    commandType: CommandType.STATUS,
    keywords: ['상태', '현황', '현재', '지금', '어때', '상황', '봐줘'],
    phrases: ['어떻게 돼', '상황이 어때', '진행 상황', '빌드 상태', '상태 봐', '현황 알려', '상태 확인', '좀 봐줘', '이거 봐', '봐줘'],
    contextClues: ['시스템', '프로젝트', '전체', '빌드'],
    weight: 1.0,
  },

  // FEATURE_REQUEST
  {
    commandType: CommandType.FEATURE_REQUEST,
    keywords: ['기능', '추가', '만들어', '개발', '구현', '새로운', '생성'],
    phrases: ['기능 추가', '만들어줘', '개발해줘', '구현해줘', '추가해줘', '하나 추가'],
    negativeKeywords: ['버그', '오류', '에러', '안돼', '문제'],
    contextClues: ['사용자', '화면', 'UI', 'API', '페이지', '버튼'],
    weight: 1.0,
  },

  // BUG_REPORT
  {
    commandType: CommandType.BUG_REPORT,
    keywords: ['버그', '오류', '에러', '안돼', '안됨', '문제', '고장', '안되', '안 돼'],
    phrases: ['안 돼요', '동작 안해', '에러 나요', '오류 발생', '문제 있어', '안 보여', '작동 안해', '버그 있', '문제가 생', '오류가'],
    negativeKeywords: ['수정 완료', '고쳤'],
    contextClues: ['클릭', '버튼', '페이지', '로딩'],
    weight: 1.5, // 긴급성으로 인해 높은 가중치
  },

  // VERIFY
  {
    commandType: CommandType.VERIFY,
    keywords: ['테스트', '검증', '체크', '검사'],
    phrases: ['테스트 돌려', '검증해줘', '테스트 실행', '체크해줘', '코드 체크', '검사해줘'],
    negativeKeywords: ['보안', '취약점'],
    contextClues: ['품질', '코드', '기능', '유닛', '통합'],
    weight: 1.0,
  },

  // DEPLOY
  {
    commandType: CommandType.DEPLOY,
    keywords: ['배포', '릴리즈', '출시', '프로덕션', '라이브', '서버'],
    phrases: ['배포해줘', '릴리즈해줘', '릴리즈 진행', '프로덕션에 올려', '라이브로', '서버에 올려', '서버에 배포'],
    contextClues: ['운영', '환경', '버전'],
    weight: 1.0,
  },

  // SECURITY (VERIFY보다 먼저 체크되도록 weight 높임)
  {
    commandType: CommandType.SECURITY,
    keywords: ['보안', '취약점', '시큐리티', '해킹', '인증'],
    phrases: ['보안 검사', '취약점 확인', '보안 점검', '보안 체크', '취약점 검사'],
    contextClues: ['API', '인증', '토큰', '비밀번호'],
    weight: 1.3,
  },

  // ROLLBACK
  {
    commandType: CommandType.ROLLBACK,
    keywords: ['롤백', '되돌려', '복구', '이전', '원복'],
    phrases: ['이전 버전', '되돌려줘', '롤백해줘', '복구해줘', '원래대로'],
    contextClues: ['버전', '배포', '코드'],
    weight: 1.0,
  },

  // REPORT
  {
    commandType: CommandType.REPORT,
    keywords: ['보고서', '리포트', '요약', '통계'],
    phrases: ['보고서 생성', '리포트 만들어', '요약해줘', '보고서 줘'],
    contextClues: ['일일', '주간', '월간', '성과'],
    weight: 1.0,
  },

  // PROGRESS
  {
    commandType: CommandType.PROGRESS,
    keywords: ['진행', '진척', '작업'],
    phrases: ['진행 상황', '진척도', '작업 현황', '뭐하고 있어'],
    contextClues: ['현재', '이슈', '태스크'],
    weight: 1.0,
  },

  // HELP
  {
    commandType: CommandType.HELP,
    keywords: ['도움', '도와', '어떻게', '사용법', '가이드', '뭘'],
    phrases: ['도와줘', '도움말', '뭘 할 수 있', '어떻게 사용', '사용법 알려', '할 수 있어'],
    contextClues: ['명령어', '기능'],
    weight: 1.0,
  },

  // APPROVE
  {
    commandType: CommandType.APPROVE,
    keywords: ['승인', '허가', '허락', '확인'],
    phrases: ['승인해줘', '허가해줘', '진행해도 돼'],
    contextClues: ['배포', '변경', '요청'],
    weight: 1.0,
  },

  // REJECT
  {
    commandType: CommandType.REJECT,
    keywords: ['거부', '거절', '취소', '반려'],
    phrases: ['거부해줘', '취소해줘', '반려해줘', '하지마'],
    contextClues: ['요청', '작업'],
    weight: 1.0,
  },

  // QUALITY
  {
    commandType: CommandType.QUALITY,
    keywords: ['품질', '커버리지', '린트'],
    phrases: ['품질 확인', '커버리지 봐', '린트 결과'],
    contextClues: ['코드', '테스트'],
    weight: 1.0,
  },

  // CHANGELOG
  {
    commandType: CommandType.CHANGELOG,
    keywords: ['변경', '수정', '업데이트', '히스토리'],
    phrases: ['변경 내역', '수정 사항', '뭐가 바뀌었', '변경사항 알려'],
    contextClues: ['최근', '코드', '파일'],
    weight: 1.0,
  },
];

/**
 * 명령어 설명 (확인 질문용)
 */
const COMMAND_DESCRIPTIONS: Partial<Record<CommandType, string>> = {
  [CommandType.STATUS]: '시스템 상태를 확인',
  [CommandType.FEATURE_REQUEST]: '새 기능을 요청',
  [CommandType.BUG_REPORT]: '버그를 신고',
  [CommandType.VERIFY]: '테스트를 실행',
  [CommandType.DEPLOY]: '배포를 진행',
  [CommandType.SECURITY]: '보안 검사를 실행',
  [CommandType.ROLLBACK]: '이전 버전으로 롤백',
  [CommandType.REPORT]: '보고서를 생성',
  [CommandType.PROGRESS]: '진행 상황을 확인',
  [CommandType.HELP]: '도움말을 표시',
  [CommandType.APPROVE]: '승인을 진행',
  [CommandType.REJECT]: '거부를 진행',
  [CommandType.QUALITY]: '품질 정보를 확인',
  [CommandType.CHANGELOG]: '변경 내역을 확인',
};

/**
 * 자연어 의도 분류기
 */
export class IntentClassifier {
  private readonly patterns: IntentPattern[];
  private readonly thresholds: ConfidenceThresholds;

  constructor(
    patterns?: IntentPattern[],
    thresholds?: ConfidenceThresholds
  ) {
    this.patterns = patterns ?? DEFAULT_INTENT_PATTERNS;
    this.thresholds = thresholds ?? DEFAULT_CONFIDENCE_THRESHOLDS;
  }

  /**
   * 사용자 입력을 분류하여 의도 반환
   */
  classify(input: string): IntentClassificationResult {
    const trimmedInput = input.trim();

    // 빈 입력 처리
    if (!trimmedInput) {
      return this.createUnknownResult(input, 0);
    }

    // 슬래시 명령어 우선 처리 (100% 신뢰도)
    if (trimmedInput.startsWith('/')) {
      return this.handleSlashCommand(trimmedInput);
    }

    // 자연어 분류
    return this.classifyNaturalLanguage(trimmedInput);
  }

  /**
   * 슬래시 명령어 처리
   */
  private handleSlashCommand(input: string): IntentClassificationResult {
    const withoutSlash = input.slice(1);
    const parts = withoutSlash.split(/\s+/);
    const commandName = parts[0].toLowerCase();

    const commandType = SLASH_COMMAND_MAP[commandName];

    if (!commandType) {
      return this.createUnknownResult(input, 0);
    }

    const parameters = this.extractSlashParameters(commandType, parts.slice(1));

    return {
      commandType,
      confidence: 1.0,
      matchedPatterns: [`slash:${commandName}`],
      requiresConfirmation: false,
      originalInput: input,
      parameters,
    };
  }

  /**
   * 슬래시 명령어 파라미터 추출
   */
  private extractSlashParameters(
    commandType: CommandType,
    args: string[]
  ): CommandParameters | undefined {
    switch (commandType) {
      case CommandType.REPORT:
        return this.extractReportParameters(args);
      case CommandType.FIX:
        return this.extractFixParameters(args);
      default:
        return undefined;
    }
  }

  /**
   * 보고서 파라미터 추출
   */
  private extractReportParameters(args: string[]): CommandParameters {
    const reportTypeMap: Record<string, ReportType> = {
      일일: 'daily',
      주간: 'weekly',
      월간: 'monthly',
      daily: 'daily',
      weekly: 'weekly',
      monthly: 'monthly',
    };
    const reportTypeArg = args[0]?.toLowerCase();
    const reportType = reportTypeMap[reportTypeArg] || 'daily';
    return { reportType };
  }

  /**
   * 수정 명령어 파라미터 추출
   */
  private extractFixParameters(args: string[]): CommandParameters {
    const issueArg = args[0];
    if (issueArg && issueArg.startsWith('#')) {
      const issueNumber = parseInt(issueArg.slice(1), 10);
      if (!isNaN(issueNumber)) {
        return { issueNumber };
      }
    }
    return {};
  }

  /**
   * 자연어 분류
   */
  private classifyNaturalLanguage(input: string): IntentClassificationResult {
    const normalizedInput = this.normalizeInput(input);
    const scores = this.calculateScores(normalizedInput);
    const topResult = this.selectBestMatch(scores);

    const requiresConfirmation = topResult.score < this.thresholds.high;

    return {
      commandType: topResult.commandType,
      confidence: topResult.score,
      matchedPatterns: topResult.matchedPatterns,
      requiresConfirmation,
      suggestedQuestion: requiresConfirmation
        ? this.generateConfirmationQuestion(topResult)
        : undefined,
      originalInput: input,
      parameters: this.extractNaturalParameters(input, topResult.commandType),
    };
  }

  /**
   * 입력 정규화
   */
  private normalizeInput(input: string): string {
    return input
      .toLowerCase()
      .replace(/[?!.,]/g, '')
      .trim();
  }

  /**
   * 토큰화
   */
  private tokenize(input: string): string[] {
    return input.split(/\s+/).filter(Boolean);
  }

  /**
   * 각 패턴별 점수 계산
   */
  private calculateScores(input: string): Map<CommandType, IntentScoreResult> {
    const scores = new Map<CommandType, IntentScoreResult>();
    const tokens = this.tokenize(input);

    for (const pattern of this.patterns) {
      let score = 0;
      const matchedPatterns: string[] = [];

      // 1. 키워드 매칭 (가중치: 0.3)
      for (const keyword of pattern.keywords) {
        if (tokens.includes(keyword) || input.includes(keyword)) {
          score += 0.3;
          matchedPatterns.push(`keyword:${keyword}`);
        }
      }

      // 2. 구문 매칭 (가중치: 0.5)
      for (const phrase of pattern.phrases) {
        if (input.includes(phrase)) {
          score += 0.5;
          matchedPatterns.push(`phrase:${phrase}`);
        }
      }

      // 3. 맥락 단서 매칭 (가중치: 0.1)
      for (const clue of pattern.contextClues ?? []) {
        if (input.includes(clue)) {
          score += 0.1;
          matchedPatterns.push(`context:${clue}`);
        }
      }

      // 4. 제외 키워드 페널티 (가중치: -0.4)
      for (const negative of pattern.negativeKeywords ?? []) {
        if (tokens.includes(negative) || input.includes(negative)) {
          score -= 0.4;
          matchedPatterns.push(`negative:${negative}`);
        }
      }

      // 가중치 적용 및 정규화
      score = Math.min(1.0, Math.max(0, score * pattern.weight));

      scores.set(pattern.commandType, {
        commandType: pattern.commandType,
        score,
        matchedPatterns,
      });
    }

    return scores;
  }

  /**
   * 최고 점수 선택
   */
  private selectBestMatch(
    scores: Map<CommandType, IntentScoreResult>
  ): IntentScoreResult {
    let bestResult: IntentScoreResult = {
      commandType: CommandType.UNKNOWN,
      score: 0,
      matchedPatterns: [],
    };

    for (const result of scores.values()) {
      if (result.score > bestResult.score) {
        bestResult = result;
      }
    }

    return bestResult;
  }

  /**
   * 확인 질문 생성
   */
  private generateConfirmationQuestion(result: IntentScoreResult): string {
    const description = COMMAND_DESCRIPTIONS[result.commandType];
    const confidencePercent = Math.round(result.score * 100);

    if (result.score < this.thresholds.medium) {
      return `의도를 정확히 파악하기 어렵습니다. "${description}"하시려는 건가요? (예/아니오)`;
    }

    return `"${description}"하시려는 것으로 이해했습니다 (확신도: ${confidencePercent}%). 맞나요? (예/아니오)`;
  }

  /**
   * 자연어에서 파라미터 추출
   */
  private extractNaturalParameters(
    input: string,
    commandType: CommandType
  ): CommandParameters | undefined {
    switch (commandType) {
      case CommandType.FEATURE_REQUEST:
      case CommandType.BUG_REPORT:
        return { description: input };
      default:
        return undefined;
    }
  }

  /**
   * UNKNOWN 결과 생성
   */
  private createUnknownResult(
    input: string,
    confidence: number
  ): IntentClassificationResult {
    return {
      commandType: CommandType.UNKNOWN,
      confidence,
      matchedPatterns: [],
      requiresConfirmation: true,
      suggestedQuestion: '어떤 작업을 원하시나요? 다시 말씀해 주세요.',
      originalInput: input,
    };
  }
}
