# Conversational AI Pivot - Design Document

## Feature: 대화형 AI 마케팅 에이전트
- **Status**: Design
- **Plan Reference**: `docs/01-plan/features/conversational-ai-pivot.plan.md`
- **Created**: 2026-02-06

---

## 1. Prisma Schema Extension

### 1.1 New Enums

```prisma
enum PendingActionStatus {
  PENDING
  CONFIRMED
  EXECUTING
  COMPLETED
  FAILED
  CANCELLED
  EXPIRED
}

enum AlertSeverity {
  INFO
  WARNING
  CRITICAL
}

enum AlertStatus {
  UNREAD
  READ
  DISMISSED
  ACTED_ON
}
```

### 1.2 New Models

```prisma
model Conversation {
  id             String                @id @default(cuid())
  userId         String
  user           User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  title          String?               // 첫 메시지 기반 자동 생성
  messages       ConversationMessage[]
  pendingActions PendingAction[]
  isArchived     Boolean               @default(false)
  createdAt      DateTime              @default(now())
  updatedAt      DateTime              @updatedAt

  @@index([userId, updatedAt])
  @@index([userId, isArchived])
}

model ConversationMessage {
  id             String        @id @default(cuid())
  conversationId String
  conversation   Conversation  @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           String        // 'user' | 'assistant' | 'system' | 'tool'
  content        String?       @db.Text
  toolCalls      Json?         // [{name, args}] - LLM이 호출한 도구 목록
  toolName       String?       // role='tool'일 때 어떤 도구의 결과인지
  toolResult     Json?         // 도구 실행 결과
  metadata       Json?         // sources, suggestedQuestions 등
  createdAt      DateTime      @default(now())

  @@index([conversationId, createdAt])
}

model PendingAction {
  id             String              @id @default(cuid())
  conversationId String
  conversation   Conversation        @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  messageId      String?             // 이 액션을 제안한 assistant 메시지
  toolName       String              // 'createCampaign', 'updateCampaignBudget' 등
  toolArgs       Json                // 도구 실행 파라미터 전체
  displaySummary String              @db.Text   // 한국어 요약 (UI 확인 카드용)
  details        Json?               // [{label, value, changed?}] 상세 항목
  warnings       Json?               // ["Meta 계정에 동시 반영됩니다"] 경고 목록
  status         PendingActionStatus @default(PENDING)
  result         Json?               // 실행 결과 (성공 시)
  errorMessage   String?             // 오류 메시지 (실패 시)
  expiresAt      DateTime            // 만료 시간 (기본 30분)
  confirmedAt    DateTime?
  executedAt     DateTime?
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  @@index([conversationId, status])
  @@index([status, expiresAt])
}

model Alert {
  id           String        @id @default(cuid())
  userId       String
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  type         String        // 'anomaly' | 'budget' | 'milestone' | 'recommendation'
  severity     AlertSeverity
  status       AlertStatus   @default(UNREAD)
  title        String
  message      String        @db.Text
  data         Json?         // { campaignId, metric, value, threshold, ... }
  campaignId   String?
  pushedToChat Boolean       @default(false)
  createdAt    DateTime      @default(now())
  readAt       DateTime?
  expiresAt    DateTime?

  @@index([userId, status])
  @@index([userId, createdAt])
  @@index([severity, status])
}
```

### 1.3 User Model Extension

```prisma
// User 모델에 relation 추가
model User {
  // ... existing fields ...
  conversations  Conversation[]
  alerts         Alert[]
}
```

---

## 2. Domain Layer

### 2.1 Conversation Entity

**File**: `src/domain/entities/Conversation.ts`

```typescript
export interface ConversationProps {
  id: string
  userId: string
  title: string | null
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}

export class Conversation {
  private constructor(private readonly props: ConversationProps) {}

  static create(userId: string): Conversation {
    return new Conversation({
      id: '', // DB에서 할당
      userId,
      title: null,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static fromPersistence(props: ConversationProps): Conversation {
    return new Conversation(props)
  }

  get id(): string { return this.props.id }
  get userId(): string { return this.props.userId }
  get title(): string | null { return this.props.title }
  get isArchived(): boolean { return this.props.isArchived }

  setTitle(title: string): Conversation {
    return new Conversation({ ...this.props, title, updatedAt: new Date() })
  }

  archive(): Conversation {
    return new Conversation({ ...this.props, isArchived: true, updatedAt: new Date() })
  }
}
```

### 2.2 PendingAction Entity

**File**: `src/domain/entities/PendingAction.ts`

