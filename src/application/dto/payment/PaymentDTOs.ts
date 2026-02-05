import { BillingPeriod } from '@domain/value-objects/BillingPeriod'
import { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'

// -- Request DTOs --

export interface CheckoutRequestDTO {
  plan: SubscriptionPlan
  billingPeriod: BillingPeriod
}

export interface BillingAuthCallbackDTO {
  authKey: string
  customerKey: string
}

export interface SubscribeRequestDTO {
  userId: string
  plan: SubscriptionPlan
  billingPeriod: BillingPeriod
  authKey: string
  customerKey: string
}

export interface ChangePlanRequestDTO {
  userId: string
  newPlan: SubscriptionPlan
  newBillingPeriod: BillingPeriod
}

export interface CancelSubscriptionRequestDTO {
  userId: string
  reason?: string
}

// -- Response DTOs --

export interface BillingKeyInfoDTO {
  id: string
  cardCompany: string | null
  cardNumber: string | null
  method: string
  isActive: boolean
  authenticatedAt: Date
}

export interface SubscriptionResultDTO {
  subscriptionId: string
  plan: SubscriptionPlan
  billingPeriod: BillingPeriod
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  nextBillingDate: Date
  paymentKey?: string
  amount: number
}

export interface PaymentHistoryItemDTO {
  id: string
  orderId: string
  paymentKey?: string
  amount: number
  status: string
  method?: string
  failReason?: string
  receiptUrl?: string
  createdAt: Date
}

export interface CheckoutInfoDTO {
  plan: SubscriptionPlan
  planLabel: string
  billingPeriod: BillingPeriod
  amount: number
  orderName: string
  customerKey: string
}
