import type { IBillingKeyRepository } from '@domain/repositories/IBillingKeyRepository'
import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository'
import type { IInvoiceRepository } from '@domain/repositories/IInvoiceRepository'
import type { IPaymentLogRepository } from '@domain/repositories/IPaymentLogRepository'
import type { IPaymentGateway } from '@application/ports/IPaymentGateway'
import { BillingKey } from '@domain/entities/BillingKey'
import { Subscription } from '@domain/entities/Subscription'
import { Invoice } from '@domain/entities/Invoice'
import { Money } from '@domain/value-objects/Money'
import { PaymentError } from '@domain/errors/PaymentError'
import { PLAN_CONFIGS, isFreePlan } from '@domain/value-objects/SubscriptionPlan'
import { SubscriptionStatus } from '@domain/value-objects/SubscriptionStatus'
import { BillingPeriod, getBillingAmount, getNextBillingDate, getPeriodEndDate } from '@domain/value-objects/BillingPeriod'
import { encryptBillingKey, decryptBillingKey } from '@application/utils/BillingKeyEncryption'
import type { SubscribeRequestDTO, SubscriptionResultDTO } from '@application/dto/payment/PaymentDTOs'

export class SubscribePlanUseCase {
  constructor(
    private readonly billingKeyRepo: IBillingKeyRepository,
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly invoiceRepo: IInvoiceRepository,
    private readonly paymentLogRepo: IPaymentLogRepository,
    private readonly paymentGateway: IPaymentGateway
  ) {}

  async execute(dto: SubscribeRequestDTO): Promise<SubscriptionResultDTO> {
    const { userId, plan, billingPeriod, authKey, customerKey } = dto

    // 1. Validate plan
    if (isFreePlan(plan)) {
      throw PaymentError.invalidPlan()
    }

    const planConfig = PLAN_CONFIGS[plan]

    // 2. Check existing active subscription
    const existingSub = await this.subscriptionRepo.findByUserId(userId)
    if (existingSub && (existingSub.isActive() || existingSub.isTrialing())) {
      throw PaymentError.subscriptionAlreadyActive()
    }

    // 3. Issue billing key first
    let billingKeyResult
    try {
      billingKeyResult = await this.paymentGateway.issueBillingKey(authKey, customerKey)
    } catch (error) {
      throw PaymentError.billingKeyIssueFailed(error instanceof Error ? error.message : undefined)
    }

    // 4. Encrypt and save billing key
    const encrypted = encryptBillingKey(billingKeyResult.billingKey)

    const billingKeyEntity = BillingKey.create({
      userId,
      encryptedBillingKey: encrypted,
      cardCompany: billingKeyResult.cardCompany,
      cardNumber: billingKeyResult.cardNumber,
      method: billingKeyResult.method,
      authenticatedAt: new Date(billingKeyResult.authenticatedAt),
    })
    const savedBillingKey = await this.billingKeyRepo.save(billingKeyEntity)

    // 5. Calculate amount
    const amount = getBillingAmount(planConfig.price, planConfig.annualPrice, billingPeriod)

    // 6. Execute first payment
    const now = new Date()
    const orderId = `ORDER_${userId}_${Date.now()}`
    const orderName = `바투 ${planConfig.label} 플랜 (${billingPeriod === BillingPeriod.MONTHLY ? '월간' : '연간'})`

    // Decrypt billing key for charge
    const decryptedKey = decryptBillingKey(encrypted)

    let chargeResult
    try {
      chargeResult = await this.paymentGateway.chargeBilling(
        decryptedKey,
        orderId,
        amount,
        orderName,
        customerKey
      )
    } catch (error) {
      // Clean up billing key if charge fails
      await this.billingKeyRepo.deactivate(savedBillingKey.id)
      throw PaymentError.chargeFailed(error instanceof Error ? error.message : undefined)
    }

    // 7. Log payment
    await this.paymentLogRepo.save({
      userId,
      orderId,
      paymentKey: chargeResult.paymentKey,
      amount,
      status: chargeResult.status,
      method: chargeResult.method,
      receiptUrl: chargeResult.receipt?.url,
      rawResponse: chargeResult as unknown as Record<string, unknown>,
    })

    // 8. Create or update subscription
    const periodEnd = getPeriodEndDate(now, billingPeriod)
    const nextBillingDate = getNextBillingDate(now, billingPeriod)

    let subscription: Subscription
    if (existingSub) {
      // Reactivate existing cancelled/expired subscription
      subscription = Subscription.restore({
        ...existingSub.toJSON(),
        plan,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelledAt: undefined,
      })
      await this.subscriptionRepo.update(subscription)
    } else {
      subscription = Subscription.create({
        userId,
        plan,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        status: SubscriptionStatus.ACTIVE,
      })
      await this.subscriptionRepo.save(subscription)
    }

    // 9. Create invoice
    const invoice = Invoice.create({
      subscriptionId: subscription.id,
      amount: Money.create(amount, 'KRW'),
      paymentMethod: 'BILLING',
    })
    const paidInvoice = invoice.markPaid(chargeResult.receipt?.url)
    await this.invoiceRepo.save(paidInvoice)

    return {
      subscriptionId: subscription.id,
      plan,
      billingPeriod,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      nextBillingDate,
      paymentKey: chargeResult.paymentKey,
      amount,
    }
  }
}
