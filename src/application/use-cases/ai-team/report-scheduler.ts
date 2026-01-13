/**
 * @fileoverview 보고서 스케줄러
 * 클린 아키텍처: Application 계층 - 보고서 자동화 스케줄링
 *
 * 역할:
 * - 일일/주간 보고서 스케줄 관리
 * - 보고서 트리거 (수동/이벤트)
 * - 보고서 히스토리 관리
 * - 알림 대상 관리
 */

/**
 * 보고서 타입
 */
export type ReportType = 'daily' | 'weekly' | 'incident' | 'tdd-compliance';

/**
 * 스케줄 타입
 */
export type ScheduleType = 'daily' | 'weekly';

/**
 * 트리거 타입
 */
export type TriggerType = 'manual' | 'scheduled' | 'event';

/**
 * 스케줄 설정
 */
export interface ScheduleConfig {
  type: ScheduleType;
  time: string; // HH:mm 형식
  timezone: string;
  dayOfWeek?: number; // 0-6 (일-토), weekly 타입에서만 사용
  notifyTargets?: string[];
}

/**
 * 스케줄된 보고서
 */
export interface ScheduledReport {
  id: string;
  type: ScheduleType;
  time: string;
  timezone: string;
  dayOfWeek?: number;
  enabled: boolean;
  notifyTargets?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 보고서 트리거
 */
export interface ReportTrigger {
  type: TriggerType;
  reportType: ReportType;
  eventData?: Record<string, unknown>;
}

/**
 * 트리거된 보고서
 */
export interface TriggeredReport {
  id: string;
  reportType: ReportType;
  triggerType: TriggerType;
  triggeredAt: Date;
  eventData?: Record<string, unknown>;
}

/**
 * 요일 한국어 맵핑
 */
const DAY_OF_WEEK_KOREAN: Record<number, string> = {
  0: '일요일',
  1: '월요일',
  2: '화요일',
  3: '수요일',
  4: '목요일',
  5: '금요일',
  6: '토요일',
};

/**
 * 보고서 스케줄러
 */
export class ReportScheduler {
  private schedules: Map<string, ScheduledReport> = new Map();
  private history: TriggeredReport[] = [];
  private scheduleCounter = 0;
  private reportCounter = 0;

  /**
   * 일일 보고서 스케줄링
   */
  scheduleDailyReport(config: ScheduleConfig): ScheduledReport {
    const id = this.generateScheduleId();
    const now = new Date();

    const schedule: ScheduledReport = {
      id,
      type: 'daily',
      time: config.time,
      timezone: config.timezone,
      enabled: true,
      notifyTargets: config.notifyTargets,
      createdAt: now,
      updatedAt: now,
    };

    this.schedules.set(id, schedule);
    return schedule;
  }

  /**
   * 주간 보고서 스케줄링
   */
  scheduleWeeklyReport(config: ScheduleConfig): ScheduledReport {
    const id = this.generateScheduleId();
    const now = new Date();

    const schedule: ScheduledReport = {
      id,
      type: 'weekly',
      time: config.time,
      timezone: config.timezone,
      dayOfWeek: config.dayOfWeek,
      enabled: true,
      notifyTargets: config.notifyTargets,
      createdAt: now,
      updatedAt: now,
    };

    this.schedules.set(id, schedule);
    return schedule;
  }

  /**
   * 스케줄 비활성화
   */
  disableSchedule(scheduleId: string): ScheduledReport {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    schedule.enabled = false;
    schedule.updatedAt = new Date();
    this.schedules.set(scheduleId, schedule);
    return schedule;
  }

  /**
   * 스케줄 활성화
   */
  enableSchedule(scheduleId: string): ScheduledReport {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    schedule.enabled = true;
    schedule.updatedAt = new Date();
    this.schedules.set(scheduleId, schedule);
    return schedule;
  }

  /**
   * 다음 실행 시간 계산
   */
  getNextRunTime(scheduleId: string): Date | undefined {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      return undefined;
    }

    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);

