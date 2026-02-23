'use client'

import { memo, useState, useRef } from 'react'
import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useScrollAnimation } from '@/presentation/hooks'
import { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'
import { PRICING_TIERS, formatPrice, FEATURE_COMPARISON } from './pricingData'

interface PricingSectionProps {
  id?: string
}

export const PricingSection = memo(function PricingSection({ id = 'pricing' }: PricingSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { isVisible } = useScrollAnimation(sectionRef, { threshold: 0.1 })
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')

  const getCTALink = (plan: SubscriptionPlan): string => {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return '/register'
      case SubscriptionPlan.STARTER:
        return `/checkout?plan=starter&period=${billingPeriod}`
      case SubscriptionPlan.PRO:
        return `/checkout?plan=pro&period=${billingPeriod}`
      case SubscriptionPlan.ENTERPRISE:
        return 'mailto:contact@batwo.ai'
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

  return (
    <section id={id} className="py-20 md:py-32 overflow-hidden">
      <div
        ref={sectionRef}
        className={`container mx-auto px-4 transition-all duration-1000 ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
          }`}
      >
        {/* Section Header */}
        <header className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">모든 비즈니스에 맞는 요금제</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            무료로 시작하고, 성장에 맞춰 업그레이드하세요.
          </p>
        </header>

        {/* Billing Period Toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className={cn('text-sm', billingPeriod === 'monthly' ? 'font-semibold' : 'text-muted-foreground')}>
            월간
          </span>
          <button
            onClick={() => setBillingPeriod(prev => prev === 'monthly' ? 'annual' : 'monthly')}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              billingPeriod === 'annual' ? 'bg-primary' : 'bg-muted'
            )}
            aria-label="결제 주기 전환"
          >
            <span className={cn(
              'inline-block h-4 w-4 rounded-full bg-white transition-transform',
              billingPeriod === 'annual' ? 'translate-x-6' : 'translate-x-1'
            )} />
          </button>
          <span className={cn('text-sm', billingPeriod === 'annual' ? 'font-semibold' : 'text-muted-foreground')}>
            연간
            <span className="ml-1 text-xs text-primary font-medium">-20%</span>
          </span>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {PRICING_TIERS.map(({ plan, config }) => {
            const isPopular = plan === SubscriptionPlan.PRO
            const isPro = plan === SubscriptionPlan.PRO

            return (
              <Card
                key={plan}
                className={`flex flex-col h-full relative overflow-hidden transition-all duration-300 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 ${isPopular
                    ? 'border-primary ring-1 ring-primary shadow-md transform lg:-translate-y-2 lg:scale-105 z-10 hover:shadow-primary/20'
                    : 'border-gray-100 hover:border-gray-200'
                  }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute top-0 right-0 left-0">
                    <Badge
                      variant="default"
                      className="w-full rounded-none rounded-t-lg justify-center py-1.5 bg-primary text-primary-foreground border-0 font-semibold"
                    >
                      가장 인기 있는 플랜
                    </Badge>
                  </div>
                )}

                <CardHeader className={`pb-4 ${isPopular ? 'pt-8' : 'pt-6'}`}>
                  <CardTitle className="text-sm font-medium text-muted-foreground">{config.label}</CardTitle>
                  <div className="mt-4">
                    {billingPeriod === 'annual' && config.price > 0 && config.price !== -1 ? (
                      <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
                        <span className="text-sm md:text-base text-muted-foreground line-through">
                          {formatPrice(config.price)}
                        </span>
                        <span className="text-3xl md:text-4xl font-bold">
                          {formatPrice(Math.floor(config.price * 0.8))}
                        </span>
                        <span className="text-muted-foreground text-sm">/월</span>
                        <Badge variant="secondary" className="text-xs text-primary">-20%</Badge>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl md:text-4xl font-bold">{formatPrice(config.price)}</span>
                        {config.price > 0 && (
                          <span className="text-muted-foreground text-sm">/월</span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">{config.description}</p>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 p-6 pt-0 space-y-6">
                  {/* Features List */}
                  <ul className="space-y-2" role="list">
                    {FEATURE_COMPARISON.map((feature, index) => {
                      const included = feature.plans[plan]
                      return (
                        <li
                          key={index}
                          className={cn('flex items-center gap-2 text-sm', !included && 'text-muted-foreground')}
                        >
                          {included ? (
                            <Check className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" aria-hidden="true" />
                          )}
                          <span className={cn(!included && 'line-through')}>{feature.text}</span>
                        </li>
                      )
                    })}
                  </ul>

                  {/* CTA Button */}
                  <div className="mt-auto pt-6">
                    <Button
                      className="w-full"
                      size="lg"
                      variant={isPro ? 'default' : 'outline'}
                      asChild
                    >
                      {plan === SubscriptionPlan.ENTERPRISE ? (
                        <a href={getCTALink(plan)} aria-label={`${config.label} 플랜 선택`}>
                          {getCTAText(plan)}
                        </a>
                      ) : (
                        <Link href={getCTALink(plan)} aria-label={`${config.label} 플랜 선택`}>
                          {getCTAText(plan)}
                        </Link>
                      )}
                    </Button>
                  </div>
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
