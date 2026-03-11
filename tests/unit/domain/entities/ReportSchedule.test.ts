import { describe, it, expect, vi } from 'vitest';
import { ReportSchedule } from '../../../../src/domain/entities/ReportSchedule';

describe('ReportSchedule', () => {
  it('should create a weekly schedule with next Monday 9AM', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-11T10:00:00+09:00')); // Wednesday

    const schedule = ReportSchedule.create({
      userId: 'user-123',
      frequency: 'WEEKLY',
      recipients: ['boss@company.com'],
    });

    expect(schedule.frequency).toBe('WEEKLY');
    expect(schedule.recipients).toEqual(['boss@company.com']);
    expect(schedule.nextSendAt.getHours()).toBe(9);
    expect(schedule.isActive).toBe(true);

    vi.useRealTimers();
  });

  it('should reject empty recipients', () => {
    expect(() => ReportSchedule.create({
      userId: 'user-123', frequency: 'WEEKLY', recipients: [],
    })).toThrow('최소 1개의 수신자');
  });

  it('should advance schedule after sending', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-16T09:00:00+09:00')); // Monday

    const schedule = ReportSchedule.create({
      userId: 'user-123', frequency: 'WEEKLY', recipients: ['a@b.com'],
    });
    
    // Move time forward a bit so new date makes sense
    vi.setSystemTime(new Date('2026-03-16T10:00:00+09:00'));

    const advanced = schedule.advanceSchedule();
    expect(advanced.nextSendAt.getTime()).toBeGreaterThan(schedule.nextSendAt.getTime());

    vi.useRealTimers();
  });
});