    if (schedule.type === 'daily') {
      return this.calculateNextDailyRun(now, hours, minutes);
    } else if (schedule.type === 'weekly' && schedule.dayOfWeek !== undefined) {
      return this.calculateNextWeeklyRun(now, schedule.dayOfWeek, hours, minutes);
    }

    return undefined;
  }

  /**
   * 다음 일일 실행 시간 계산
   */
  private calculateNextDailyRun(now: Date, hours: number, minutes: number): Date {
    const nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    // 이미 지난 시간이면 다음 날로
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
  }

  /**
   * 다음 주간 실행 시간 계산
   */
  private calculateNextWeeklyRun(
    now: Date,
    targetDay: number,
    hours: number,
    minutes: number
  ): Date {
    const nextRun = new Date(now);
    const currentDay = now.getDay();

    // 목표 요일까지 남은 일수 계산
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7;
    }

    nextRun.setDate(nextRun.getDate() + daysUntilTarget);
    nextRun.setHours(hours, minutes, 0, 0);

    return nextRun;
  }

  /**
   * 보고서 트리거
   */
  triggerReport(trigger: ReportTrigger): TriggeredReport {
    const id = this.generateReportId();

    const triggered: TriggeredReport = {
      id,
      reportType: trigger.reportType,
      triggerType: trigger.type,
      triggeredAt: new Date(),
      eventData: trigger.eventData,
    };

    this.history.push(triggered);
    return triggered;
  }

  /**
   * 활성 스케줄 조회
   */
  getActiveSchedules(): ScheduledReport[] {
    return Array.from(this.schedules.values()).filter((s) => s.enabled);
  }

  /**
   * 스케줄 삭제
   */
  deleteSchedule(scheduleId: string): boolean {
    return this.schedules.delete(scheduleId);
  }

  /**
   * 스케줄 시간 업데이트
   */
  updateScheduleTime(scheduleId: string, newTime: string): ScheduledReport {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    schedule.time = newTime;
    schedule.updatedAt = new Date();
    this.schedules.set(scheduleId, schedule);
    return schedule;
  }

  /**
   * 보고서 히스토리 조회
   */
  getReportHistory(): TriggeredReport[] {
    return [...this.history];
  }

  /**
   * 기간별 보고서 히스토리 조회
   */
  getReportHistoryByDateRange(start: Date, end: Date): TriggeredReport[] {
    return this.history.filter((r) => r.triggeredAt >= start && r.triggeredAt <= end);
  }

  /**
   * 타입별 보고서 히스토리 조회
   */
  getReportHistoryByType(reportType: ReportType): TriggeredReport[] {
    return this.history.filter((r) => r.reportType === reportType);
  }

  /**
   * 알림 대상 추가
   */
  addNotifyTarget(scheduleId: string, target: string): ScheduledReport {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    schedule.notifyTargets = schedule.notifyTargets || [];
    if (!schedule.notifyTargets.includes(target)) {
      schedule.notifyTargets.push(target);
    }
    schedule.updatedAt = new Date();
    this.schedules.set(scheduleId, schedule);
    return schedule;
  }

  /**
   * 알림 대상 제거
   */
  removeNotifyTarget(scheduleId: string, target: string): ScheduledReport {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    schedule.notifyTargets = (schedule.notifyTargets || []).filter((t) => t !== target);
    schedule.updatedAt = new Date();
    this.schedules.set(scheduleId, schedule);
    return schedule;
  }

  /**
   * 요일 한국어 변환
   */
  getDayOfWeekKorean(dayOfWeek: number): string {
    return DAY_OF_WEEK_KOREAN[dayOfWeek] || '';
  }

  /**
   * 스케줄 ID 생성
   */
  private generateScheduleId(): string {
    this.scheduleCounter++;
    return `schedule-${this.scheduleCounter}`;
  }

  /**
   * 보고서 ID 생성
   */
  private generateReportId(): string {
    this.reportCounter++;
    return `report-${this.reportCounter}`;
  }
}
