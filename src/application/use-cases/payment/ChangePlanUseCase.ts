import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository'
import type { IBillingKeyRepository } from '@domain/repositories/IBillingKeyRepository'
import type { IInvoiceRepository } from '@domain/repositories/IInvoiceRepository'
import type { IPaymentLogRepository } from '@domain/repositories/IPaymentLogRepository'
import type { IPaymentGateway } from '@application/ports/IPaymentGateway'
import { Invoice } from '@domain/entities/Invoice'
import { Money } from '@domain/value-objects/Money'
import { PaymentError } from '@domain/errors/PaymentError'
import { PLAN_CONFIGS, isFreePlan } from '@domain/value-objects/SubscriptionPlan'
import { getBillingAmount } from '@domain/value-objects/BillingPeriod'
import { decryptBillingKey } from '@application/utils/BillingKeyEncryption'
import type { ChangePlanRequestDTO, SubscriptionResultDTO } from '@application/dto/payment/PaymentDTOs'

export class ChangePlanUseCase {
  constructor(
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly billingKeyRepo: IBillingKeyRepository,
    private readonly invoiceRepo: IInvoiceRepository,
    private readonly paymentLogRepo: IPaymentLogRepository,
    private readonly paymentGateway: IPaymentGateway
  ) {}

  async execute(dto: ChangePlanRequestDTO): Promise<SubscriptionResultDTO> {
    const { userId, newPlan, newBillingPeriod } = dto

    // 1. Find existing subscription
    const subscription = await this.subscriptionRepo.findByUserId(userId)
    if (!subscription || !subscription.hasAccess()) {
      throw new Error('활성 구독을 찾을 수 없습니다')
    }

    // 2. Validate plan change
    if (subscription.plan === newPlan) {
      throw PaymentError.samePlanChange()
    }

    if (isFreePlan(newPlan)) {
      throw PaymentError.invalidPlan()
    }

    // 3. Get billing key
    const billingKey = await this.billingKeyRepo.findActiveByUserId(userId)
    if (!billingKey) {
      throw PaymentError.billingKeyNotFound()
    }

    // 4. Calculate prorated amount
    const newPlanConfig = PLAN_CONFIGS[newPlan]
    const newAmount = getBillingAmount(newPlanConfig.price, newPlanConfig.annualPrice, newBillingPeriod)

    const oldPlanConfig = PLAN_CONFIGS[subscription.plan]
    const oldAmount = getBillingAmount(
      oldPlanConfig.price,
      oldPlanConfig.annualPrice,
      newBillingPeriod // Use new period for comparison
    )

    // Calculate remaining days ratio
    const now = new Date()
    const totalDays = Math.ceil(
      (subscription.currentPeriodEnd.getTime() - subscription.currentPeriodStart.getTime()) /
        (1000 * 60 * 60 * 24)
    )
    const remainingDays = Math.ceil(
      (subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    const ratio = Math.max(0, remainingDays / totalDays)

    // Prorate: charge difference for remaining period
    const proratedOld = Math.floor(oldAmount * ratio)
    const proratedNew = Math.floor(newAmount * ratio)
    const chargeAmount = Math.max(0, proratedNew - proratedOld)

    // 5. Charge the difference if upgrading
    let paymentKey: string | undefined
    if (chargeAmount > 0) {
      const decryptedKey = decryptBillingKey(billingKey.encryptedBillingKey)
      const orderId = `CHANGE_${userId}_${Date.now()}`
      const orderName = `바투 플랜 변경: ${oldPlanConfig.label} → ${newPlanConfig.label}`

      try {
        // We need customerKey - derive from userId for now
        const customerKey = `customer_${userId}`
        const chargeResult = await this.paymentGateway.chargeBilling(
          decryptedKey,
          orderId,
          chargeAmount,
          orderName,
          customerKey
        )
        paymentKey = chargeResult.paymentKey

        // Log payment
        await this.paymentLogRepo.save({
          userId,
          subscriptionId: subscription.id,
          orderId,
          paymentKey: chargeResult.paymentKey,
          amount: chargeAmount,
          status: chargeResult.status,
          method: chargeResult.method,
          receiptUrl: chargeResult.receipt?.url,
          rawResponse: chargeResult as unknown as Record<string, unknown>,
        })

        // Create invoice for the difference
        const invoice = Invoice.create({
          subscriptionId: subscription.id,
          amount: Money.create(chargeAmount, 'KRW'),
          paymentMethod: 'BILLING',
        })
        const paidInvoice = invoice.markPaid(chargeResult.receipt?.url)
        await this.invoiceRepo.save(paidInvoice)
      } catch (error) {
        throw PaymentError.chargeFailed(error instanceof Error ? error.message : undefined)
      }
    }

    // 6. Update subscription plan
    const updated = subscription.changePlan(newPlan)
    await this.subscriptionRepo.update(updated)

    return {
      subscriptionId: subscription.id,
      plan: newPlan,
      billingPeriod: newBillingPeriod,
      status: updated.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      nextBillingDate: subscription.currentPeriodEnd,
      paymentKey,
      amount: chargeAmount,
    }
  }
}
