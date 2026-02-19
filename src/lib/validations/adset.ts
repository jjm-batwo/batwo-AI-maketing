import { z } from 'zod'
import { OptimizationGoal } from '@domain/value-objects/OptimizationGoal'
import { BidStrategy } from '@domain/value-objects/BidStrategy'
import { BillingEvent } from '@domain/value-objects/BillingEvent'

export const adSetFormSchema = z.object({
  name: z.string().min(1, '광고 세트 이름은 필수입니다').max(255),
  optimizationGoal: z.nativeEnum(OptimizationGoal),
  bidStrategy: z.nativeEnum(BidStrategy),
  billingEvent: z.nativeEnum(BillingEvent),
  placements: z.enum(['AUTOMATIC', 'MANUAL']),
})

export type AdSetFormInput = z.infer<typeof adSetFormSchema>
