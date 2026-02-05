'use client'

import { memo } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useIntersectionObserver } from '@/presentation/hooks'
import { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'
import { PRICING_TIERS, formatPrice } from './pricingData'

export const PricingSection = memo(function PricingSection() {
  const { ref, isIntersecting } = useIntersectionObserver()

  const getCTALink = (plan: SubscriptionPlan): string => {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return '/register'
      case SubscriptionPlan.STARTER:
        return '/checkout?plan=starter&period=monthly'
      case SubscriptionPlan.PRO:
        return '/checkout?plan=pro&period=monthly'
      case SubscriptionPlan.ENTERPRISE:
        return '/contact'
      default:
        return '/register'
    }
  }

  const getCTAText = (plan: SubscriptionPlan): string => {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return '무료로 시작하기'
      case SubscriptionPlan.STARTER:
        return '스타터 시작하기'
      case SubscriptionPlan.PRO:
        return '프로 시작하기'
      case SubscriptionPlan.ENTERPRISE:
        return '영업팀 문의'
      default:
        return '시작하기'
    }
  }

  const getAnnualPrice = (monthlyPrice: number): string => {
    if (monthlyPrice <= 0 || monthlyPrice === -1) return ''
    const annualPrice = Math.floor(monthlyPrice * 12 * 0.8) // 20% discount
    return `₩${annualPrice.toLocaleString('ko-KR')}/년`
  }

  const hasAnnualPrice = (plan: SubscriptionPlan): boolean => {
    return plan === SubscriptionPlan.STARTER || plan === SubscriptionPlan.PRO
  }

  return (
    <section id="pricing" className="py-16 md:py-24 bg-muted/30 overflow-hidden">
      <div
        ref={ref}
        className={`container mx-auto px-4 transition-all duration-1000 ${
          isIntersecting ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Section Header */}
        <header className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">모든 비즈니스에 맞는 요금제</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            무료로 시작하고, 성장에 맞춰 업그레이드하세요.
          </p>
        </header>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {PRICING_TIERS.map(({ plan, config }) => {
            const isPopular = plan === SubscriptionPlan.PRO
            const isPro = plan === SubscriptionPlan.PRO

            return (
              <Card
                key={plan}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  isPopular
                    ? 'border-2 border-primary shadow-lg lg:scale-105'
                    : 'border hover:border-primary/50'
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute top-0 right-0 left-0">
                    <Badge
                      variant="default"
                      className="w-full rounded-none rounded-t-lg justify-center py-1"
                    >
                      인기
                    </Badge>
                  </div>
                )}

                <CardHeader className={`pb-4 ${isPopular ? 'pt-8' : 'pt-6'}`}>
                  <CardTitle className="text-xl">{config.label}</CardTitle>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">{formatPrice(config.price)}</span>
                    {config.price > 0 && (
                      <span className="text-muted-foreground text-sm">/월</span>
                    )}
                  </div>
                  {hasAnnualPrice(plan) && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        연간 결제 시 {getAnnualPrice(config.price)}
                      </Badge>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-3">{config.description}</p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features List */}
                  <ul className="space-y-3" role="list">
                    {config.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check
                          className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    className="w-full"
                    size="lg"
                    variant={isPro ? 'default' : 'outline'}
                    asChild
                  >
                    <Link href={getCTALink(plan)} aria-label={`${config.label} 플랜 선택`}>
                      {getCTAText(plan)}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Additional Info */}
        <p className="text-sm text-center text-muted-foreground mt-12">
          모든 유료 플랜은 14일 무료 체험이 제공됩니다{' '}
          <span aria-hidden="true">&middot;</span> 신용카드 불필요{' '}
          <span aria-hidden="true">&middot;</span> 언제든 취소 가능
        </p>
      </div>
    </section>
  )
})
