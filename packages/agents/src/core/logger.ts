/**
 * 에이전트 실행 로그 시스템
 */

import { AgentExecutionLogSchema, type AgentExecutionLog } from './state';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  agentId?: string;
  step?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentLoggerConfig {
  agentType: string;
  userId: string;
  onLog?: (entry: LogEntry) => void;
  onExecutionComplete?: (log: AgentExecutionLog) => Promise<void>;
  minLevel?: LogLevel;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * 에이전트 로거 클래스
 * 실행 중 로그 수집 및 완료 시 실행 로그 생성
 */
export class AgentLogger {
  private readonly executionId: string;
  private readonly startTime: Date;
  private readonly logs: LogEntry[] = [];
  private tokensUsed = 0;
  private status: 'running' | 'completed' | 'failed' = 'running';
  private output: unknown;
  private _lastError?: Error;

  constructor(
    private readonly config: AgentLoggerConfig,
    private readonly input: unknown
  ) {
    this.executionId = this.generateExecutionId();
    this.startTime = new Date();

    this.info('Agent execution started', { input });
  }

  private generateExecutionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${this.config.agentType}_${timestamp}_${random}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const minLevel = this.config.minLevel ?? 'info';
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      agentId: this.executionId,
      metadata,
    };

    this.logs.push(entry);
    this.config.onLog?.(entry);

    // Console output for development
    const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : undefined;
    if (logFn) {
      logFn(`[${this.config.agentType}] ${message}`, metadata ?? '');
    }
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log('error', message, metadata);
  }

  /**
   * 단계 진입 로그
   */
  enterStep(step: string): void {
    this.info(`Entering step: ${step}`, { step });
  }

  /**
   * 단계 완료 로그
   */
  exitStep(step: string, result?: unknown): void {
    this.info(`Completed step: ${step}`, { step, result });
  }

  /**
   * 토큰 사용량 추가
   */
  addTokens(count: number): void {
    this.tokensUsed += count;
    this.debug('Tokens used', { added: count, total: this.tokensUsed });
  }

  /**
   * 성공적인 실행 완료
   */
  async complete(output: unknown): Promise<AgentExecutionLog> {
    this.status = 'completed';
    this.output = output;
    this.info('Agent execution completed successfully', { output });

    return this.finalize();
  }

  /**
   * 실패한 실행 완료
   */
  async fail(err: Error): Promise<AgentExecutionLog> {
    this.status = 'failed';
    this._lastError = err;
    this.error('Agent execution failed', {
      error: err.message,
      stack: err.stack,
    });

    return this.finalize();
  }

  /**
   * 마지막 에러 반환
   */
  getLastError(): Error | undefined {
    return this._lastError;
  }

  /**
   * 실행 로그 최종화 및 저장
   */
  private async finalize(): Promise<AgentExecutionLog> {
    const completedAt = new Date();
    const duration = completedAt.getTime() - this.startTime.getTime();

    const log: AgentExecutionLog = AgentExecutionLogSchema.parse({
      id: this.executionId,
      agentType: this.config.agentType,
      userId: this.config.userId,
      input: this.input,
      output: this.output,
      status: this.status,
      tokensUsed: this.tokensUsed,
      duration,
      createdAt: this.startTime,
      completedAt,
    });

    // 콜백 호출 (DB 저장 등)
    if (this.config.onExecutionComplete) {
      try {
        await this.config.onExecutionComplete(log);
      } catch (err) {
        console.error('Failed to save execution log:', err);
      }
    }

    return log;
  }

  /**
   * 현재 실행 ID 반환
   */
  getExecutionId(): string {
    return this.executionId;
  }

  /**
   * 현재까지의 로그 반환
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 현재 토큰 사용량 반환
   */
  getTokensUsed(): number {
    return this.tokensUsed;
  }
}

/**
 * 로거 팩토리 함수
 */
export function createAgentLogger(
  agentType: string,
  userId: string,
  input: unknown,
  options?: Partial<AgentLoggerConfig>
): AgentLogger {
  return new AgentLogger(
    {
      agentType,
      userId,
      ...options,
    },
    input
  );
}
