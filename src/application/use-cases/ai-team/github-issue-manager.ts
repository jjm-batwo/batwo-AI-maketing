/**
 * @fileoverview GitHub Issue 관리자
 * 클린 아키텍처: Application 계층 - Issue 관리 유스케이스
 *
 * 역할:
 * - Issue 생성 및 관리
 * - TDD 단계별 코멘트 자동화
 * - 라벨 관리
 * - 하위 작업 분해
 */

import { TDDStage } from '@/domain/services/ai-team-command-types'

/**
 * Issue 우선순위
 */
export type IssuePriority = 'critical' | 'high' | 'medium' | 'low'

/**
 * Issue 유형
 */
export type IssueType = 'feature' | 'bug' | 'security' | 'docs' | 'refactor'

/**
 * Issue 상태
 */
export type IssueStatus = 'open' | 'in_progress' | 'review' | 'completed'

/**
 * Issue 라벨
 */
export type IssueLabel = string

/**
 * TDD 단계 액션
 */
export type TDDAction = 'start' | 'complete' | 'failed'

/**
 * Issue 생성 입력
 */
export interface IssueCreateInput {
  title: string
  description: string
  type: IssueType
  priority: IssuePriority
}

/**
 * Issue 업데이트 입력
 */
export interface IssueUpdateInput {
  title?: string
  description?: string
  priority?: IssuePriority
}

/**
 * TDD 단계 코멘트
 */
export interface TDDStageComment {
  id: string
  stage: TDDStage
  action: TDDAction
  content: string
  createdAt: Date
  details?: string
}

/**
 * 하위 작업 입력
 */
export interface SubtaskInput {
  title: string
  description: string
}

/**
 * Issue
 */
export interface Issue {
  id: string
  title: string
  description: string
  type: IssueType
  priority: IssuePriority
  status: IssueStatus
  labels: IssueLabel[]
  comments: TDDStageComment[]
  parentId?: string
  subtaskIds?: string[]
  createdAt: Date
  updatedAt: Date
  closedAt?: Date
}

/**
 * 상태 라벨 매핑
 */
const STATUS_LABELS: Record<IssueStatus, string> = {
  open: 'status:open',
  in_progress: 'status:in-progress',
  review: 'status:review',
  completed: 'status:completed',
}

/**
 * TDD 단계 이모지
 */
const TDD_STAGE_EMOJIS: Record<TDDStage, string> = {
  RED: '🔴',
  GREEN: '🟢',
  REFACTOR: '🔵',
  COMPLETE: '✅',
}

/**
 * TDD 액션 한국어
 */
const TDD_ACTION_KOREAN: Record<TDDAction, string> = {
  start: '시작',
  complete: '완료',
  failed: '실패',
}

/**
 * GitHub Issue 관리자
 */
export class GitHubIssueManager {
  private issues: Map<string, Issue> = new Map()
  private issueCounter = 0
  private commentCounter = 0

  /**
   * Issue 생성
   */
  createIssue(input: IssueCreateInput): Issue {
    const id = this.generateIssueId()
    const now = new Date()

    const labels: IssueLabel[] = [
      this.createTypeLabel(input.type),
      this.createPriorityLabel(input.priority),
    ]

    const issue: Issue = {
      id,
      title: input.title,
      description: input.description,
      type: input.type,
      priority: input.priority,
      status: 'open',
      labels,
      comments: [],
      createdAt: now,
      updatedAt: now,
    }

    this.issues.set(id, issue)
    return issue
  }

