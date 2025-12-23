/**
 * Prisma Schema 타입 검증 테스트
 * 실제 DB 연결 없이 스키마 타입의 정합성을 검증
 */

import { describe, it, expect } from 'vitest';
import {
  UserRole,
  UsageType,
  AgentExecutionStatus,
  Prisma,
} from '../index';

describe('Prisma Schema Types', () => {
  describe('UserRole Enum', () => {
    it('should have correct values', () => {
      expect(UserRole.USER).toBe('USER');
      expect(UserRole.ADMIN).toBe('ADMIN');
    });

    it('should have exactly 2 roles', () => {
      const roles = Object.values(UserRole);
      expect(roles).toHaveLength(2);
      expect(roles).toContain('USER');
      expect(roles).toContain('ADMIN');
    });
  });

  describe('UsageType Enum', () => {
    it('should have correct values', () => {
      expect(UsageType.AI_COPY_GEN).toBe('AI_COPY_GEN');
      expect(UsageType.CAMPAIGN_CREATE).toBe('CAMPAIGN_CREATE');
      expect(UsageType.AI_ANALYSIS).toBe('AI_ANALYSIS');
      expect(UsageType.REPORT_GENERATE).toBe('REPORT_GENERATE');
    });

    it('should have exactly 4 usage types', () => {
      const types = Object.values(UsageType);
      expect(types).toHaveLength(4);
    });
  });

  describe('AgentExecutionStatus Enum', () => {
    it('should have correct values', () => {
      expect(AgentExecutionStatus.RUNNING).toBe('RUNNING');
      expect(AgentExecutionStatus.COMPLETED).toBe('COMPLETED');
      expect(AgentExecutionStatus.FAILED).toBe('FAILED');
    });

    it('should have exactly 3 statuses', () => {
      const statuses = Object.values(AgentExecutionStatus);
      expect(statuses).toHaveLength(3);
    });
  });

  describe('User Model Schema', () => {
    it('should accept valid user create input', () => {
      const validInput: Prisma.UserCreateInput = {
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.USER,
        quotaLimit: 100,
      };

      expect(validInput.email).toBe('test@example.com');
      expect(validInput.role).toBe('USER');
    });

    it('should allow optional fields', () => {
      const minimalInput: Prisma.UserCreateInput = {
        email: 'minimal@example.com',
      };

      expect(minimalInput.email).toBeDefined();
      expect(minimalInput.name).toBeUndefined();
      expect(minimalInput.image).toBeUndefined();
    });

    it('should accept OAuth provider info', () => {
      const oauthInput: Prisma.UserCreateInput = {
        email: 'oauth@example.com',
        provider: 'google',
        providerId: 'google-user-id-123',
      };

      expect(oauthInput.provider).toBe('google');
      expect(oauthInput.providerId).toBe('google-user-id-123');
    });
  });

  describe('UsageLog Model Schema', () => {
    it('should accept valid usage log create input', () => {
      const validInput: Prisma.UsageLogCreateInput = {
        type: UsageType.AI_COPY_GEN,
        user: {
          connect: { id: 1 },
        },
        metadata: {
          tokensUsed: 150,
          model: 'gpt-4',
        },
      };

      expect(validInput.type).toBe('AI_COPY_GEN');
      expect(validInput.metadata).toBeDefined();
    });

    it('should allow null metadata', () => {
      const inputWithoutMetadata: Prisma.UsageLogCreateInput = {
        type: UsageType.CAMPAIGN_CREATE,
        user: {
          connect: { id: 1 },
        },
      };

      expect(inputWithoutMetadata.metadata).toBeUndefined();
    });
  });

  describe('AgentExecutionLog Model Schema', () => {
    it('should accept valid agent execution log create input', () => {
      const validInput: Prisma.AgentExecutionLogCreateInput = {
        agentType: 'campaign-setup',
        input: { businessInfo: { name: 'Test Business' } },
        status: AgentExecutionStatus.RUNNING,
        user: {
          connect: { id: 1 },
        },
      };

      expect(validInput.agentType).toBe('campaign-setup');
      expect(validInput.status).toBe('RUNNING');
    });

    it('should accept completed log with output and metrics', () => {
      const completedInput: Prisma.AgentExecutionLogCreateInput = {
        agentType: 'copy-generation',
        input: { prompt: 'Generate ad copy' },
        output: { copies: ['Copy 1', 'Copy 2'] },
        status: AgentExecutionStatus.COMPLETED,
        tokensUsed: 500,
        duration: 3500,
        user: {
          connect: { id: 1 },
        },
      };

      expect(completedInput.status).toBe('COMPLETED');
      expect(completedInput.tokensUsed).toBe(500);
      expect(completedInput.duration).toBe(3500);
    });

    it('should accept failed log with error message', () => {
      const failedInput: Prisma.AgentExecutionLogCreateInput = {
        agentType: 'analysis',
        input: { campaignId: 'camp-123' },
        status: AgentExecutionStatus.FAILED,
        errorMessage: 'API rate limit exceeded',
        user: {
          connect: { id: 1 },
        },
      };

      expect(failedInput.status).toBe('FAILED');
      expect(failedInput.errorMessage).toBe('API rate limit exceeded');
    });
  });

  describe('MetaAdAccount Model Schema', () => {
    it('should accept valid meta ad account create input', () => {
      const validInput: Prisma.MetaAdAccountCreateInput = {
        accountId: 'act_123456789',
        accountName: 'Test Ad Account',
        accessToken: 'encrypted-token',
        user: {
          connect: { id: 1 },
        },
      };

      expect(validInput.accountId).toBe('act_123456789');
      expect(validInput.accessToken).toBeDefined();
    });

    it('should allow optional fields', () => {
      const minimalInput: Prisma.MetaAdAccountCreateInput = {
        accountId: 'act_987654321',
        accessToken: 'token',
        user: {
          connect: { id: 1 },
        },
      };

      expect(minimalInput.accountName).toBeUndefined();
      expect(minimalInput.tokenExpiresAt).toBeUndefined();
    });
  });
});

describe('Prisma Model Relationships', () => {
  it('User should have relation to UsageLog via usageLogs', () => {
    // TypeScript 컴파일 타임 체크로 관계 검증
    type UserWithLogs = Prisma.UserGetPayload<{
      include: { usageLogs: true };
    }>;

    // 이 타입이 존재하면 관계가 올바르게 정의됨
    const expectType = (_: UserWithLogs) => {};
    expect(expectType).toBeDefined();
  });

  it('User should have relation to AgentExecutionLog', () => {
    type UserWithAgentLogs = Prisma.UserGetPayload<{
      include: { agentExecutionLogs: true };
    }>;

    const expectType = (_: UserWithAgentLogs) => {};
    expect(expectType).toBeDefined();
  });

  it('User should have relation to MetaAdAccount', () => {
    type UserWithAdAccounts = Prisma.UserGetPayload<{
      include: { metaAdAccounts: true };
    }>;

    const expectType = (_: UserWithAdAccounts) => {};
    expect(expectType).toBeDefined();
  });
});
