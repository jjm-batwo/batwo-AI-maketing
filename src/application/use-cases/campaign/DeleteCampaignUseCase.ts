import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import {
  NotFoundError,
  ForbiddenError,
  ExternalServiceError,
  ValidationError,
  Result,
  success,
  failure,
  tryCatch,
} from '@application/errors'

/**
 * Delete Campaign Use Case
 *
 * Demonstrates Result pattern usage for expected error cases.
 * This approach is useful when errors are part of normal business flow.
 */
export class DeleteCampaignUseCase {
  constructor(private readonly campaignRepository: ICampaignRepository) {}

  /**
   * Execute campaign deletion
   *
   * @returns Result with void on success, or specific error on failure
   */
  async execute(
    campaignId: string,
    userId: string
  ): Promise<Result<void, ValidationError | NotFoundError | ForbiddenError | ExternalServiceError>> {
    // Validate input
    if (!campaignId || campaignId.trim() === '') {
      return failure(ValidationError.missingField('campaignId'))
    }

    if (!userId || userId.trim() === '') {
      return failure(ValidationError.missingField('userId'))
    }

    // Fetch campaign
    const campaign = await tryCatch(
      () => this.campaignRepository.findById(campaignId),
      (error: unknown) => ExternalServiceError.database('fetch campaign', error instanceof Error ? error.message : undefined)
    )

    if (!campaign.ok) {
      return campaign // Return failure
    }

    // Check if campaign exists
    if (!campaign.value) {
      return failure(NotFoundError.entity('Campaign', campaignId))
    }

    // Check ownership
    if (campaign.value.userId !== userId) {
      return failure(ForbiddenError.resourceAccess('Campaign', campaignId))
    }

    // Delete campaign
    const deleteResult = await tryCatch(
      () => this.campaignRepository.delete(campaignId),
      (error: unknown) => ExternalServiceError.database('delete campaign', error instanceof Error ? error.message : undefined)
    )

    if (!deleteResult.ok) {
      return deleteResult
    }

    return success(undefined)
  }

  /**
   * Execute with exceptions (alternative approach)
   *
   * Use this when you want to throw errors instead of returning Result.
   * Useful for API routes that have error middleware.
   */
  async executeWithExceptions(campaignId: string, userId: string): Promise<void> {
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
      throw ExternalServiceError.database('fetch campaign', error instanceof Error ? error.message : undefined)
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
      throw ExternalServiceError.database('delete campaign', error instanceof Error ? error.message : undefined)
    }
  }
}