```typescript
export type PendingActionStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'

export interface PendingActionProps {
  id: string
  conversationId: string
  messageId: string | null
  toolName: string
  toolArgs: Record<string, unknown>
  displaySummary: string
  details: ActionDetail[]
  warnings: string[]
  status: PendingActionStatus
  result: Record<string, unknown> | null
  errorMessage: string | null
  expiresAt: Date
  confirmedAt: Date | null
  executedAt: Date | null
  createdAt: Date
}

export interface ActionDetail {
  label: string    // "캠페인 목적"
  value: string    // "전환 (CONVERSIONS)"
  changed?: boolean // 업데이트 시 변경된 항목 표시
}

export class PendingAction {
  private static readonly DEFAULT_TTL_MS = 30 * 60 * 1000 // 30분

  private constructor(private readonly props: PendingActionProps) {}

  static create(params: {
    conversationId: string
    messageId?: string
    toolName: string
    toolArgs: Record<string, unknown>
    displaySummary: string
    details: ActionDetail[]
    warnings?: string[]
  }): PendingAction {
    return new PendingAction({
      id: '',
      conversationId: params.conversationId,
      messageId: params.messageId ?? null,
      toolName: params.toolName,
      toolArgs: params.toolArgs,
      displaySummary: params.displaySummary,
      details: params.details,
      warnings: params.warnings ?? [],
      status: 'PENDING',
      result: null,
      errorMessage: null,
      expiresAt: new Date(Date.now() + PendingAction.DEFAULT_TTL_MS),
      confirmedAt: null,
      executedAt: null,
      createdAt: new Date(),
    })
  }

  get id(): string { return this.props.id }
  get status(): PendingActionStatus { return this.props.status }
  get toolName(): string { return this.props.toolName }
  get toolArgs(): Record<string, unknown> { return this.props.toolArgs }
  get isExpired(): boolean { return new Date() > this.props.expiresAt }

  confirm(): PendingAction {
    if (this.props.status !== 'PENDING') throw new Error('Action is not pending')
    if (this.isExpired) throw new Error('Action has expired')
    return new PendingAction({
      ...this.props,
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    })
  }

  startExecution(): PendingAction {
    if (this.props.status !== 'CONFIRMED') throw new Error('Action is not confirmed')
    return new PendingAction({ ...this.props, status: 'EXECUTING' })
  }

  complete(result: Record<string, unknown>): PendingAction {
    return new PendingAction({
      ...this.props,
      status: 'COMPLETED',
      result,
      executedAt: new Date(),
    })
  }

  fail(errorMessage: string): PendingAction {
    return new PendingAction({
      ...this.props,
      status: 'FAILED',
      errorMessage,
      executedAt: new Date(),
    })
  }

  cancel(): PendingAction {
    if (this.props.status !== 'PENDING') throw new Error('Can only cancel pending actions')
    return new PendingAction({ ...this.props, status: 'CANCELLED' })
  }

  modifyArgs(newArgs: Record<string, unknown>): PendingAction {
    if (this.props.status !== 'PENDING') throw new Error('Can only modify pending actions')
    return new PendingAction({ ...this.props, toolArgs: newArgs })
  }
}
```

### 2.3 Alert Entity

**File**: `src/domain/entities/Alert.ts`

```typescript
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL'
export type AlertStatus = 'UNREAD' | 'READ' | 'DISMISSED' | 'ACTED_ON'

export interface AlertProps {
  id: string
  userId: string
  type: 'anomaly' | 'budget' | 'milestone' | 'recommendation'
  severity: AlertSeverity
  status: AlertStatus
  title: string
  message: string
  data: Record<string, unknown> | null
  campaignId: string | null
  pushedToChat: boolean
  createdAt: Date
  readAt: Date | null
  expiresAt: Date | null
}

export class Alert {
  private constructor(private readonly props: AlertProps) {}

  static create(params: {
    userId: string
    type: AlertProps['type']
    severity: AlertSeverity
    title: string
    message: string
    data?: Record<string, unknown>
    campaignId?: string
    expiresAt?: Date
  }): Alert {
    return new Alert({
      id: '',
      userId: params.userId,
      type: params.type,
      severity: params.severity,
      status: 'UNREAD',
      title: params.title,
      message: params.message,
      data: params.data ?? null,
      campaignId: params.campaignId ?? null,
      pushedToChat: false,
      createdAt: new Date(),
      readAt: null,
      expiresAt: params.expiresAt ?? null,
    })
  }

  get id(): string { return this.props.id }
  get severity(): AlertSeverity { return this.props.severity }

  markRead(): Alert {
    return new Alert({ ...this.props, status: 'READ', readAt: new Date() })
  }

  markPushedToChat(): Alert {
    return new Alert({ ...this.props, pushedToChat: true })
  }
}
```

### 2.4 Repository Interfaces

**File**: `src/domain/repositories/IConversationRepository.ts`

```typescript
import type { Conversation } from '@domain/entities/Conversation'

export interface ConversationMessageData {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | null
  toolCalls: { name: string; args: Record<string, unknown> }[] | null
  toolName: string | null
  toolResult: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  createdAt: Date
}

export interface IConversationRepository {
  save(conversation: Conversation): Promise<Conversation>
  findById(id: string): Promise<Conversation | null>
  findByUserId(userId: string, options?: {
    includeArchived?: boolean
    limit?: number
    offset?: number
  }): Promise<Conversation[]>
  addMessage(conversationId: string, message: Omit<ConversationMessageData, 'id' | 'conversationId' | 'createdAt'>): Promise<ConversationMessageData>
  getMessages(conversationId: string, options?: {
    limit?: number
    offset?: number
  }): Promise<ConversationMessageData[]>
  archive(id: string): Promise<void>
  delete(id: string): Promise<void>
}
```

**File**: `src/domain/repositories/IPendingActionRepository.ts`

```typescript
import type { PendingAction } from '@domain/entities/PendingAction'

export interface IPendingActionRepository {
  save(action: PendingAction): Promise<PendingAction>
  findById(id: string): Promise<PendingAction | null>
  findByConversationId(conversationId: string, status?: string): Promise<PendingAction[]>
  update(action: PendingAction): Promise<PendingAction>
  expirePendingActions(): Promise<number> // 만료된 액션 정리, 처리 건수 반환
}
```

**File**: `src/domain/repositories/IAlertRepository.ts`

```typescript
import type { Alert } from '@domain/entities/Alert'

export interface IAlertRepository {
  save(alert: Alert): Promise<Alert>
  findById(id: string): Promise<Alert | null>
  findByUserId(userId: string, options?: {
    status?: string
    severity?: string
    limit?: number
  }): Promise<Alert[]>
  countUnread(userId: string): Promise<number>
  update(alert: Alert): Promise<Alert>
}
```

---

## 3. Application Layer - Agent Tools

### 3.1 Tool Interface

**File**: `src/application/ports/IConversationalAgent.ts`

