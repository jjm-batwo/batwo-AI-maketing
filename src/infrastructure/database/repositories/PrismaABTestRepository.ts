import { PrismaClient, ABTestStatus as PrismaStatus } from '@/generated/prisma'
import { IABTestRepository, ABTestFilters } from '@domain/repositories/IABTestRepository'
import { ABTest } from '@domain/entities/ABTest'
import { ABTestMapper } from '../mappers/ABTestMapper'

export class PrismaABTestRepository implements IABTestRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(abTest: ABTest): Promise<ABTest> {
    const data = ABTestMapper.toCreateInput(abTest)

    const created = await this.prisma.aBTest.create({
      data: {
        id: data.id,
        campaignId: data.campaignId,
        name: data.name,
        description: data.description,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        confidenceLevel: data.confidenceLevel,
        minimumSampleSize: data.minimumSampleSize,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        variants: data.variants,
      },
      include: { variants: true },
    })

    return ABTestMapper.toDomain(created)
  }

  async findById(id: string): Promise<ABTest | null> {
    const abTest = await this.prisma.aBTest.findUnique({
      where: { id },
      include: { variants: true },
    })

    if (!abTest) {
      return null
    }

    return ABTestMapper.toDomain(abTest)
  }

  async findByCampaignId(campaignId: string): Promise<ABTest[]> {
    const abTests = await this.prisma.aBTest.findMany({
      where: { campaignId },
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    })

    return abTests.map(ABTestMapper.toDomain)
  }

  async findByFilters(filters: ABTestFilters): Promise<ABTest[]> {
    const where = this.buildWhereClause(filters)

    const abTests = await this.prisma.aBTest.findMany({
      where,
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    })

    return abTests.map(ABTestMapper.toDomain)
  }

  async update(abTest: ABTest): Promise<ABTest> {
    const data = ABTestMapper.toUpdateInput(abTest)

    // Supabase Best Practice: Batch N+1 → $transaction (data-n-plus-one)
    // main + N variants + fetch = N+2 쿼리 → $transaction으로 원자적 배치 실행
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.aBTest.update({
        where: { id: abTest.id },
        data,
      })

      await Promise.all(
        abTest.variants.map((variant) => {
          const variantData = ABTestMapper.toVariantUpdateInput(variant)
          return tx.aBTestVariant.update({
            where: { id: variant.id },
            data: variantData,
          })
        })
      )

      return tx.aBTest.findUnique({
        where: { id: abTest.id },
        include: { variants: true },
      })
    })

    if (!updated) {
      throw new Error('A/B 테스트를 찾을 수 없습니다')
    }

    return ABTestMapper.toDomain(updated)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.aBTest.delete({
      where: { id },
    })
  }

  async findRunningTests(): Promise<ABTest[]> {
    const abTests = await this.prisma.aBTest.findMany({
      where: { status: 'RUNNING' },
      include: { variants: true },
      orderBy: { startDate: 'asc' },
    })

    return abTests.map(ABTestMapper.toDomain)
  }

  private buildWhereClause(filters: ABTestFilters) {
    const where: Record<string, unknown> = {}

    if (filters.campaignId) {
      where.campaignId = filters.campaignId
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        where.status = { in: filters.status.map((s) => s as PrismaStatus) }
      } else {
        where.status = filters.status as PrismaStatus
      }
    }

    if (filters.startDateFrom || filters.startDateTo) {
      where.startDate = {}
      if (filters.startDateFrom) {
        ;(where.startDate as Record<string, Date>).gte = filters.startDateFrom
      }
      if (filters.startDateTo) {
        ;(where.startDate as Record<string, Date>).lte = filters.startDateTo
      }
    }

    return where
  }
}
