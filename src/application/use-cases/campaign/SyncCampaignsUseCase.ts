import { Campaign } from '@domain/entities/Campaign'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { Money } from '@domain/value-objects/Money'
import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IMetaAdsService, MetaCampaignListItem } from '@application/ports/IMetaAdsService'
import { prisma } from '@/lib/prisma'
import { isTokenExpired } from '@application/utils/metaTokenUtils'

export interface SyncCampaignsInput {
  userId: string
}

export interface SyncCampaignsOutput {
  created: number
  updated: number
  archived: number
  total: number
}

export class MetaConnectionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MetaConnectionError'
  }
}

export class SyncCampaignsUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly metaAdsService: IMetaAdsService
  ) {}

  async execute(input: SyncCampaignsInput): Promise<SyncCampaignsOutput> {
    // 1. Get user's Meta Ad Account
    const metaAdAccount = await prisma.metaAdAccount.findUnique({
      where: { userId: input.userId },
    })

    if (!metaAdAccount) {
      throw new MetaConnectionError('Meta Ad Account not connected')
    }

    // Check token expiry
    if (isTokenExpired(metaAdAccount.tokenExpiry)) {
      throw new MetaConnectionError('Meta access token expired')
    }

    const stats = {
      created: 0,
      updated: 0,
      archived: 0,
      total: 0,
    }

    try {
      // 2. Fetch all campaigns from Meta (with pagination)
      const metaCampaignsMap = new Map<string, MetaCampaignListItem>()
      let hasNext = true
      let after: string | undefined

      while (hasNext) {
        const response = await this.metaAdsService.listCampaigns(
          metaAdAccount.accessToken,
          metaAdAccount.metaAccountId,
          { limit: 100, after }
        )

        response.campaigns.forEach((campaign) => {
          metaCampaignsMap.set(campaign.id, campaign)
        })

        hasNext = response.paging?.hasNext || false
        after = response.paging?.after
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[SyncCampaignsUseCase] Meta campaigns fetched:')
        metaCampaignsMap.forEach((campaign) => {
          console.log(`  - ${campaign.name} (ID: ${campaign.id}, Status: ${campaign.status})`)
        })
        console.log(`[SyncCampaignsUseCase] metaCampaignsMap.size = ${metaCampaignsMap.size}`)
      }

      stats.total = metaCampaignsMap.size

      // 3. Get local campaigns with metaCampaignId for this user
      const localCampaigns = await this.campaignRepository.findByUserId(input.userId)
      const localCampaignsMap = new Map<string, Campaign>()

      localCampaigns.forEach((campaign) => {
        if (campaign.metaCampaignId) {
          localCampaignsMap.set(campaign.metaCampaignId, campaign)
        }
      })

      if (process.env.NODE_ENV === 'development') {
        console.log(`[SyncCampaignsUseCase] localCampaignsMap.size = ${localCampaignsMap.size}`)
      }

      // 4. Sync logic
      // 4a. Create or update campaigns from Meta
      for (const [metaId, metaCampaign] of metaCampaignsMap) {
        const localCampaign = localCampaignsMap.get(metaId)

        if (!localCampaign) {
          // Meta campaign not in local DB → Create
          await this.createLocalCampaign(input.userId, metaCampaign, metaId)
          stats.created++
        } else {
          // Campaign exists in both → Update local if needed
          const wasUpdated = await this.updateLocalCampaign(localCampaign, metaCampaign)
          if (wasUpdated) {
            stats.updated++
          }
        }

        // Remove from local map (remaining will be archived)
        localCampaignsMap.delete(metaId)
      }

      // 4b. Archive campaigns that exist locally but not in Meta (deleted on Meta side)
      for (const [_metaId, localCampaign] of localCampaignsMap) {
        if (!localCampaign.isCompleted()) {
          const archivedCampaign = localCampaign.changeStatus(CampaignStatus.COMPLETED)
          await this.campaignRepository.update(archivedCampaign)
          stats.archived++
        }
      }

      return stats
    } catch (error) {
      if (error instanceof MetaConnectionError) {
        throw error
      }
      throw new Error(`Failed to sync campaigns: ${(error as Error).message}`)
    }
  }

  private async createLocalCampaign(
    userId: string,
    metaCampaign: MetaCampaignListItem,
    metaCampaignId: string
  ): Promise<void> {
    // Meta campaigns can have dailyBudget or lifetimeBudget
    // Use dailyBudget if available, otherwise calculate from lifetimeBudget
    // Default to a minimum of 1000 KRW if neither is set (shouldn't happen normally)
    let budgetAmount = metaCampaign.dailyBudget || 0

    if (budgetAmount === 0 && metaCampaign.lifetimeBudget) {
      // Estimate daily budget from lifetime budget
      // Assume 30 days if no end date, or calculate from date range
      const startDate = metaCampaign.startTime
        ? new Date(metaCampaign.startTime)
        : new Date()
      const endDate = metaCampaign.endTime
        ? new Date(metaCampaign.endTime)
        : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      const daysRemaining = Math.max(
        1,
        Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
      )
      budgetAmount = Math.ceil(metaCampaign.lifetimeBudget / daysRemaining)
    }

    // Ensure minimum budget of 1000 KRW to pass validation
    budgetAmount = Math.max(budgetAmount, 1000)

    // Use Campaign.restore() to bypass date validation for synced campaigns
    // Meta campaigns may have started in the past
    const now = new Date()
    const campaign = Campaign.restore({
      id: crypto.randomUUID(),
      userId,
      name: metaCampaign.name,
      objective: this.mapMetaObjective(metaCampaign.objective),
      status: this.getMetaStatusAsCampaignStatus(metaCampaign.status) || CampaignStatus.ACTIVE,
      dailyBudget: Money.create(budgetAmount, 'KRW'),
      startDate: metaCampaign.startTime ? new Date(metaCampaign.startTime) : new Date(),
      endDate: metaCampaign.endTime ? new Date(metaCampaign.endTime) : undefined,
      metaCampaignId: metaCampaignId,
      createdAt: metaCampaign.createdTime ? new Date(metaCampaign.createdTime) : now,
      updatedAt: metaCampaign.updatedTime ? new Date(metaCampaign.updatedTime) : now,
    })

    // No need to set metaCampaignId or status separately as they're set in restore
    const campaignWithStatus = campaign

    await this.campaignRepository.save(campaignWithStatus)
  }

  private async updateLocalCampaign(
    localCampaign: Campaign,
    metaCampaign: MetaCampaignListItem
  ): Promise<boolean> {
    let updated = false
    let updatedCampaign = localCampaign

    // Update status if different
    const metaStatus = this.getMetaStatusAsCampaignStatus(metaCampaign.status)
    if (localCampaign.status !== metaStatus && metaStatus) {
      // 완료 상태 캠페인은 changeStatus가 차단하므로 restore로 강제 업데이트
      if (localCampaign.isCompleted()) {
        updatedCampaign = Campaign.restore({
          id: localCampaign.id,
          userId: localCampaign.userId,
          name: localCampaign.name,
          objective: localCampaign.objective,
          status: metaStatus,
          dailyBudget: localCampaign.dailyBudget,
          startDate: localCampaign.startDate,
          endDate: localCampaign.endDate,
          targetAudience: localCampaign.targetAudience,
          metaCampaignId: localCampaign.metaCampaignId,
          createdAt: localCampaign.createdAt,
          updatedAt: new Date(),
        })
      } else {
        updatedCampaign = updatedCampaign.changeStatus(metaStatus)
      }
      updated = true
    }

    // Update budget if different
    const newBudgetAmount = metaCampaign.dailyBudget
    if (newBudgetAmount) {
      const newBudget = Money.create(
        newBudgetAmount,
        updatedCampaign.dailyBudget.currency
      )

      if (
        newBudget.amount !== updatedCampaign.dailyBudget.amount ||
        newBudget.currency !== updatedCampaign.dailyBudget.currency
      ) {
        // 완료 상태에서 복원된 캠페인도 예산 업데이트 가능하도록 restore 사용
        updatedCampaign = Campaign.restore({
          id: updatedCampaign.id,
          userId: updatedCampaign.userId,
          name: updatedCampaign.name,
          objective: updatedCampaign.objective,
          status: updatedCampaign.status,
          dailyBudget: newBudget,
          startDate: updatedCampaign.startDate,
          endDate: updatedCampaign.endDate,
          targetAudience: updatedCampaign.targetAudience,
          metaCampaignId: updatedCampaign.metaCampaignId,
          createdAt: updatedCampaign.createdAt,
          updatedAt: new Date(),
        })
        updated = true
      }
    }

    if (updated) {
      await this.campaignRepository.update(updatedCampaign)
    }

    return updated
  }

  private mapMetaObjective(metaObjective: string): CampaignObjective {
    // Map Meta objectives to our CampaignObjective
    const objectiveMap: Record<string, CampaignObjective> = {
      OUTCOME_SALES: CampaignObjective.SALES,
      OUTCOME_LEADS: CampaignObjective.LEADS,
      OUTCOME_TRAFFIC: CampaignObjective.TRAFFIC,
      OUTCOME_AWARENESS: CampaignObjective.AWARENESS,
      OUTCOME_ENGAGEMENT: CampaignObjective.ENGAGEMENT,
    }

    return objectiveMap[metaObjective] || CampaignObjective.CONVERSIONS
  }

  private mapMetaStatus(campaign: Campaign, metaStatus: string): Campaign {
    const statusMap: Record<string, CampaignStatus> = {
      ACTIVE: CampaignStatus.ACTIVE,
      PAUSED: CampaignStatus.PAUSED,
      DELETED: CampaignStatus.COMPLETED,
      ARCHIVED: CampaignStatus.COMPLETED,
    }

    const targetStatus = statusMap[metaStatus]
    if (!targetStatus || campaign.status === targetStatus) {
      return campaign
    }

    return campaign.changeStatus(targetStatus)
  }

  private getMetaStatusAsCampaignStatus(metaStatus: string): CampaignStatus | null {
    const statusMap: Record<string, CampaignStatus> = {
      ACTIVE: CampaignStatus.ACTIVE,
      PAUSED: CampaignStatus.PAUSED,
      DELETED: CampaignStatus.COMPLETED,
      ARCHIVED: CampaignStatus.COMPLETED,
    }

    return statusMap[metaStatus] || null
  }
}