```typescript
import { z } from 'zod'

/**
 * 에이전트 컨텍스트 - 모든 도구 실행에 필요한 공통 정보
 */
export interface AgentContext {
  userId: string
  accessToken: string | null  // Meta API access token (MetaAdAccount에서)
  adAccountId: string | null  // Meta Ad Account ID
  conversationId: string
}

/**
 * 도구 실행 결과
 */
export interface ToolExecutionResult<T = unknown> {
  success: boolean
  data: T
  formattedMessage: string  // 한국어 자연어 응답
}

/**
 * 에이전트 도구 정의
 * 각 도구는 하나의 유스케이스를 래핑
 */
export interface AgentTool<TParams = unknown, TResult = unknown> {
  /** 도구 이름 (LLM function calling에서 사용) */
  name: string
  /** 한국어 설명 (LLM이 도구 선택 시 참고) */
  description: string
  /** Zod 스키마 기반 파라미터 검증 */
  parameters: z.ZodSchema<TParams>
  /** true = mutation (확인 필요), false = query (즉시 실행) */
  requiresConfirmation: boolean
  /** 도구 실행 */
  execute: (params: TParams, context: AgentContext) => Promise<ToolExecutionResult<TResult>>
  /** 확인 카드용 요약 생성 (mutation 도구만) */
  buildConfirmation?: (params: TParams, context: AgentContext) => Promise<{
    summary: string
    details: { label: string; value: string; changed?: boolean }[]
    warnings: string[]
  }>
}

/**
 * 도구 카테고리
 */
export type ToolCategory = 'query' | 'mutation' | 'meta'

/**
 * 도구 레지스트리
 */
export interface IToolRegistry {
  register(tool: AgentTool): void
  get(name: string): AgentTool | undefined
  getAll(): AgentTool[]
  getByCategory(category: ToolCategory): AgentTool[]
  /** Vercel AI SDK tools 형식으로 변환 */
  toVercelAITools(): Record<string, unknown>
}
```

### 3.2 Tool Implementations (예시)

#### Query Tool: getPerformanceKPI

**File**: `src/application/tools/queries/getPerformanceKPI.tool.ts`

```typescript
import { z } from 'zod'
import type { AgentTool, AgentContext, ToolExecutionResult } from '@application/ports/IConversationalAgent'
import type { GetDashboardKPIUseCase } from '@application/use-cases/kpi/GetDashboardKPIUseCase'

const paramsSchema = z.object({
  period: z.enum(['today', '7d', '14d', '30d']).default('7d'),
  campaignId: z.string().optional(),
})

type Params = z.infer<typeof paramsSchema>

export function createGetPerformanceKPITool(
  getDashboardKPIUseCase: GetDashboardKPIUseCase
): AgentTool<Params> {
  return {
    name: 'getPerformanceKPI',
    description: '사용자의 광고 캠페인 성과 지표(KPI)를 조회합니다. ROAS, CPA, CTR, 지출, 매출 등을 확인할 수 있습니다.',
    parameters: paramsSchema,
    requiresConfirmation: false,

    async execute(params: Params, context: AgentContext): Promise<ToolExecutionResult> {
      const periodDays = { today: 1, '7d': 7, '14d': 14, '30d': 30 }[params.period]
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000)

      const result = await getDashboardKPIUseCase.execute({
        userId: context.userId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        campaignId: params.campaignId,
      })

      // 자연어 포맷팅
      const spend = result.totalSpend.toLocaleString('ko-KR')
      const revenue = result.totalRevenue.toLocaleString('ko-KR')
      const roas = result.roas.toFixed(2)

      const formattedMessage = [
        `최근 ${params.period} 성과 요약:`,
        `- 총 지출: ₩${spend}`,
        `- 총 매출: ₩${revenue}`,
        `- ROAS: ${roas}x`,
        `- CTR: ${result.ctr.toFixed(2)}%`,
        `- 전환수: ${result.totalConversions.toLocaleString('ko-KR')}건`,
        `- CPA: ₩${result.cpa.toLocaleString('ko-KR')}`,
      ].join('\n')

      return { success: true, data: result, formattedMessage }
    },
  }
}
```

#### Mutation Tool: createCampaign

**File**: `src/application/tools/mutations/createCampaign.tool.ts`

```typescript
import { z } from 'zod'
import type { AgentTool, AgentContext, ToolExecutionResult } from '@application/ports/IConversationalAgent'
import type { CreateCampaignUseCase } from '@application/use-cases/campaign/CreateCampaignUseCase'

const paramsSchema = z.object({
  name: z.string().min(1).describe('캠페인 이름'),
  objective: z.enum([
    'OUTCOME_AWARENESS',
    'OUTCOME_TRAFFIC',
    'OUTCOME_ENGAGEMENT',
    'OUTCOME_LEADS',
    'OUTCOME_APP_PROMOTION',
    'OUTCOME_SALES',
  ]).describe('캠페인 목적'),
  dailyBudget: z.number().min(5000).describe('일일 예산 (원)'),
  startDate: z.string().optional().describe('시작일 (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('종료일 (YYYY-MM-DD)'),
  targetAudience: z.object({
    ageMin: z.number().optional(),
    ageMax: z.number().optional(),
    genders: z.array(z.enum(['male', 'female'])).optional(),
    locations: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
  }).optional(),
})

type Params = z.infer<typeof paramsSchema>

const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_AWARENESS: '인지도',
  OUTCOME_TRAFFIC: '트래픽',
  OUTCOME_ENGAGEMENT: '참여',
  OUTCOME_LEADS: '리드',
  OUTCOME_APP_PROMOTION: '앱 프로모션',
  OUTCOME_SALES: '전환/매출',
}

export function createCreateCampaignTool(
  createCampaignUseCase: CreateCampaignUseCase
): AgentTool<Params> {
  return {
    name: 'createCampaign',
    description: '새로운 Meta 광고 캠페인을 생성합니다. 캠페인 이름, 목적, 일일 예산이 필요합니다.',
    parameters: paramsSchema,
    requiresConfirmation: true,

    async execute(params: Params, context: AgentContext): Promise<ToolExecutionResult> {
      const result = await createCampaignUseCase.execute({
        userId: context.userId,
        name: params.name,
        objective: params.objective,
        dailyBudget: params.dailyBudget,
        currency: 'KRW',
        startDate: params.startDate ?? new Date().toISOString().split('T')[0],
        endDate: params.endDate,
        targetAudience: params.targetAudience,
        syncToMeta: !!context.accessToken,
        accessToken: context.accessToken ?? undefined,
        adAccountId: context.adAccountId ?? undefined,
      })

      return {
        success: true,
        data: result,
        formattedMessage: `캠페인 '${result.name}'이(가) 성공적으로 생성되었습니다.${context.accessToken ? ' Meta 계정에도 동기화되었습니다.' : ''}`,
      }
    },

    async buildConfirmation(params: Params) {
      const details = [
        { label: '캠페인 이름', value: params.name },
        { label: '목적', value: OBJECTIVE_LABELS[params.objective] ?? params.objective },
        { label: '일일 예산', value: `₩${params.dailyBudget.toLocaleString('ko-KR')}` },
      ]
      if (params.startDate) details.push({ label: '시작일', value: params.startDate })
      if (params.endDate) details.push({ label: '종료일', value: params.endDate })

      return {
        summary: `${OBJECTIVE_LABELS[params.objective] ?? ''} 캠페인을 일일 예산 ₩${params.dailyBudget.toLocaleString('ko-KR')}으로 생성합니다`,
        details,
        warnings: ['Meta 광고 계정에 실제 캠페인이 생성됩니다', '예산이 즉시 소진되기 시작할 수 있습니다'],
      }
    },
  }
}
```

