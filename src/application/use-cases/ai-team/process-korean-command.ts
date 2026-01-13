/**
 * @fileoverview 한국어 명령어 처리 유스케이스
 * 클린 아키텍처: Application 계층 - 비즈니스 로직 조율
 *
 * 자연어 의도 파악 기반으로 동작합니다.
 * 슬래시 명령어와 자연어 모두 지원합니다.
 */

import {
  CommandType,
  CommandResult,
  IntentClassificationResult,
  DEFAULT_CONFIDENCE_THRESHOLDS,
} from '@/domain/services/ai-team-command-types';
import { AITeamPort } from '@/application/ports/ai-team-port';
import { IntentClassifier } from './intent-classifier';

/**
 * 한국어 명령어 처리 유스케이스
 *
 * 사용 예시:
 * - 슬래시 명령어: "/상태", "/배포", "/보고서 주간"
 * - 자연어: "캠페인 필터링 기능 추가해줘", "현재 상태 어때?", "테스트 돌려줘"
 */
export class ProcessKoreanCommandUseCase {
  private readonly intentClassifier: IntentClassifier;

  constructor(
    private readonly aiTeamPort: AITeamPort,
    intentClassifier?: IntentClassifier
  ) {
    this.intentClassifier = intentClassifier ?? new IntentClassifier();
  }

  /**
   * 명령어 실행
   * @param input 사용자 입력 (슬래시 명령어 또는 자연어)
   */
  async execute(input: string): Promise<CommandResult> {
    // 빈 입력 검증
    if (!input || input.trim() === '') {
      return {
        success: false,
        commandType: CommandType.UNKNOWN,
        error: '명령어를 입력해주세요.',
      };
    }

    // 의도 분류
    const classification = this.intentClassifier.classify(input);

    // 분류 불가
    if (classification.commandType === CommandType.UNKNOWN) {
      return this.handleUnknownIntent(classification);
    }

    // 확인 필요한 경우 (낮은 신뢰도)
    if (classification.requiresConfirmation) {
      return this.handleConfirmationRequired(classification);
    }

    // 정상 처리
    return {
      success: true,
      commandType: classification.commandType,
      parameters: classification.parameters,
      message: this.getSuccessMessage(classification),
    };
  }

  /**
   * 알 수 없는 의도 처리
   */
  private handleUnknownIntent(
    classification: IntentClassificationResult
  ): CommandResult {
    return {
      success: false,
      commandType: CommandType.UNKNOWN,
      error: '요청을 이해하지 못했습니다. 다시 말씀해 주세요.',
      data: {
        suggestedQuestion: classification.suggestedQuestion,
        originalInput: classification.originalInput,
      },
    };
  }

  /**
   * 확인이 필요한 의도 처리
   */
  private handleConfirmationRequired(
    classification: IntentClassificationResult
  ): CommandResult {
    const confidencePercent = Math.round(classification.confidence * 100);

    return {
      success: true,
      commandType: classification.commandType,
      parameters: classification.parameters,
      message: classification.suggestedQuestion,
      data: {
        requiresConfirmation: true,
        confidence: classification.confidence,
        confidencePercent,
        matchedPatterns: classification.matchedPatterns,
        originalInput: classification.originalInput,
      },
    };
  }

  /**
   * 성공 메시지 생성
   */
  private getSuccessMessage(
    classification: IntentClassificationResult
  ): string {
    const messages: Partial<Record<CommandType, string>> = {
      [CommandType.STATUS]: '시스템 상태를 확인합니다.',
      [CommandType.FEATURE_REQUEST]: '기능 요청을 접수합니다.',
      [CommandType.BUG_REPORT]: '버그 신고를 접수합니다.',
      [CommandType.VERIFY]: '테스트를 실행합니다.',
      [CommandType.DEPLOY]: '배포를 준비합니다.',
      [CommandType.REPORT]: '보고서를 생성합니다.',
      [CommandType.CHANGELOG]: '변경 내역을 확인합니다.',
      [CommandType.PROGRESS]: '진행 상황을 확인합니다.',
      [CommandType.QUALITY]: '품질 정보를 확인합니다.',
      [CommandType.SECURITY]: '보안 검사를 실행합니다.',
      [CommandType.APPROVE]: '승인을 진행합니다.',
      [CommandType.REJECT]: '거부를 진행합니다.',
      [CommandType.ROLLBACK]: '롤백을 준비합니다.',
      [CommandType.HELP]: '도움말을 표시합니다.',
    };

    return messages[classification.commandType] ?? '요청을 처리합니다.';
  }

  /**
   * 확인 응답 처리
   * 사용자가 "예" 또는 "아니오"로 응답했을 때 호출
   */
  async processConfirmation(
    confirmed: boolean,
    previousClassification: IntentClassificationResult
  ): Promise<CommandResult> {
    if (!confirmed) {
      return {
        success: false,
        commandType: CommandType.UNKNOWN,
        message: '취소되었습니다. 다시 말씀해 주세요.',
      };
    }

    return {
      success: true,
      commandType: previousClassification.commandType,
      parameters: previousClassification.parameters,
      message: this.getSuccessMessage(previousClassification),
    };
  }

  /**
   * 분류 결과만 반환 (테스트/디버깅용)
   */
  classifyOnly(input: string): IntentClassificationResult {
    return this.intentClassifier.classify(input);
  }

  /**
   * 신뢰도 임계값 확인
   */
  getConfidenceThresholds() {
    return DEFAULT_CONFIDENCE_THRESHOLDS;
  }
}
