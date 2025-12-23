/**
 * @batow/database
 * Prisma 클라이언트 및 타입 export
 */

export { prisma } from './client';
export { PrismaClient } from '@prisma/client';

// Prisma Enum 타입 re-export
export { UserRole, UsageType, AgentExecutionStatus } from '@prisma/client';

// Prisma 모델 타입 re-export
export type {
  User,
  UsageLog,
  AgentExecutionLog,
  MetaAdAccount,
} from '@prisma/client';

// Prisma input 타입 (Prisma namespace 통해 접근)
export { Prisma } from '@prisma/client';
