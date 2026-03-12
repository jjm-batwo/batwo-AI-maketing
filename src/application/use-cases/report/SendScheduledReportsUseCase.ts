import { IReportScheduleRepository } from '@domain/repositories/IReportScheduleRepository'
import { IReportRepository } from '@domain/repositories/IReportRepository'
import { IEmailService } from '@application/ports/IEmailService'
import { ReportType } from '@domain/entities/Report'

export class SendScheduledReportsUseCase {
  constructor(
    private readonly scheduleRepository: IReportScheduleRepository,
    private readonly reportRepository: IReportRepository,
    private readonly emailService: IEmailService
  ) {}

  async execute(): Promise<{ sentCount: number; failedCount: number }> {
    const now = new Date()
    const dueSchedules = await this.scheduleRepository.findDue(now)

    let sentCount = 0
    let failedCount = 0

    for (const schedule of dueSchedules) {
      try {
        const type = schedule.frequency as ReportType

        // 최신 보고서 조회
        const latestReport = await this.reportRepository.findLatestByUserAndType(
          schedule.userId,
          type
        )

        if (!latestReport) continue

        // 공유 토큰 생성
        const sharedReport = latestReport.generateShareToken(7)
        await this.reportRepository.update(sharedReport)

        const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reports/share/${sharedReport.shareToken}`

        // 이메일 발송
        const result = await this.emailService.sendReportEmail({
          to: schedule.recipients,
          subject: `[바투 AI] ${this.getSubjectByFrequency(schedule.frequency)} 광고 성과 보고서`,
          reportId: latestReport.id,
          reportSummary: latestReport.calculateSummaryMetrics(),
          shareUrl,
        })

        if (result.success) {
          sentCount++
          const advanced = schedule.advanceSchedule()
          await this.scheduleRepository.update(advanced)
        } else {
          failedCount++
        }
      } catch (err) {
        console.error('Failed to send scheduled report:', err)
        failedCount++
      }
    }

    return { sentCount, failedCount }
  }

  private getSubjectByFrequency(frequency: string): string {
    switch (frequency) {
      case 'DAILY':
        return '일간'
      case 'WEEKLY':
        return '주간'
      case 'MONTHLY':
        return '월간'
      default:
        return ''
    }
  }
}
