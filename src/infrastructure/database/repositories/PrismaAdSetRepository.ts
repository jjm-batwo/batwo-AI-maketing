import { PrismaClient } from '@/generated/prisma'
import { IAdSetRepository } from '@domain/repositories/IAdSetRepository'
import { AdSet } from '@domain/entities/AdSet'
import { AdSetMapper } from '../mappers/AdSetMapper'

export class PrismaAdSetRepository implements IAdSetRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(adSet: AdSet): Promise<AdSet> {
    const data = AdSetMapper.toCreateInput(adSet)

    const created = await this.prisma.adSet.create({
      data: {
        id: data.id,
        name: data.name,
        status: data.status,
        dailyBudget: data.dailyBudget,
        lifetimeBudget: data.lifetimeBudget,
        currency: data.currency,
        billingEvent: data.billingEvent,
        optimizationGoal: data.optimizationGoal,
        bidStrategy: data.bidStrategy,
        targeting: data.targeting ?? undefined,
        placements: data.placements ?? undefined,
        schedule: data.schedule ?? undefined,
        startDate: data.startDate,
        endDate: data.endDate,
        metaAdSetId: data.metaAdSetId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        campaign: {
          connect: { id: data.campaignId },
        },
      },
    })

    return AdSetMapper.toDomain(created)
  }

  async findById(id: string): Promise<AdSet | null> {
    const adSet = await this.prisma.adSet.findUnique({
      where: { id },
    })

    if (!adSet) return null
    return AdSetMapper.toDomain(adSet)
  }

  async findByCampaignId(campaignId: string): Promise<AdSet[]> {
    const adSets = await this.prisma.adSet.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    })

    return adSets.map(AdSetMapper.toDomain)
  }

  async update(adSet: AdSet): Promise<AdSet> {
    const data = AdSetMapper.toUpdateInput(adSet)

    const updated = await this.prisma.adSet.update({
      where: { id: adSet.id },
      data,
    })

    return AdSetMapper.toDomain(updated)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.adSet.delete({
      where: { id },
    })
  }
}
