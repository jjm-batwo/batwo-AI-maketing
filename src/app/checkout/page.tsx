import { redirect } from 'next/navigation'
import { auth } from '@/infrastructure/auth'
import { CheckoutForm } from '@/presentation/components/payment/CheckoutForm'
import { SubscriptionPlan, PLAN_CONFIGS } from '@domain/value-objects/SubscriptionPlan'
import { BillingPeriod } from '@domain/value-objects/BillingPeriod'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; period?: string }>
}) {
  const { plan: planParam, period: periodParam } = await searchParams

  // Validate plan before checking auth — invalid params always redirect to pricing
  const plan = planParam?.toUpperCase() as SubscriptionPlan
  if (!plan || !Object.values(SubscriptionPlan).includes(plan) || plan === SubscriptionPlan.FREE) {
    redirect('/#pricing')
  }

  // Validate period before checking auth
  const period = (periodParam?.toUpperCase() || 'MONTHLY') as BillingPeriod
  if (!Object.values(BillingPeriod).includes(period)) {
    redirect('/#pricing')
  }

  const session = await auth()
  if (!session?.user) {
    const callbackUrl = `/checkout?plan=${planParam}&period=${period}`
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  const planConfig = PLAN_CONFIGS[plan]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <CheckoutForm
        plan={plan}
        planLabel={planConfig.label}
        price={planConfig.price}
        annualPrice={planConfig.annualPrice}
        initialPeriod={period}
      />
    </div>
  )
}
