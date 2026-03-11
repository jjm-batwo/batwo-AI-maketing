export type ScheduleFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

interface CreateReportScheduleProps {
  userId: string;
  frequency: ScheduleFrequency;
  recipients: string[];
}

export interface ReportScheduleProps {
  id: string;
  userId: string;
  frequency: string;
  recipients: string[];
  nextSendAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ReportSchedule {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private _frequency: ScheduleFrequency,
    private _recipients: string[],
    private _nextSendAt: Date,
    private _isActive: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(props: CreateReportScheduleProps): ReportSchedule {
    if (props.recipients.length === 0) {
      throw new Error('최소 1개의 수신자 이메일이 필요합니다');
    }
    if (props.recipients.length > 10) {
      throw new Error('수신자는 최대 10명까지 가능합니다');
    }

    const now = new Date();
    return new ReportSchedule(
      crypto.randomUUID(),
      props.userId,
      props.frequency,
      props.recipients,
      ReportSchedule.calculateNextSendAt(props.frequency, now),
      true,
      now,
      now,
    );
  }

  static restore(props: ReportScheduleProps): ReportSchedule {
    return new ReportSchedule(
      props.id,
      props.userId,
      props.frequency as ScheduleFrequency,
      props.recipients,
      props.nextSendAt,
      props.isActive,
      props.createdAt,
      props.updatedAt,
    );
  }

  static calculateNextSendAt(frequency: ScheduleFrequency, from: Date): Date {
    const next = new Date(from);
    switch (frequency) {
      case 'DAILY':
        next.setDate(next.getDate() + 1);
        next.setHours(9, 0, 0, 0); // 오전 9시 KST
        break;
      case 'WEEKLY': {
        const daysToAdd = ((7 - next.getDay() + 1) % 7) || 7;
        next.setDate(next.getDate() + daysToAdd); // 다음 월요일
        next.setHours(9, 0, 0, 0);
        break;
      }
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1, 1); // 다음 달 1일
        next.setHours(9, 0, 0, 0);
        break;
    }
    return next;
  }

  advanceSchedule(): ReportSchedule {
    return new ReportSchedule(
      this._id,
      this._userId,
      this._frequency,
      this._recipients,
      ReportSchedule.calculateNextSendAt(this._frequency, this._nextSendAt),
      this._isActive,
      this._createdAt,
      new Date(),
    );
  }

  deactivate(): ReportSchedule {
    return new ReportSchedule(
      this._id,
      this._userId,
      this._frequency,
      this._recipients,
      this._nextSendAt,
      false,
      this._createdAt,
      new Date(),
    );
  }

  get id() { return this._id; }
  get userId() { return this._userId; }
  get frequency() { return this._frequency; }
  get recipients() { return [...this._recipients]; }
  get nextSendAt() { return this._nextSendAt; }
  get isActive() { return this._isActive; }
  get createdAt() { return this._createdAt; }
  get updatedAt() { return this._updatedAt; }
}
