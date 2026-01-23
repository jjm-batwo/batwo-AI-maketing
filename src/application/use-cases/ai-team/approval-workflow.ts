/**
 * @fileoverview 승인 워크플로우
 * 클린 아키텍처: Application 계층 - 승인 관리 유스케이스
 *
 * 역할:
 * - 승인 필요 작업 요청 관리
 * - 승인/거부 처리
 * - 승인 히스토리 관리
 * - 알림 대상 관리
 */

/**
 * 승인 유형
 */
export type ApprovalType =
  | 'database_schema'
  | 'api_change'
  | 'new_library'
  | 'security'
  | 'production_deploy';

/**
 * 승인 상태
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

/**
 * 승인 요청 입력
 */
export interface ApprovalRequestInput {
  type: ApprovalType;
  title: string;
  description: string;
  changes: string[];
  requestedBy: string;
  notifyTargets?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * 승인 설정
 */
export interface ApprovalConfig {
  type: ApprovalType;
  requiresApproval: boolean;
  defaultNotifyTargets?: string[];
}

/**
 * 승인 요청
 */
export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  title: string;
  description: string;
  changes: string[];
  status: ApprovalStatus;
  requestedBy: string;
  notifyTargets?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  approvalComment?: string;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
}

/**
 * 승인 유형 한국어 매핑
 */
const APPROVAL_TYPE_KOREAN: Record<ApprovalType, string> = {
  database_schema: '데이터베이스 스키마 변경',
  api_change: 'API 변경',
  new_library: '새 라이브러리 추가',
  security: '보안 변경',
  production_deploy: '프로덕션 배포',
};

/**
 * 승인 상태 한국어 매핑
 */
const APPROVAL_STATUS_KOREAN: Record<ApprovalStatus, string> = {
  pending: '대기 중',
  approved: '승인됨',
  rejected: '거부됨',
  cancelled: '취소됨',
};

/**
 * 승인 워크플로우
 */
export class ApprovalWorkflow {
  private requests: Map<string, ApprovalRequest> = new Map();
  private requestCounter = 0;
  private defaultNotifyTargets: Map<ApprovalType, string[]> = new Map();

  /**
   * 승인 요청 생성
   */
  requestApproval(input: ApprovalRequestInput): ApprovalRequest {
    const id = this.generateRequestId();
    const now = new Date();

    // 기본 알림 대상과 사용자 지정 알림 대상 병합
    const defaultTargets = this.defaultNotifyTargets.get(input.type) || [];
    const notifyTargets = input.notifyTargets
      ? [...new Set([...defaultTargets, ...input.notifyTargets])]
      : defaultTargets.length > 0
        ? defaultTargets
        : undefined;

    const request: ApprovalRequest = {
      id,
      type: input.type,
      title: input.title,
      description: input.description,
      changes: input.changes,
      status: 'pending',
      requestedBy: input.requestedBy,
      notifyTargets,
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    };

    this.requests.set(id, request);
    return request;
  }

  /**
   * 승인 처리
   */
  approve(requestId: string, approver: string, comment?: string): ApprovalRequest {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`승인 요청을 찾을 수 없습니다: ${requestId}`);
    }

    if (request.status !== 'pending') {
      throw new Error('이미 처리된 승인 요청입니다');
    }

    const now = new Date();
    request.status = 'approved';
    request.approvedBy = approver;
    request.approvedAt = now;
    request.approvalComment = comment;
    request.updatedAt = now;

    this.requests.set(requestId, request);
    return request;
  }

  /**
   * 거부 처리
   */
  reject(requestId: string, rejector: string, reason?: string): ApprovalRequest {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`승인 요청을 찾을 수 없습니다: ${requestId}`);
    }

    if (request.status !== 'pending') {
      throw new Error('이미 처리된 승인 요청입니다');
    }

    const now = new Date();
    request.status = 'rejected';
    request.rejectedBy = rejector;
    request.rejectedAt = now;
    request.rejectionReason = reason;
    request.updatedAt = now;

    this.requests.set(requestId, request);
    return request;
  }

  /**
   * 취소 처리
   */
  cancel(requestId: string, reason?: string): ApprovalRequest {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`승인 요청을 찾을 수 없습니다: ${requestId}`);
    }

    if (request.status !== 'pending') {
      throw new Error('이미 처리된 승인 요청은 취소할 수 없습니다');
    }

    const now = new Date();
    request.status = 'cancelled';
    request.cancelledAt = now;
    request.cancellationReason = reason;
    request.updatedAt = now;

    this.requests.set(requestId, request);
    return request;
  }

  /**
   * 대기 중인 승인 요청 조회
   */
  getPendingRequests(): ApprovalRequest[] {
    return Array.from(this.requests.values()).filter((r) => r.status === 'pending');
  }

  /**
   * 타입별 대기 중인 승인 요청 조회
   */
  getPendingRequestsByType(type: ApprovalType): ApprovalRequest[] {
    return this.getPendingRequests().filter((r) => r.type === type);
  }

  /**
   * 전체 승인 요청 히스토리 조회
   */
  getApprovalHistory(): ApprovalRequest[] {
    return Array.from(this.requests.values());
  }

  /**
   * 승인된 요청 조회
   */
  getApprovedRequests(): ApprovalRequest[] {
    return Array.from(this.requests.values()).filter((r) => r.status === 'approved');
  }

  /**
   * 거부된 요청 조회
   */
  getRejectedRequests(): ApprovalRequest[] {
    return Array.from(this.requests.values()).filter((r) => r.status === 'rejected');
  }

  /**
   * 승인 필요 여부 판단
   */
  needsApproval(type: ApprovalType): boolean {
    // 모든 승인 유형은 승인 필요
    const approvalRequiredTypes: ApprovalType[] = [
      'database_schema',
      'api_change',
      'new_library',
      'security',
      'production_deploy',
    ];
    return approvalRequiredTypes.includes(type);
  }

  /**
   * 타입별 기본 알림 대상 설정
   */
  setDefaultNotifyTargets(type: ApprovalType, targets: string[]): void {
    this.defaultNotifyTargets.set(type, targets);
  }

  /**
   * 승인 유형 한국어 변환
   */
  getApprovalTypeKorean(type: ApprovalType): string {
    return APPROVAL_TYPE_KOREAN[type] || type;
  }

  /**
   * 승인 상태 한국어 변환
   */
  getApprovalStatusKorean(status: ApprovalStatus): string {
    return APPROVAL_STATUS_KOREAN[status] || status;
  }

  /**
   * 요청 ID 생성
   */
  private generateRequestId(): string {
    this.requestCounter++;
    return `approval-${this.requestCounter}`;
  }
}