  /**
   * Issue 상태 업데이트
   */
  updateIssueStatus(issueId: string, status: IssueStatus): Issue {
    const issue = this.issues.get(issueId)
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`)
    }

    // 기존 상태 라벨 제거
    issue.labels = issue.labels.filter((l) => !l.startsWith('status:'))

    // 새 상태 라벨 추가
    issue.labels.push(STATUS_LABELS[status])
    issue.status = status
    issue.updatedAt = new Date()

    // 완료 시 closedAt 설정
    if (status === 'completed') {
      issue.closedAt = new Date()
    } else if (issue.closedAt) {
      // 다시 열 때 closedAt 제거
      issue.closedAt = undefined
    }

    this.issues.set(issueId, issue)
    return issue
  }

  /**
   * TDD 단계 코멘트 추가
   */
  addTDDStageComment(
    issueId: string,
    stage: TDDStage,
    action: TDDAction,
    details?: string
  ): TDDStageComment {
    const issue = this.issues.get(issueId)
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`)
    }

    const emoji = TDD_STAGE_EMOJIS[stage]
    const actionKorean = TDD_ACTION_KOREAN[action]

    let content = `${emoji} ${stage} 단계 ${actionKorean}`
    if (details) {
      content += `\n\n${details}`
    }

    const comment: TDDStageComment = {
      id: this.generateCommentId(),
      stage,
      action,
      content,
      createdAt: new Date(),
      details,
    }

    issue.comments.push(comment)
    issue.updatedAt = new Date()
    this.issues.set(issueId, issue)

    return comment
  }

  /**
   * Issue 조회
   */
  getIssue(issueId: string): Issue | undefined {
    return this.issues.get(issueId)
  }

  /**
   * 열린 Issue 목록 조회
   */
  getOpenIssues(): Issue[] {
    return Array.from(this.issues.values()).filter((i) => i.status !== 'completed')
  }

  /**
   * 타입별 Issue 조회
   */
  getIssuesByType(type: IssueType): Issue[] {
    return Array.from(this.issues.values()).filter((i) => i.type === type)
  }

  /**
   * 라벨 추가
   */
  addLabel(issueId: string, label: IssueLabel): Issue {
    const issue = this.issues.get(issueId)
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`)
    }

    if (!issue.labels.includes(label)) {
      issue.labels.push(label)
      issue.updatedAt = new Date()
      this.issues.set(issueId, issue)
    }

    return issue
  }

  /**
   * 라벨 제거
   */
  removeLabel(issueId: string, label: IssueLabel): Issue {
    const issue = this.issues.get(issueId)
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`)
    }

    issue.labels = issue.labels.filter((l) => l !== label)
    issue.updatedAt = new Date()
    this.issues.set(issueId, issue)

    return issue
  }

  /**
   * 하위 작업 생성
   */
  createSubtasks(parentId: string, subtasks: SubtaskInput[]): Issue[] {
    const parentIssue = this.issues.get(parentId)
    if (!parentIssue) {
      throw new Error(`Parent issue not found: ${parentId}`)
    }

    const childIssues: Issue[] = []

    for (const subtask of subtasks) {
      const childIssue = this.createIssue({
        title: subtask.title,
        description: subtask.description,
        type: parentIssue.type,
        priority: parentIssue.priority,
      })

      // 자식 Issue에 부모 참조 및 라벨 추가
      childIssue.parentId = parentId
      childIssue.labels.push('subtask')
      this.issues.set(childIssue.id, childIssue)

      childIssues.push(childIssue)
    }

    // 부모 Issue에 자식 ID 목록 추가
    parentIssue.subtaskIds = parentIssue.subtaskIds || []
    parentIssue.subtaskIds.push(...childIssues.map((c) => c.id))
    parentIssue.updatedAt = new Date()
    this.issues.set(parentId, parentIssue)

    return childIssues
  }

  /**
   * 우선순위 라벨 생성
   */
  createPriorityLabel(priority: IssuePriority): string {
    return `priority:${priority}`
  }

  /**
   * 타입 라벨 생성
   */
  createTypeLabel(type: IssueType): string {
    return `type:${type}`
  }

  /**
   * 상태 라벨 생성
   */
  createStatusLabel(status: IssueStatus): string {
    return STATUS_LABELS[status]
  }

  /**
   * Issue ID 생성
   */
  private generateIssueId(): string {
    this.issueCounter++
    return `issue-${this.issueCounter}`
  }

  /**
   * 코멘트 ID 생성
   */
  private generateCommentId(): string {
    this.commentCounter++
    return `comment-${this.commentCounter}`
  }
}
