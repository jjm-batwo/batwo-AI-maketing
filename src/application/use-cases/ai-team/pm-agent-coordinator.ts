/**
 * @fileoverview PM Agent 조율 로직
 * 클린 아키텍처: Application 계층 - 에이전트 조율 담당
 *
 * 역할:
 * - 명령어를 적절한 에이전트로 라우팅
 * - TDD 워크플로우 관리
 * - 클린 아키텍처 검증 활성화
 * - 승인 필요 작업 식별
 */

import {
  CommandType,
  CommandResult,
  CommandRoutingResult,
  AgentType,
  TDDWorkflow,
  TDDStage,
} from '@/domain/services/ai-team-command-types';

/**
 * 명령어-에이전트 라우팅 설정
 */
interface RouteConfig {
  agentType: AgentType;
  action: string;
  requiresApproval?: boolean;
  approvalReason?: string;
  requiresFeaturePlanner?: boolean;
  enableTDD?: boolean;
  enableArchitectureValidation?: boolean;
}

/**
 * 라우팅 테이블
 */
const ROUTE_TABLE: Record<CommandType, RouteConfig> = {
  [CommandType.STATUS]: {
    agentType: 'system',
    action: 'getStatus',
  },
  [CommandType.FEATURE_REQUEST]: {
    agentType: 'planner',
    action: 'createFeaturePlan',
    requiresFeaturePlanner: true,
    enableTDD: true,
    enableArchitectureValidation: true,
  },
  [CommandType.BUG_REPORT]: {
    agentType: 'qa',
    action: 'createBugReport',
  },
  [CommandType.VERIFY]: {
    agentType: 'qa',
    action: 'runQualityGates',
  },
  [CommandType.DEPLOY]: {
    agentType: 'devops',
    action: 'requestDeployment',
    requiresApproval: true,
    approvalReason: '프로덕션 배포',
  },
  [CommandType.REPORT]: {
    agentType: 'analytics',
    action: 'generateReport',
  },
  [CommandType.CHANGELOG]: {
    agentType: 'documentation',
    action: 'getChangelog',
  },
  [CommandType.PROGRESS]: {
    agentType: 'pm',
    action: 'getProgress',
  },
  [CommandType.QUALITY]: {
    agentType: 'qa',
    action: 'getQualityMetrics',
  },
  [CommandType.SECURITY]: {
    agentType: 'security',
    action: 'runSecurityScan',
  },
  [CommandType.FIX]: {
    agentType: 'developer',
    action: 'fixIssue',
    enableTDD: true,
    enableArchitectureValidation: true,
  },
  [CommandType.APPROVE]: {
    agentType: 'pm',
    action: 'approveTask',
  },
  [CommandType.REJECT]: {
    agentType: 'pm',
    action: 'rejectTask',
  },
  [CommandType.ROLLBACK]: {
    agentType: 'devops',
    action: 'rollback',
    requiresApproval: true,
    approvalReason: '롤백 작업',
  },
  [CommandType.HELP]: {
    agentType: 'pm',
    action: 'showHelp',
  },
  [CommandType.UNKNOWN]: {
    agentType: 'pm',
    action: 'handleUnknown',
  },
};

/**
 * PM Agent 조율 클래스
 * 모든 명령어를 적절한 에이전트로 라우팅하고 워크플로우를 관리
 */
export class PMAgentCoordinator {
  /**
   * 명령어를 적절한 에이전트로 라우팅
   */
  async routeCommand(commandResult: CommandResult): Promise<CommandRoutingResult> {
    // 실패한 명령어 처리
    if (!commandResult.success) {
      return {
        success: false,
        error: commandResult.error,
      };
    }

    const routeConfig = ROUTE_TABLE[commandResult.commandType];

    if (!routeConfig) {
      return {
        success: false,
        error: `라우팅 설정을 찾을 수 없습니다: ${commandResult.commandType}`,
      };
    }

    const result: CommandRoutingResult = {
      success: true,
      agentType: routeConfig.agentType,
      action: routeConfig.action,
      parameters: commandResult.parameters,
    };

    // 승인 필요 여부
    if (routeConfig.requiresApproval) {
      result.requiresApproval = true;
      result.approvalReason = routeConfig.approvalReason;
    }

    // Feature Planner 필요 여부
    if (routeConfig.requiresFeaturePlanner) {
      result.requiresFeaturePlanner = true;
    }

    // TDD 워크플로우 설정
    if (routeConfig.enableTDD) {
      result.tddWorkflow = this.createTDDWorkflow();
    }

    // 아키텍처 검증 활성화
    if (routeConfig.enableArchitectureValidation) {
      result.architectureValidation = true;
    }

    return result;
  }

  /**
   * TDD 워크플로우 생성
   */
  private createTDDWorkflow(): TDDWorkflow {
    const stages: TDDStage[] = ['RED', 'GREEN', 'REFACTOR'];

    return {
      stages,
      currentStage: 'RED',
    };
  }
}
