import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import {
  NotFoundError,
  ForbiddenError,
  ExternalServiceError,
  ValidationError,
} from '@application/errors'

/**
 * Delete Campaign Use Case
 *
 * Uses domain error throw pattern for error handling.
 * Errors are caught by API routes / tool callers.
 */
export class DeleteCampaignUseCase {
  constructor(private readonly campaignRepository: ICampaignRepository) {}

  /**
   * Execute campaign deletion
   *
   * @throws ValidationError - if campaignId or userId is missing
   * @throws NotFoundError - if campaign does not exist
   * @throws ForbiddenError - if user does not own the campaign
   * @throws ExternalServiceError - if database operation fails
   */
  async execute(campaignId: string, userId: string): Promise<void> {
    // Validate input
    if (!campaignId || campaignId.trim() === '') {
      throw ValidationError.missingField('campaignId')
    }

    if (!userId || userId.trim() === '') {
      throw ValidationError.missingField('userId')
    }

    // Fetch campaign
    let campaign
    try {
      campaign = await this.campaignRepository.findById(campaignId)
    } catch (error) {
      throw ExternalServiceError.database(
        'fetch campaign',
        error instanceof Error ? error.message : undefined
      )
    }

    // Check if campaign exists
    if (!campaign) {
      throw NotFoundError.entity('Campaign', campaignId)
    }

    // Check ownership
    if (campaign.userId !== userId) {
      throw ForbiddenError.resourceAccess('Campaign', campaignId)
    }

    // Delete campaign
    try {
      await this.campaignRepository.delete(campaignId)
    } catch (error) {
      throw ExternalServiceError.database(
        'delete campaign',
        error instanceof Error ? error.message : undefined
      )
    }
  }
}