### 3.3 Tool Registry

**File**: `src/application/tools/index.ts`

```typescript
import type { AgentTool, IToolRegistry, ToolCategory } from '@application/ports/IConversationalAgent'
import { tool } from 'ai' // Vercel AI SDK

export class ToolRegistry implements IToolRegistry {
  private tools = new Map<string, AgentTool>()

  register(agentTool: AgentTool): void {
    this.tools.set(agentTool.name, agentTool)
  }

  get(name: string): AgentTool | undefined {
    return this.tools.get(name)
  }

  getAll(): AgentTool[] {
    return Array.from(this.tools.values())
  }

  getByCategory(category: ToolCategory): AgentTool[] {
    return this.getAll().filter((t) => {
      if (category === 'mutation') return t.requiresConfirmation
      if (category === 'query') return !t.requiresConfirmation && !['askClarification', 'freeformResponse'].includes(t.name)
      return ['askClarification', 'freeformResponse'].includes(t.name)
    })
  }

  /**
   * Vercel AI SDK의 tools 형식으로 변환
   * streamText({ tools: registry.toVercelAITools() })
   */
  toVercelAITools(): Record<string, ReturnType<typeof tool>> {
    const result: Record<string, ReturnType<typeof tool>> = {}

    for (const [name, agentTool] of this.tools) {
      result[name] = tool({
        description: agentTool.description,
        parameters: agentTool.parameters,
      })
    }

    return result
  }
}
```

---

## 4. Application Layer - Core Services

### 4.1 ConversationalAgentService

**File**: `src/application/services/ConversationalAgentService.ts`

핵심 오케스트레이터. LLM 호출, 도구 실행, 확인 프로토콜을 조율합니다.

```typescript
import { streamText, type CoreMessage } from 'ai'
import { openai } from '@ai-sdk/openai'
import type { IToolRegistry, AgentContext } from '@application/ports/IConversationalAgent'
import type { IConversationRepository, ConversationMessageData } from '@domain/repositories/IConversationRepository'
import type { IPendingActionRepository } from '@domain/repositories/IPendingActionRepository'
import { PendingAction } from '@domain/entities/PendingAction'

// --- SSE 청크 타입 정의 ---

export type AgentStreamChunk =
  | { type: 'text'; content: string }
  | { type: 'progress'; stage: string; progress: number }
  | { type: 'tool_call'; toolName: string; args: Record<string, unknown> }
  | { type: 'tool_result'; toolName: string; formattedMessage: string; data?: unknown }
  | { type: 'action_confirmation'; actionId: string; toolName: string; summary: string; details: { label: string; value: string; changed?: boolean }[]; warnings: string[]; expiresAt: string }
  | { type: 'action_result'; actionId: string; success: boolean; message: string }
  | { type: 'data_card'; cardType: string; data: unknown }
  | { type: 'suggested_questions'; questions: string[] }
  | { type: 'error'; error: string }
  | { type: 'done' }

export interface AgentChatInput {
  userId: string
  message: string
  conversationId?: string
}

export class ConversationalAgentService {
  constructor(
    private readonly toolRegistry: IToolRegistry,
    private readonly conversationRepo: IConversationRepository,
    private readonly pendingActionRepo: IPendingActionRepository,
    private readonly buildContext: (userId: string) => Promise<AgentContext>,
  ) {}

  /**
   * 메인 대화 처리 - AsyncIterable로 SSE 스트리밍
   */
  async *chat(input: AgentChatInput): AsyncIterable<AgentStreamChunk> {
    try {
      // 1. 대화 로드 또는 생성
      const conversationId = input.conversationId ?? await this.createConversation(input.userId)

      // 2. 사용자 메시지 저장
      await this.conversationRepo.addMessage(conversationId, {
        role: 'user',
        content: input.message,
        toolCalls: null,
        toolName: null,
        toolResult: null,
        metadata: null,
      })

      // 3. 에이전트 컨텍스트 구성
      const context = await this.buildContext(input.userId)
      const agentContext: AgentContext = { ...context, conversationId }

      // 4. 대화 히스토리 로드 (최근 20개)
      const history = await this.conversationRepo.getMessages(conversationId, { limit: 20 })
      const messages = this.toCorMessages(history)

      // 5. 시스템 프롬프트 구성
      const systemPrompt = this.buildSystemPrompt(agentContext)

      // 6. LLM 호출 (도구 포함)
      yield { type: 'progress', stage: 'thinking', progress: 10 }

      const result = await streamText({
        model: openai('gpt-4o-mini'),
        system: systemPrompt,
        messages,
        tools: this.toolRegistry.toVercelAITools(),
        maxSteps: 5, // 도구 호출 후 재추론 최대 5회
        temperature: 0.7,
        onStepFinish: async ({ toolCalls, toolResults }) => {
          // 도구 호출/결과를 대화 히스토리에 기록
          if (toolCalls && toolCalls.length > 0) {
            await this.conversationRepo.addMessage(conversationId, {
              role: 'assistant',
              content: null,
              toolCalls: toolCalls.map(tc => ({ name: tc.toolName, args: tc.args })),
              toolName: null,
              toolResult: null,
              metadata: null,
            })
          }
        },
      })

      // 7. 스트림 처리
      let fullText = ''
      for await (const chunk of result.textStream) {
        fullText += chunk
        yield { type: 'text', content: chunk }
      }

      // 8. 도구 호출 결과 처리
      const stepResults = await result.steps
      for (const step of stepResults) {
        if (step.toolCalls) {
          for (const toolCall of step.toolCalls) {
            const agentTool = this.toolRegistry.get(toolCall.toolName)
            if (!agentTool) continue

            if (agentTool.requiresConfirmation) {
              // Mutation: 확인 카드 생성
              const confirmation = await agentTool.buildConfirmation?.(toolCall.args, agentContext)
              if (confirmation) {
                const pendingAction = PendingAction.create({
                  conversationId,
                  toolName: toolCall.toolName,
                  toolArgs: toolCall.args as Record<string, unknown>,
                  displaySummary: confirmation.summary,
                  details: confirmation.details,
                  warnings: confirmation.warnings,
                })
                const saved = await this.pendingActionRepo.save(pendingAction)

                yield {
                  type: 'action_confirmation',
                  actionId: saved.id,
                  toolName: toolCall.toolName,
                  summary: confirmation.summary,
                  details: confirmation.details,
                  warnings: confirmation.warnings,
                  expiresAt: pendingAction.isExpired ? '' : new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                }
              }
            } else {
              // Query: 즉시 실행 (이미 maxSteps에서 실행됨)
              // 결과를 data_card로 전송
              yield {
                type: 'tool_result',
                toolName: toolCall.toolName,
                formattedMessage: String(step.toolResults?.find(r => r.toolName === toolCall.toolName)?.result ?? ''),
              }
            }
          }
        }
      }

      // 9. assistant 메시지 저장
      if (fullText) {
        await this.conversationRepo.addMessage(conversationId, {
          role: 'assistant',
          content: fullText,
          toolCalls: null,
          toolName: null,
          toolResult: null,
          metadata: null,
        })
      }

      // 10. 추천 질문 생성
      yield {
        type: 'suggested_questions',
        questions: this.generateSuggestedQuestions(fullText),
      }

      yield { type: 'done' }
    } catch (error) {
      yield { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 시스템 프롬프트 구성
   */
  private buildSystemPrompt(context: AgentContext): string {
    const toolDescriptions = this.toolRegistry.getAll()
      .map(t => `- ${t.name}: ${t.description}`)
      .join('\n')

    return `당신은 바투 AI 마케팅 어시스턴트입니다. 한국 커머스 사업자의 Meta 광고 캠페인을 관리합니다.

