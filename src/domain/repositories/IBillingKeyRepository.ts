import { BillingKey } from '../entities/BillingKey'

export interface IBillingKeyRepository {
  save(billingKey: BillingKey): Promise<BillingKey>
  findById(id: string): Promise<BillingKey | null>
  findByUserId(userId: string): Promise<BillingKey[]>
  findActiveByUserId(userId: string): Promise<BillingKey | null>
  update(billingKey: BillingKey): Promise<BillingKey>
  deactivate(id: string): Promise<void>
}
