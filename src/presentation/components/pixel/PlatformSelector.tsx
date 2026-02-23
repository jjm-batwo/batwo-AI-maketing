'use client'

import { cn } from '@/lib/utils'
import { EcommercePlatform } from '@domain/entities/PlatformIntegration'

interface PlatformCard {
  platform: EcommercePlatform
  title: string
  description: string
  badge: '자동 설치' | '수동 설치'
  badgeVariant: 'auto' | 'manual'
  icon: React.ReactNode
}

interface PlatformSelectorProps {
  onSelect: (platform: EcommercePlatform) => void
  selectedPlatform?: EcommercePlatform
}

// 카페24 아이콘 (간단한 SVG)
function Cafe24Icon() {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="8" fill="#FF6B35" />
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
        C24
      </text>
    </svg>
  )
}

// 자체몰 아이콘
function CustomSiteIcon() {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="8" fill="#6366F1" />
      <path
        d="M10 28 L20 12 L30 28 M15 24 L25 24"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// 네이버 아이콘
function NaverIcon() {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="8" fill="#03C75A" />
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
        N
      </text>
    </svg>
  )
}

const PLATFORM_CARDS: PlatformCard[] = [
  {
    platform: EcommercePlatform.CAFE24,
    title: '카페24',
    description: '카페24 쇼핑몰에 픽셀을 자동으로 설치합니다. OAuth 연동 후 스크립트 태그가 자동 삽입됩니다.',
    badge: '자동 설치',
    badgeVariant: 'auto',
    icon: <Cafe24Icon />,
  },
  {
    platform: EcommercePlatform.CUSTOM,
    title: '자체몰 (커스텀)',
    description: '직접 운영하는 웹사이트에 스크립트를 수동으로 설치합니다. HTML에 코드를 붙여넣기만 하면 됩니다.',
    badge: '수동 설치',
    badgeVariant: 'manual',
    icon: <CustomSiteIcon />,
  },
  {
    platform: EcommercePlatform.NAVER_SMARTSTORE,
    title: '네이버 스마트스토어',
    description: '네이버 스마트스토어에 픽셀 설치를 위한 스크립트 코드를 제공합니다.',
    badge: '수동 설치',
    badgeVariant: 'manual',
    icon: <NaverIcon />,
  },
]

export function PlatformSelector({ onSelect, selectedPlatform }: PlatformSelectorProps) {
  return (
    <div className="space-y-3">
      <ul
        role="list"
        aria-label="플랫폼 선택"
        className="space-y-3"
      >
        {PLATFORM_CARDS.map((card) => {
          const isSelected = card.platform === selectedPlatform

          return (
            <li key={card.platform}>
              <button
                type="button"
                data-selected={isSelected}
                onClick={() => onSelect(card.platform)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(card.platform)
                  }
                }}
                className={cn(
                  'flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all duration-150',
                  'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  'dark:hover:bg-accent/50',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm dark:bg-primary/10'
                    : 'border-border bg-card hover:border-accent-foreground/20'
                )}
                aria-pressed={isSelected}
              >
                {/* 플랫폼 아이콘 */}
                <div className="mt-0.5 shrink-0">
                  {card.icon}
                </div>

                {/* 텍스트 영역 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{card.title}</span>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        card.badgeVariant === 'auto'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      )}
                    >
                      {card.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {card.description}
                  </p>
                </div>

                {/* 선택 인디케이터 */}
                <div
                  className={cn(
                    'mt-1 h-4 w-4 shrink-0 rounded-full border-2 transition-colors',
                    isSelected
                      ? 'border-primary bg-primary'
                      : 'border-border bg-transparent'
                  )}
                  aria-hidden="true"
                />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