역할:
1. 캠페인 성과를 분석하고 인사이트를 제공합니다
2. 사용자의 요청에 따라 캠페인을 생성/수정/관리합니다
3. 이상 징후를 감지하고 최적화 방안을 제안합니다
4. 광고 카피를 생성합니다

규칙:
- 항상 한국어로 응답합니다
- 데이터 기반으로 구체적인 수치를 포함해 답변합니다
- 캠페인 생성/수정/삭제 등 실행 작업은 반드시 도구를 사용합니다
- 정보가 부족하면 사용자에게 명확히 질문합니다
- 금액은 원(₩) 단위로, 비율은 소수점 2자리로 표시합니다

사용 가능한 도구:
${toolDescriptions}`
  }

  /**
   * DB 메시지를 Vercel AI SDK CoreMessage로 변환
   */
  private toCorMessages(messages: ConversationMessageData[]): CoreMessage[] {
    return messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content ?? '',
      }))
  }

  private async createConversation(userId: string): Promise<string> {
    const { Conversation } = await import('@domain/entities/Conversation')
    const conv = Conversation.create(userId)
    const saved = await this.conversationRepo.save(conv)
    return saved.id
  }

  private generateSuggestedQuestions(responseText: string): string[] {
    // 응답 내용 기반 추천 질문 (간단한 규칙 기반)
    const questions: string[] = []
    if (responseText.includes('ROAS')) questions.push('ROAS를 개선하려면 어떻게 해야 하나요?')
    if (responseText.includes('캠페인')) questions.push('성과가 가장 좋은 캠페인은 어떤 건가요?')
    if (responseText.includes('예산')) questions.push('예산을 어떻게 재분배하면 좋을까요?')
    if (questions.length === 0) {
      questions.push('이번 주 성과는 어때?', '새 캠페인을 만들어줘', '최근 이상 징후가 있어?')
    }
    return questions.slice(0, 3)
  }
}
```

### 4.2 ActionConfirmationService

**File**: `src/application/services/ActionConfirmationService.ts`

