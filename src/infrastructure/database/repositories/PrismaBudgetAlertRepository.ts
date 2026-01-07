import { PrismaClient } from '@/generated/prisma'
import { IBudgetAlertRepository } from '@domain/repositories/IBudgetAlertRepository'
import { BudgetAlert } from '@domain/entities/BudgetAlert'

export class PrismaBudgetAlertRepository implements IBudgetAlertRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByCampaignId(campaignId: string): Promise<BudgetAlert | null> {
    const alert = await this.prisma.budgetAlert.findUnique({
      where: { campaignId },
    })

    if (!alert) {
      return null
    }

    return BudgetAlert.create({
      id: alert.id,
      campaignId: alert.campaignId,
      thresholdPercent: alert.thresholdPercent,
      isEnabled: alert.isEnabled,
      alertedAt: alert.alertedAt,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt,
    })
  }

  async create(alert: BudgetAlert): Promise<BudgetAlert> {
    const created = await this.prisma.budgetAlert.create({
      data: {
        id: alert.id,
        campaignId: alert.campaignId,
        thresholdPercent: alert.thresholdPercent,
        isEnabled: alert.isEnabled,
        alertedAt: alert.alertedAt,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt,
      },
    })

    return BudgetAlert.create({
      id: created.id,
      campaignId: created.campaignId,
      thresholdPercent: created.thresholdPercent,
      isEnabled: created.isEnabled,
      alertedAt: created.alertedAt,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    })
  }

  async update(alert: BudgetAlert): Promise<BudgetAlert> {
    const updated = await this.prisma.budgetAlert.update({
      where: { campaignId: alert.campaignId },
      data: {
        thresholdPercent: alert.thresholdPercent,
        isEnabled: alert.isEnabled,
        alertedAt: alert.alertedAt,
        updatedAt: alert.updatedAt,
      },
    })

    return BudgetAlert.create({
      id: updated.id,
      campaignId: updated.campaignId,
      thresholdPercent: updated.thresholdPercent,
      isEnabled: updated.isEnabled,
      alertedAt: updated.alertedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    })
  }

  async delete(campaignId: string): Promise<void> {
    await this.prisma.budgetAlert.delete({
      where: { campaignId },
    })
  }

  async findAllEnabled(): Promise<BudgetAlert[]> {
    const alerts = await this.prisma.budgetAlert.findMany({
      where: { isEnabled: true },
    })

    return alerts.map((alert) =>
      BudgetAlert.create({
        id: alert.id,
        campaignId: alert.campaignId,
        thresholdPercent: alert.thresholdPercent,
        isEnabled: alert.isEnabled,
        alertedAt: alert.alertedAt,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt,
      })
    )
  }
}
