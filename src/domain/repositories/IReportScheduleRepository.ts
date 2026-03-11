import { ReportSchedule } from '../entities/ReportSchedule';

export interface IReportScheduleRepository {
  findById(id: string): Promise<ReportSchedule | null>;
  findByUserId(userId: string): Promise<ReportSchedule[]>;
  findDue(beforeDate: Date): Promise<ReportSchedule[]>;
  save(schedule: ReportSchedule): Promise<ReportSchedule>;
  update(schedule: ReportSchedule): Promise<ReportSchedule>;
  delete(id: string): Promise<void>;
}