```typescript
import type { IToolRegistry, AgentContext } from '@application/ports/IConversationalAgent'
import type { IPendingActionRepository } from '@domain/repositories/IPendingActionRepository'
import type { IConversationRepository } from '@domain/repositories/IConversationRepository'

export interface ActionConfirmResult {
  success: boolean
  message: string
  data?: Record<string, unknown>
}

export class ActionConfirmationService {
  constructor(
    private readonly pendingActionRepo: IPendingActionRepository,
    private readonly conversationRepo: IConversationRepository,
    private readonly toolRegistry: IToolRegistry,
    private readonly buildContext: (userId: string) => Promise<AgentContext>,
  ) {}

  /**
   * 사용자가 확인 버튼을 클릭했을 때 호출
   */
  async confirmAndExecute(actionId: string, userId: string): Promise<ActionConfirmResult> {
    // 1. PendingAction 로드
    const action = await this.pendingActionRepo.findById(actionId)
    if (!action) throw new Error('Action not found')
    if (action.isExpired) throw new Error('Action has expired')

    // 2. 확인 상태로 전환
    const confirmed = action.confirm()
    const executing = confirmed.startExecution()
    await this.pendingActionRepo.update(executing)

    // 3. 도구 실행
    const agentTool = this.toolRegistry.get(action.toolName)
    if (!agentTool) throw new Error(`Tool ${action.toolName} not found`)

    const context = await this.buildContext(userId)

    try {
      const result = await agentTool.execute(action.toolArgs, context)

      // 4. 완료 상태로 전환
      const completed = executing.complete(result.data as Record<string, unknown>)
      await this.pendingActionRepo.update(completed)

      // 5. 대화에 결과 메시지 추가
      await this.conversationRepo.addMessage(context.conversationId, {
        role: 'assistant',
        content: result.formattedMessage,
        toolCalls: null,
        toolName: action.toolName,
        toolResult: result.data as Record<string, unknown>,
        metadata: { actionId, status: 'completed' },
      })

      return { success: true, message: result.formattedMessage, data: result.data as Record<string, unknown> }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Execution failed'
      const failed = executing.fail(errorMsg)
      await this.pendingActionRepo.update(failed)

      return { success: false, message: `실행 중 오류가 발생했습니다: ${errorMsg}` }
    }
  }

  /**
   * 사용자가 취소 버튼을 클릭했을 때 호출
   */
  async cancelAction(actionId: string): Promise<void> {
    const action = await this.pendingActionRepo.findById(actionId)
    if (!action) throw new Error('Action not found')

    const cancelled = action.cancel()
    await this.pendingActionRepo.update(cancelled)
  }

  /**
   * 사용자가 파라미터를 수정했을 때 호출
   */
  async modifyAction(actionId: string, newArgs: Record<string, unknown>): Promise<void> {
    const action = await this.pendingActionRepo.findById(actionId)
    if (!action) throw new Error('Action not found')

    const modified = action.modifyArgs(newArgs)
    await this.pendingActionRepo.update(modified)
  }
}
```

---

## 5. API Layer

### 5.1 Main Chat Endpoint

**File**: `src/app/api/agent/chat/route.ts`

```
POST /api/agent/chat
Content-Type: application/json
Response: text/event-stream (SSE)

Request Body:
{
  "message": string,          // 사용자 메시지
  "conversationId"?: string   // 기존 대화 이어가기 (없으면 새 대화)
}

SSE Events:
data: {"type":"progress","stage":"thinking","progress":10}
data: {"type":"text","content":"최근 "}
data: {"type":"text","content":"7일 "}
data: {"type":"text","content":"성과를 "}
...
data: {"type":"tool_result","toolName":"getPerformanceKPI","formattedMessage":"..."}
data: {"type":"data_card","cardType":"kpi_summary","data":{...}}
data: {"type":"action_confirmation","actionId":"clx...","toolName":"createCampaign","summary":"...","details":[...],"warnings":[...]}
data: {"type":"suggested_questions","questions":["..."]}
data: {"type":"done"}
```

### 5.2 Action Confirmation Endpoints

```
POST /api/agent/actions/[id]/confirm
→ { success: boolean, message: string, data?: object }

POST /api/agent/actions/[id]/cancel
→ { success: boolean }

POST /api/agent/actions/[id]/modify
Body: { args: object }
→ { success: boolean, updatedAction: object }
```

### 5.3 Conversation Management

```
GET /api/agent/conversations
Query: ?archived=false&limit=20&offset=0
→ { conversations: [{ id, title, updatedAt, lastMessage }], total: number }

GET /api/agent/conversations/[id]
Query: ?messageLimit=50
→ { conversation: object, messages: object[] }

DELETE /api/agent/conversations/[id]
→ { success: boolean }
```

### 5.4 Alerts

```
GET /api/agent/alerts
Query: ?status=UNREAD&limit=10
→ { alerts: object[], unreadCount: number }

PATCH /api/agent/alerts/[id]
Body: { status: 'READ' | 'DISMISSED' | 'ACTED_ON' }
→ { success: boolean }

POST /api/agent/alerts/check  (Cron endpoint)
→ { created: number, types: { anomaly: number, budget: number, milestone: number } }
```

---

## 6. Presentation Layer

### 6.1 Chat UI Component Hierarchy

```
[Dashboard Layout]
├── [Existing Dashboard Pages]  ← 읽기 전용 유지
└── [ChatPanel]                 ← 우측 사이드바 (persistent)
    ├── [ChatHeader]
    │   ├── 대화 제목
    │   ├── [ConversationList] trigger
    │   └── 새 대화 버튼
    ├── [ChatMessages]
    │   ├── [ChatMessage role="user"]
    │   ├── [ChatMessage role="assistant"]
    │   │   └── text / markdown 렌더링
    │   ├── [DataCard type="kpi_summary"]
    │   │   └── 기존 KPICard 재사용 (compact mode)
    │   ├── [DataCard type="campaign_list"]
    │   │   └── 캠페인 목록 카드
    │   ├── [ConfirmationCard]
    │   │   ├── 요약
    │   │   ├── 상세 테이블
    │   │   ├── 경고
    │   │   └── [확인] [취소] [수정] 버튼
    │   └── [AlertBanner]
    │       └── 프로액티브 알림 메시지
    ├── [SuggestedQuestions]
    │   └── 추천 질문 chip 목록
    └── [ChatInput]
        ├── 텍스트 입력
        └── 전송 버튼
```

### 6.2 Core Hooks

#### useAgentChat

**File**: `src/presentation/hooks/useAgentChat.ts`

