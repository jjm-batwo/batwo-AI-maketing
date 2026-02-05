import type { IBillingKeyRepository } from '@domain/repositories/IBillingKeyRepository'
import type { IPaymentGateway } from '@application/ports/IPaymentGateway'
import { BillingKey } from '@domain/entities/BillingKey'
import { PaymentError } from '@domain/errors/PaymentError'
import { encryptBillingKey } from '@infrastructure/payment/BillingKeyEncryption'
import type { BillingKeyInfoDTO } from '@application/dto/payment/PaymentDTOs'

export class IssueBillingKeyUseCase {
  constructor(
    private readonly billingKeyRepo: IBillingKeyRepository,
    private readonly paymentGateway: IPaymentGateway
  ) {}

  async execute(authKey: string, customerKey: string, userId: string): Promise<BillingKeyInfoDTO> {
    // 1. Deactivate existing billing keys for this user
    const existingKeys = await this.billingKeyRepo.findByUserId(userId)
    for (const key of existingKeys) {
      if (key.isActive) {
        await this.billingKeyRepo.deactivate(key.id)
      }
    }

    // 2. Issue billing key from Toss
    let tossResult
    try {
      tossResult = await this.paymentGateway.issueBillingKey(authKey, customerKey)
    } catch (error) {
      throw PaymentError.billingKeyIssueFailed(
        error instanceof Error ? error.message : undefined
      )
    }

    // 3. Encrypt and save billing key
    const encryptedKey = encryptBillingKey(tossResult.billingKey)
    const billingKey = BillingKey.create({
      userId,
      encryptedBillingKey: encryptedKey,
      cardCompany: tossResult.cardCompany,
      cardNumber: tossResult.cardNumber,
      method: tossResult.method,
      authenticatedAt: new Date(tossResult.authenticatedAt),
    })

    const saved = await this.billingKeyRepo.save(billingKey)

    return {
      id: saved.id,
      cardCompany: saved.cardCompany ?? null,
      cardNumber: saved.cardNumber ?? null,
      method: saved.method,
      isActive: saved.isActive,
      authenticatedAt: saved.authenticatedAt,
    }
  }
}
