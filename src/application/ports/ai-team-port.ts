/**
 * @fileoverview AI 팀 서비스 포트 인터페이스
 * 클린 아키텍처: 외부 서비스와의 계약 정의
 */

import {
  SystemStatus,
  FeatureRequest,
  BugReport,
  QualityGateResult,
  ReportData,
  ReportType,
} from '@/domain/services/ai-team-command-types';

/**
 * AI 팀 서비스 포트
 * infrastructure 계층에서 구현
 */
export interface AITeamPort {
  /**
   * 시스템 상태 조회
   */
  getSystemStatus(): Promise<SystemStatus>;

  /**
   * 기능 요청 생성
   */
  createFeatureRequest(description: string): Promise<FeatureRequest>;

  /**
   * 버그 신고
   */
  reportBug(description: string): Promise<BugReport>;

  /**
   * 품질 게이트 실행
   */
  runQualityGates(): Promise<QualityGateResult>;

  /**
   * 배포 요청
   */
  requestDeployment(): Promise<{ success: boolean; message: string }>;

  /**
   * 보고서 생성
   */
  generateReport(type: ReportType): Promise<ReportData>;
}