```typescript
import { useState, useCallback, useRef } from 'react'
import type { AgentStreamChunk } from '@application/services/ConversationalAgentService'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  toolResults?: { toolName: string; data: unknown }[]
  confirmationCard?: {
    actionId: string
    toolName: string
    summary: string
    details: { label: string; value: string; changed?: boolean }[]
    warnings: string[]
    expiresAt: string
  }
  dataCards?: { cardType: string; data: unknown }[]
  suggestedQuestions?: string[]
  isStreaming?: boolean
  timestamp: Date
}

interface UseAgentChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  conversationId: string | null
  sendMessage: (message: string) => Promise<void>
  confirmAction: (actionId: string) => Promise<void>
  cancelAction: (actionId: string) => Promise<void>
  clearMessages: () => void
}

export function useAgentChat(initialConversationId?: string): UseAgentChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId ?? null)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (message: string) => {
    setIsLoading(true)
    setError(null)

    // 사용자 메시지 추가
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])

    // assistant placeholder
    const assistantId = `assistant-${Date.now()}`
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, assistantMsg])

    try {
      abortRef.current = new AbortController()

      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversationId }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) throw new Error('Chat request failed')
      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const data = JSON.parse(line.slice(6)) as AgentStreamChunk

          switch (data.type) {
            case 'text':
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: m.content + data.content }
                  : m
              ))
              break

            case 'action_confirmation':
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, confirmationCard: data }
                  : m
              ))
              break

            case 'data_card':
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, dataCards: [...(m.dataCards ?? []), data] }
                  : m
              ))
              break

            case 'suggested_questions':
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, suggestedQuestions: data.questions }
                  : m
              ))
              break

            case 'done':
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, isStreaming: false }
                  : m
              ))
              break

            case 'error':
              setError(data.error)
              break
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [conversationId])

  const confirmAction = useCallback(async (actionId: string) => {
    const response = await fetch(`/api/agent/actions/${actionId}/confirm`, {
      method: 'POST',
    })
    const result = await response.json()

    // 확인 카드를 결과 메시지로 교체
    setMessages(prev => [
      ...prev,
      {
        id: `result-${Date.now()}`,
        role: 'assistant',
        content: result.message,
        timestamp: new Date(),
      },
    ])
  }, [])

  const cancelAction = useCallback(async (actionId: string) => {
    await fetch(`/api/agent/actions/${actionId}/cancel`, { method: 'POST' })

    setMessages(prev => [
      ...prev,
      {
        id: `cancel-${Date.now()}`,
        role: 'assistant',
        content: '작업이 취소되었습니다.',
        timestamp: new Date(),
      },
    ])
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setConversationId(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    conversationId,
    sendMessage,
    confirmAction,
    cancelAction,
    clearMessages,
  }
}
```

### 6.3 UI State Extension

**File**: `src/presentation/stores/uiStore.ts` (확장)

```typescript
// 기존 uiStore에 추가할 상태

interface ChatPanelState {
  isChatPanelOpen: boolean
  activeConversationId: string | null
  unreadAlertCount: number
}

// Actions
// toggleChatPanel(): void
// setActiveConversation(id: string | null): void
// setUnreadAlertCount(count: number): void
```

---

## 7. Data Flow Diagrams

### 7.1 Query Flow (즉시 실행)

```
User: "이번 주 성과 어때?"
    │
    ▼
[POST /api/agent/chat] { message: "이번 주 성과 어때?" }
    │
    ▼
[ConversationalAgentService.chat()]
    ├── 메시지 저장
    ├── 컨텍스트 로드 (userId → accessToken, adAccountId)
    ├── 히스토리 로드 (최근 20개)
    │
    ▼
[streamText({ tools, messages })]
    │
    ▼
LLM decides: tool_call → getPerformanceKPI({ period: "7d" })
    │
    ▼
[자동 실행 - requiresConfirmation=false]
    ├── GetDashboardKPIUseCase.execute()
    ├── 결과 → formattedMessage
    │
    ▼
LLM receives tool result, generates natural language response
    │
    ▼
[SSE Stream]
    ├── { type: "text", content: "이번 주 성과를 분석해봤습니다..." }
    ├── { type: "data_card", cardType: "kpi_summary", data: {...} }
    ├── { type: "suggested_questions", questions: [...] }
    └── { type: "done" }
```

### 7.2 Mutation Flow (확인 필요)

```
User: "전환 캠페인 만들어줘, 예산 10만원"
    │
    ▼
[streamText({ tools, messages })]
    │
    ▼
LLM: tool_call → createCampaign({
  name: "전환 캠페인 2026-02",
  objective: "OUTCOME_SALES",
  dailyBudget: 100000
})
    │
    ▼
[requiresConfirmation=true → PendingAction 생성]
    │
    ▼
[SSE: action_confirmation]
    │
    ▼
[UI: ConfirmationCard 렌더링]
    ┌─────────────────────────────────┐
    │ 전환 캠페인 생성                  │
    │                                 │
    │ 이름: 전환 캠페인 2026-02        │
    │ 목적: 전환/매출                   │
    │ 예산: ₩100,000/일               │
    │                                 │
    │ ⚠ Meta 계정에 실제 캠페인 생성   │
    │ ⚠ 예산 즉시 소진 가능            │
    │                                 │
    │ [확인]  [취소]  [수정]            │
    └─────────────────────────────────┘
    │
    ▼ (사용자: [확인])
    │
[POST /api/agent/actions/{id}/confirm]
    │
    ▼
[ActionConfirmationService.confirmAndExecute()]
    ├── PendingAction: PENDING → CONFIRMED → EXECUTING
    ├── CreateCampaignUseCase.execute()
    ├── PendingAction: EXECUTING → COMPLETED
    │
    ▼
{ success: true, message: "캠페인 '전환 캠페인 2026-02'가 생성되었습니다" }
```

### 7.3 Multi-turn Slot Filling Flow

```
User: "캠페인 만들어줘"
    │ (파라미터 부족)
    ▼
LLM: "어떤 목적의 캠페인을 만드시겠어요? (인지도/트래픽/전환/매출)"
    │
    ▼
User: "전환"
    │ (예산 부족)
    ▼
LLM: "일일 예산은 얼마로 설정하시겠어요?"
    │
    ▼
User: "10만원"
    │ (이제 충분)
    ▼
LLM: tool_call → createCampaign({
  name: "전환 캠페인",
  objective: "OUTCOME_SALES",
  dailyBudget: 100000,
  startDate: "2026-02-06"
})
    │
    ▼
[Confirmation Card 생성]
```

### 7.4 Proactive Alert Flow

