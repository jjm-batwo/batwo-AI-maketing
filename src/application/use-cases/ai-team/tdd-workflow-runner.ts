/**
 * @fileoverview TDD 워크플로우 러너
 * 클린 아키텍처: Application 계층 - TDD 워크플로우 관리
 *
 * 역할:
 * - TDD 워크플로우 생성 및 관리
 * - 단계 전환 (RED → GREEN → REFACTOR → COMPLETE)
 * - 각 단계별 가이드 제공
 * - 단계 검증 (테스트 상태 확인)
 */

import {
  TDDStage,
  TDDWorkflowState,
  TDDStageTransitionResult,
  TDDStageGuide,
  TDDValidationInput,
  TDDValidationResult,
  TDDHistoryEntry,
} from '@/domain/services/ai-team-command-types'

/**
 * 단계별 가이드 설정
 */
const STAGE_GUIDES: Record<TDDStage, { instructions: string; checklist: string[] }> = {
  RED: {
    instructions:
      '🔴 RED 단계: 실패하는 테스트를 먼저 작성합니다. 테스트는 아직 구현되지 않은 기능을 검증해야 합니다.',
    checklist: [
      '테스트 파일 생성',
      '테스트 케이스 작성',
      '테스트 실행하여 실패 확인',
      '에러 메시지가 명확한지 확인',
    ],
  },
  GREEN: {
    instructions:
      '🟢 GREEN 단계: 테스트를 통과하는 최소 구현을 작성합니다. 완벽한 코드가 아니어도 됩니다.',
    checklist: [
      '테스트 통과에 필요한 최소 코드 작성',
      '클린 아키텍처 계층 규칙 준수',
      '테스트 실행하여 통과 확인',
      '다른 테스트가 깨지지 않았는지 확인',
    ],
  },
  REFACTOR: {
    instructions: '🔵 REFACTOR 단계: 코드를 정리하고 개선합니다. 테스트가 계속 통과해야 합니다.',
    checklist: [
      '중복 코드 제거',
      '명확한 변수/함수 이름 사용',
      '필요시 추상화 도입',
      '테스트가 여전히 통과하는지 확인',
    ],
  },
  COMPLETE: {
    instructions: '✅ COMPLETE: TDD 사이클이 완료되었습니다.',
    checklist: ['코드 리뷰 요청', '문서 업데이트', 'PR 생성 준비'],
  },
}

/**
 * 단계 순서 정의
 */
const STAGE_ORDER: TDDStage[] = ['RED', 'GREEN', 'REFACTOR', 'COMPLETE']

/**
 * TDD 워크플로우 러너
 */
export class TDDWorkflowRunner {
  private workflows: Map<string, TDDWorkflowState> = new Map()
  private histories: Map<string, TDDHistoryEntry[]> = new Map()
  private idCounter = 0

  /**
   * 새 워크플로우 생성
   */
  createWorkflow(featureDescription: string): TDDWorkflowState {
    const id = `tdd-${++this.idCounter}-${Date.now()}`
    const now = new Date()

    const workflow: TDDWorkflowState = {
      id,
      featureDescription,
      currentStage: 'RED',
      stages: ['RED', 'GREEN', 'REFACTOR'],
      progress: 0,
      createdAt: now,
      updatedAt: now,
    }

    this.workflows.set(id, workflow)
    this.histories.set(id, [{ stage: 'RED', timestamp: now }])

    return workflow
  }

  /**
   * 다음 단계로 전환
   */
  advanceStage(workflowId: string): TDDStageTransitionResult {
    const workflow = this.workflows.get(workflowId)

    if (!workflow) {
      return {
        success: false,
        error: `워크플로우를 찾을 수 없습니다: ${workflowId}`,
      }
    }

    const currentIndex = STAGE_ORDER.indexOf(workflow.currentStage)
    const nextIndex = currentIndex + 1

    if (nextIndex >= STAGE_ORDER.length) {
      return {
        success: false,
        error: '이미 완료된 워크플로우입니다.',
      }
    }

    const nextStage = STAGE_ORDER[nextIndex]
    const now = new Date()

    workflow.currentStage = nextStage
    workflow.progress = Math.round((nextIndex / (STAGE_ORDER.length - 1)) * 100)
    workflow.updatedAt = now

    // 이력 추가
    const history = this.histories.get(workflowId) || []
    history.push({ stage: nextStage, timestamp: now })

    return {
      success: true,
      workflow: { ...workflow },
    }
  }

  /**
   * 단계별 가이드 조회
   */
  getStageGuide(workflowId: string): TDDStageGuide {
    const workflow = this.workflows.get(workflowId)
    const stage = workflow?.currentStage || 'RED'
    const guide = STAGE_GUIDES[stage]

    return {
      stage,
      instructions: guide.instructions,
      checklist: guide.checklist,
    }
  }

  /**
   * 단계 검증
   */
  async validateStage(workflowId: string, input: TDDValidationInput): Promise<TDDValidationResult> {
    const workflow = this.workflows.get(workflowId)

    if (!workflow) {
      return {
        canAdvance: false,
        errors: ['워크플로우를 찾을 수 없습니다.'],
      }
    }

    const { currentStage } = workflow

    // RED 단계: 테스트가 실패해야 함
    if (currentStage === 'RED') {
      if (!input.testsExist) {
        return {
          canAdvance: false,
          warning: 'RED 단계에서는 테스트가 존재해야 합니다.',
        }
      }

      if (input.testsPassing) {
        return {
          canAdvance: false,
          warning: 'RED 단계에서는 테스트가 실패해야 합니다. 실패하는 테스트를 먼저 작성하세요.',
        }
      }

      return { canAdvance: true }
    }

    // GREEN 단계: 테스트가 통과해야 함
    if (currentStage === 'GREEN') {
      if (!input.testsPassing) {
        return {
          canAdvance: false,
          errors: ['GREEN 단계에서는 테스트가 통과해야 합니다.'],
        }
      }

      return { canAdvance: true }
    }

    // REFACTOR 단계: 테스트가 여전히 통과해야 함
    if (currentStage === 'REFACTOR') {
      if (!input.testsPassing) {
        return {
          canAdvance: false,
          errors: ['REFACTOR 단계에서도 테스트가 통과해야 합니다.'],
        }
      }

      return { canAdvance: true }
    }

    // COMPLETE 단계
    return { canAdvance: false }
  }

  /**
   * 워크플로우 상태 조회
   */
  getWorkflowStatus(workflowId: string): TDDWorkflowState | undefined {
    const workflow = this.workflows.get(workflowId)
    return workflow ? { ...workflow } : undefined
  }

  /**
   * 워크플로우 이력 조회
   */
  getWorkflowHistory(workflowId: string): TDDHistoryEntry[] {
    return this.histories.get(workflowId) || []
  }
}
