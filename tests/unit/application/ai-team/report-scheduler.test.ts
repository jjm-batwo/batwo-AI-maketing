/**
 * @fileoverview 보고서 스케줄러 테스트
 * TDD RED 단계: 실패하는 테스트 먼저 작성
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  ReportScheduler,
  ScheduleConfig,
  ReportTrigger,
} from '@/application/use-cases/ai-team/report-scheduler';

describe('ReportScheduler', () => {
  let scheduler: ReportScheduler;

  beforeEach(() => {
    vi.useFakeTimers();
    scheduler = new ReportScheduler();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('일일 보고서 스케줄링', () => {
    it('매일 특정 시간에 일일 보고서를 스케줄링해야 함', () => {
      const config: ScheduleConfig = {
        type: 'daily',
        time: '18:00', // 오후 6시
        timezone: 'Asia/Seoul',
      };

      const schedule = scheduler.scheduleDailyReport(config);

      expect(schedule.id).toBeDefined();
      expect(schedule.type).toBe('daily');
      expect(schedule.time).toBe('18:00');
      expect(schedule.enabled).toBe(true);
    });

    it('일일 보고서 스케줄을 비활성화할 수 있어야 함', () => {
      const config: ScheduleConfig = {
        type: 'daily',
        time: '18:00',
        timezone: 'Asia/Seoul',
      };

      const schedule = scheduler.scheduleDailyReport(config);
      const disabled = scheduler.disableSchedule(schedule.id);

      expect(disabled.enabled).toBe(false);
    });

    it('다음 일일 보고서 생성 시간을 계산해야 함', () => {
      // 현재 시간을 2026-01-09 10:00으로 설정
      vi.setSystemTime(new Date('2026-01-09T10:00:00+09:00'));

      const config: ScheduleConfig = {
        type: 'daily',
        time: '18:00',
        timezone: 'Asia/Seoul',
      };

      const schedule = scheduler.scheduleDailyReport(config);
      const nextRun = scheduler.getNextRunTime(schedule.id);

      // 오늘 18:00에 실행되어야 함
      expect(nextRun?.getHours()).toBe(18);
      expect(nextRun?.getDate()).toBe(9);
    });

    it('시간이 지났으면 다음 날로 스케줄해야 함', () => {
      // 현재 시간을 2026-01-09 20:00으로 설정 (18:00 이후)
      vi.setSystemTime(new Date('2026-01-09T20:00:00+09:00'));

      const config: ScheduleConfig = {
        type: 'daily',
        time: '18:00',
        timezone: 'Asia/Seoul',
      };

      const schedule = scheduler.scheduleDailyReport(config);
      const nextRun = scheduler.getNextRunTime(schedule.id);

      // 다음 날 18:00에 실행되어야 함
      expect(nextRun?.getDate()).toBe(10);
    });
  });

  describe('주간 보고서 스케줄링', () => {
    it('매주 특정 요일/시간에 주간 보고서를 스케줄링해야 함', () => {
      const config: ScheduleConfig = {
        type: 'weekly',
        time: '09:00', // 오전 9시
        dayOfWeek: 1, // 월요일
        timezone: 'Asia/Seoul',
      };

      const schedule = scheduler.scheduleWeeklyReport(config);

      expect(schedule.type).toBe('weekly');
      expect(schedule.dayOfWeek).toBe(1);
      expect(schedule.time).toBe('09:00');
    });

    it('다음 주간 보고서 생성 시간을 계산해야 함', () => {
      // 현재 시간을 2026-01-08 수요일 10:00으로 설정
      vi.setSystemTime(new Date('2026-01-08T10:00:00+09:00'));

      const config: ScheduleConfig = {
        type: 'weekly',
        time: '09:00',
        dayOfWeek: 1, // 월요일
        timezone: 'Asia/Seoul',
      };

      const schedule = scheduler.scheduleWeeklyReport(config);
      const nextRun = scheduler.getNextRunTime(schedule.id);

      // 다음 월요일(1/12)에 실행되어야 함 (수요일에서 5일 후)
      expect(nextRun?.getDay()).toBe(1);
      expect(nextRun?.getDate()).toBe(12);
    });
  });

  describe('보고서 트리거', () => {
    it('수동 트리거로 즉시 보고서를 생성할 수 있어야 함', () => {
      const trigger: ReportTrigger = {
        type: 'manual',
        reportType: 'daily',
      };

      const triggered = scheduler.triggerReport(trigger);

      expect(triggered.triggeredAt).toBeDefined();
      expect(triggered.reportType).toBe('daily');
      expect(triggered.triggerType).toBe('manual');
    });

    it('이벤트 트리거로 보고서를 생성할 수 있어야 함', () => {
      const trigger: ReportTrigger = {
        type: 'event',
        reportType: 'incident',
        eventData: {
          severity: 'high',
          description: '서버 다운',
        },
      };

      const triggered = scheduler.triggerReport(trigger);

      expect(triggered.reportType).toBe('incident');
      expect(triggered.triggerType).toBe('event');
      expect(triggered.eventData).toBeDefined();
    });
  });

  describe('스케줄 관리', () => {
    it('모든 활성 스케줄을 조회해야 함', () => {
      scheduler.scheduleDailyReport({
        type: 'daily',
        time: '18:00',
        timezone: 'Asia/Seoul',
      });
      scheduler.scheduleWeeklyReport({
        type: 'weekly',
        time: '09:00',
        dayOfWeek: 1,
        timezone: 'Asia/Seoul',
      });

      const activeSchedules = scheduler.getActiveSchedules();

      expect(activeSchedules.length).toBe(2);
    });

    it('스케줄을 삭제해야 함', () => {
      const schedule = scheduler.scheduleDailyReport({
        type: 'daily',
        time: '18:00',
        timezone: 'Asia/Seoul',
      });

      const deleted = scheduler.deleteSchedule(schedule.id);

      expect(deleted).toBe(true);
      expect(scheduler.getActiveSchedules().length).toBe(0);
    });

    it('스케줄 시간을 업데이트해야 함', () => {
      const schedule = scheduler.scheduleDailyReport({
        type: 'daily',
        time: '18:00',
        timezone: 'Asia/Seoul',
      });

      const updated = scheduler.updateScheduleTime(schedule.id, '19:00');

      expect(updated.time).toBe('19:00');
    });
  });

  describe('보고서 히스토리', () => {
    it('생성된 보고서 히스토리를 기록해야 함', () => {
      scheduler.triggerReport({
        type: 'manual',
        reportType: 'daily',
      });
      scheduler.triggerReport({
        type: 'manual',
        reportType: 'weekly',
      });

      const history = scheduler.getReportHistory();

      expect(history.length).toBe(2);
    });

    it('특정 기간의 보고서 히스토리를 조회해야 함', () => {
      vi.setSystemTime(new Date('2026-01-05T10:00:00+09:00'));
      scheduler.triggerReport({ type: 'manual', reportType: 'daily' });

      vi.setSystemTime(new Date('2026-01-09T10:00:00+09:00'));
      scheduler.triggerReport({ type: 'manual', reportType: 'daily' });

      vi.setSystemTime(new Date('2026-01-10T10:00:00+09:00'));
      scheduler.triggerReport({ type: 'manual', reportType: 'daily' });

      const history = scheduler.getReportHistoryByDateRange(
        new Date('2026-01-08'),
        new Date('2026-01-11')
      );

      expect(history.length).toBe(2);
    });

    it('보고서 타입별 히스토리를 조회해야 함', () => {
      scheduler.triggerReport({ type: 'manual', reportType: 'daily' });
      scheduler.triggerReport({ type: 'manual', reportType: 'daily' });
      scheduler.triggerReport({ type: 'manual', reportType: 'weekly' });

      const dailyHistory = scheduler.getReportHistoryByType('daily');
      const weeklyHistory = scheduler.getReportHistoryByType('weekly');

      expect(dailyHistory.length).toBe(2);
      expect(weeklyHistory.length).toBe(1);
    });
  });

  describe('알림 설정', () => {
    it('보고서 생성 시 알림 대상을 설정해야 함', () => {
      const config: ScheduleConfig = {
        type: 'daily',
        time: '18:00',
        timezone: 'Asia/Seoul',
        notifyTargets: ['user@example.com', 'admin@example.com'],
      };

      const schedule = scheduler.scheduleDailyReport(config);

      expect(schedule.notifyTargets).toContain('user@example.com');
      expect(schedule.notifyTargets?.length).toBe(2);
    });

    it('알림 대상을 추가해야 함', () => {
      const schedule = scheduler.scheduleDailyReport({
        type: 'daily',
        time: '18:00',
        timezone: 'Asia/Seoul',
      });

      const updated = scheduler.addNotifyTarget(schedule.id, 'new@example.com');

      expect(updated.notifyTargets).toContain('new@example.com');
    });

    it('알림 대상을 제거해야 함', () => {
      const schedule = scheduler.scheduleDailyReport({
        type: 'daily',
        time: '18:00',
        timezone: 'Asia/Seoul',
        notifyTargets: ['user@example.com'],
      });

      const updated = scheduler.removeNotifyTarget(schedule.id, 'user@example.com');

      expect(updated.notifyTargets).not.toContain('user@example.com');
    });
  });

  describe('요일 한국어 변환', () => {
    it('요일 번호를 한국어로 변환해야 함', () => {
      expect(scheduler.getDayOfWeekKorean(0)).toBe('일요일');
      expect(scheduler.getDayOfWeekKorean(1)).toBe('월요일');
      expect(scheduler.getDayOfWeekKorean(2)).toBe('화요일');
      expect(scheduler.getDayOfWeekKorean(3)).toBe('수요일');
      expect(scheduler.getDayOfWeekKorean(4)).toBe('목요일');
      expect(scheduler.getDayOfWeekKorean(5)).toBe('금요일');
      expect(scheduler.getDayOfWeekKorean(6)).toBe('토요일');
    });
  });
});