```
[Cron: POST /api/agent/alerts/check] (매 15분)
    │
    ▼
[AlertService.checkAllUsers()]
    ├── 활성 캠페인별 최근 KPI 조회
    ├── 이상 감지 (ROAS 30%↓, 지출 급증 등)
    ├── 예산 임계값 체크 (90%+ 소진)
    ├── 마일스톤 체크 (ROAS 3.0x 달성 등)
    │
    ▼
[Alert 생성 → DB 저장]
    │
    ▼
[Client polling: GET /api/agent/alerts?status=UNREAD]
    │
    ▼
[AlertBanner 표시 in ChatPanel]
    "⚠ '봄 시즌 캠페인' ROAS가 어제 대비 32% 하락했습니다"
    [자세히 분석하기] ← 클릭 시 자동으로 분석 메시지 전송
```

---

## 8. 대화 예시 시나리오

### 시나리오 1: 성과 분석

```
사용자: 이번 주 성과 어때?

AI: 이번 주(7일) 성과를 분석해봤습니다.

    [KPI 카드]
    총 지출: ₩1,250,000  (+8.2%)
    총 매출: ₩3,875,000  (+12.5%)
    ROAS: 3.10x  (+0.12)
    CTR: 2.45%  (-0.05)
    전환: 87건  (+15건)

    전반적으로 양호한 성과입니다. 매출이 12.5% 증가했고
    ROAS도 3.10x로 건강한 수준입니다.
    다만 CTR이 소폭 하락했는데, 크리에이티브 교체를
    검토해보시는 것을 추천합니다.

    추천 질문:
    • CTR이 왜 떨어졌어?
    • 성과 좋은 캠페인은 어떤 거야?
    • 예산을 늘려도 될까?
```

### 시나리오 2: 캠페인 생성 (Multi-turn)

```
사용자: 새 캠페인 만들고 싶어

AI: 어떤 목적의 캠페인을 만드시겠어요?
    • 인지도 (브랜드 노출)
    • 트래픽 (웹사이트 방문)
    • 전환 (구매/가입)
    • 매출 (최대 매출)

사용자: 전환

AI: 전환 캠페인이군요. 일일 예산은 얼마로 설정할까요?
    참고: 현재 전환 캠페인 평균 CPA는 ₩12,000입니다.
    최소 ₩50,000 이상을 추천합니다.

사용자: 10만원으로 해줘

AI: 다음 내용으로 캠페인을 생성할까요?

    ┌─────────────────────────────────┐
    │ 캠페인 생성 확인                  │
    │                                 │
    │ 이름: 전환 캠페인 2026-02        │
    │ 목적: 전환 (OUTCOME_SALES)       │
    │ 일일 예산: ₩100,000             │
    │ 시작일: 2026-02-06              │
    │ 타겟: Advantage+ (자동)          │
    │                                 │
    │ ⚠ Meta 광고 계정에 동시 생성     │
    │                                 │
    │ [확인]  [취소]  [수정]            │
    └─────────────────────────────────┘

사용자: [확인 클릭]

AI: 전환 캠페인 '전환 캠페인 2026-02'가 생성되었습니다! ✅
    Meta 광고 계정에도 동기화가 완료되었습니다.
    캠페인 학습 기간(3-5일) 동안은 성과 변동이 있을 수 있습니다.
```

---

## 9. 도구 전체 목록

| # | 도구 이름 | 카테고리 | 설명 | 래핑 대상 |
|---|----------|---------|------|----------|
| 1 | `getPerformanceKPI` | Query | KPI 성과 조회 | `GetDashboardKPIUseCase` |
| 2 | `listCampaigns` | Query | 캠페인 목록 조회 | `ListCampaignsUseCase` |
| 3 | `getCampaignDetail` | Query | 캠페인 상세 조회 | `GetCampaignUseCase` |
| 4 | `generateReport` | Query | 주간 보고서 생성 | `GenerateWeeklyReportUseCase` |
| 5 | `checkAnomalies` | Query | 이상 징후 확인 | anomaly detection logic |
| 6 | `analyzeTrends` | Query | 트렌드 분석 | trend analysis logic |
| 7 | `getBudgetRecommendation` | Query | 예산 추천 | `IAIService.generateBudgetRecommendation` |
| 8 | `createCampaign` | Mutation | 캠페인 생성 | `CreateCampaignUseCase` |
| 9 | `updateCampaignBudget` | Mutation | 예산 변경 | `UpdateCampaignUseCase` |
| 10 | `pauseCampaign` | Mutation | 캠페인 일시정지 | `PauseCampaignUseCase` |
| 11 | `resumeCampaign` | Mutation | 캠페인 재개 | `ResumeCampaignUseCase` |
| 12 | `deleteCampaign` | Mutation | 캠페인 삭제 | `DeleteCampaignUseCase` |
| 13 | `generateAdCopy` | Mutation | 광고 카피 생성 | `IAIService.generateAdCopy` |
| 14 | `askClarification` | Meta | 추가 정보 요청 | (내장) |
| 15 | `freeformResponse` | Meta | 일반 대화 | (내장) |

---

## 10. 기존 코드와의 호환성

### 유지되는 것
- `/api/ai/chat` - 기존 RAG 채팅 (deprecated, 하위 호환)
- `/api/campaigns/*` - 기존 REST API (대시보드 읽기용)
- `/api/dashboard/kpi` - 대시보드 KPI (차트 렌더링용)
- 모든 대시보드 컴포넌트 (읽기 전용)

### 새로 추가되는 것
- `/api/agent/*` - 새 대화형 API 그룹
- `src/application/tools/` - 도구 디렉토리
- `src/presentation/components/agent/` - 채팅 UI 컴포넌트
- Prisma 모델 4개

### 수정되는 것
- `src/presentation/stores/uiStore.ts` - 채팅 패널 상태 추가
- `src/app/(dashboard)/layout.tsx` - ChatPanel 사이드바 추가
- `prisma/schema.prisma` - 새 모델 추가
- `src/presentation/hooks/index.ts` - 새 훅 export

### 삭제되는 것
- 없음 (하위 호환 유지)
