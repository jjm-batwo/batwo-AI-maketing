import { describe, it, expect, beforeEach } from 'vitest'
import { setupIntegrationTest, getPrismaClient, createTestUser } from '../setup'
import { PrismaReportRepository } from '@infrastructure/database/repositories/PrismaReportRepository'
import { Report, ReportType } from '@domain/entities/Report'
import { DateRange } from '@domain/value-objects/DateRange'

describe('PrismaReportRepository', () => {
  setupIntegrationTest()

  let repository: PrismaReportRepository
  let testUserId: string

  beforeEach(async () => {
    const prisma = getPrismaClient()
    repository = new PrismaReportRepository(prisma)

    const user = await createTestUser()
    testUserId = user.id
  })

  const createTestReport = (overrides: Partial<Parameters<typeof Report.restore>[0]> = {}) => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    return Report.restore({
      id: crypto.randomUUID(),
      type: ReportType.WEEKLY,
      userId: testUserId,
      campaignIds: ['campaign-1'],
      dateRange: DateRange.create(weekAgo, now),
      sections: [],
      aiInsights: [],
      status: 'DRAFT',
      generatedAt: undefined,
      sentAt: undefined,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
  }

  describe('save', () => {
    it('should save and return a report', async () => {
      const report = createTestReport()

      const saved = await repository.save(report)

      expect(saved.id).toBe(report.id)
      expect(saved.type).toBe(ReportType.WEEKLY)
      expect(saved.status).toBe('DRAFT')
    })
  })

  describe('findById', () => {
    it('should find report by id', async () => {
      const report = createTestReport()
      await repository.save(report)

      const found = await repository.findById(report.id)

      expect(found).not.toBeNull()
      expect(found!.id).toBe(report.id)
      expect(found!.type).toBe(ReportType.WEEKLY)
    })

    it('should return null for non-existent report', async () => {
      const found = await repository.findById('non-existent-id')

      expect(found).toBeNull()
    })
  })

  describe('findByUserId', () => {
    it('should find all reports for a user', async () => {
      const report1 = createTestReport({ id: crypto.randomUUID() })
      const report2 = createTestReport({ id: crypto.randomUUID() })

      await repository.save(report1)
      await repository.save(report2)

      const reports = await repository.findByUserId(testUserId)

      expect(reports).toHaveLength(2)
    })
  })

  describe('findByFilters', () => {
    it('should filter reports by type', async () => {
      const weeklyReport = createTestReport({ type: ReportType.WEEKLY })
      const dailyReport = createTestReport({
        id: crypto.randomUUID(),
        type: ReportType.DAILY
      })

      await repository.save(weeklyReport)
      await repository.save(dailyReport)

      const reports = await repository.findByFilters({
        userId: testUserId,
        type: ReportType.WEEKLY
      })

      expect(reports).toHaveLength(1)
      expect(reports[0].type).toBe(ReportType.WEEKLY)
    })

    it('should filter reports by status', async () => {
      const draftReport = createTestReport({ status: 'DRAFT' })
      const generatedReport = createTestReport({
        id: crypto.randomUUID(),
        status: 'GENERATED',
        generatedAt: new Date(),
      })

      await repository.save(draftReport)
      await repository.save(generatedReport)

      const reports = await repository.findByFilters({
        userId: testUserId,
        status: 'GENERATED'
      })

      expect(reports).toHaveLength(1)
      expect(reports[0].status).toBe('GENERATED')
    })
  })

  describe('findLatestByUserAndType', () => {
    it('should find the latest report of specific type for user', async () => {
      const olderReport = createTestReport({
        id: crypto.randomUUID(),
        createdAt: new Date('2024-01-01'),
      })
      const newerReport = createTestReport({
        id: crypto.randomUUID(),
        createdAt: new Date('2024-01-15'),
      })

      await repository.save(olderReport)
      await repository.save(newerReport)

      const latest = await repository.findLatestByUserAndType(testUserId, ReportType.WEEKLY)

      expect(latest).not.toBeNull()
      expect(latest!.id).toBe(newerReport.id)
    })

    it('should return null if no reports exist', async () => {
      const latest = await repository.findLatestByUserAndType(testUserId, ReportType.WEEKLY)

      expect(latest).toBeNull()
    })
  })

  describe('update', () => {
    it('should update report', async () => {
      const report = createTestReport()
      await repository.save(report)

      const withSection = report.addSection({
        title: 'Test Section',
        content: 'Test content',
        metrics: { impressions: 1000 },
      })
      const result = await repository.update(withSection)

      expect(result.sections).toHaveLength(1)
      expect(result.sections[0].title).toBe('Test Section')
    })
  })

  describe('delete', () => {
    it('should delete report', async () => {
      const report = createTestReport()
      await repository.save(report)

      await repository.delete(report.id)

      const found = await repository.findById(report.id)
      expect(found).toBeNull()
    })
  })
})
