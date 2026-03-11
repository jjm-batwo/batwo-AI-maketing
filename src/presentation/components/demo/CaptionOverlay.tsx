'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Caption {
  id: string
  text: string
  subtitle?: string
}

// Meta App Review 촬영용 캡션 시퀀스 (기본 - 5개 권한 전체)
const defaultCaptionSequence: Caption[] = [
  // 인트로
  {
    id: 'intro',
    text: 'Batwo - AI Marketing Solution for E-commerce Advertisers',
    subtitle: 'Optimize Meta ad campaigns with real-time data and AI insights',
  },

  // 로그인
  {
    id: 'login-1',
    text: 'Step 1: User Authentication',
    subtitle: 'Users can sign in with Google, Kakao, or Meta accounts',
  },
  {
    id: 'login-2',
    text: 'Click "Continue with Meta" to start OAuth flow',
    subtitle: 'This initiates the permission request process',
  },

  // OAuth 권한
  {
    id: 'oauth-1',
    text: 'Step 2: User Grants Permissions',
    subtitle: 'The following permissions are requested:',
  },
  {
    id: 'oauth-2',
    text: 'ads_read - View ad campaign performance metrics',
    subtitle: 'Access ROAS, CTR, conversions, and spend data',
  },
  {
    id: 'oauth-3',
    text: 'ads_management - AI-powered campaign optimization',
    subtitle: 'Enable personalized optimization recommendations',
  },
  {
    id: 'oauth-4',
    text: 'business_management - Multi-account management',
    subtitle: 'Manage multiple ad accounts from one dashboard',
  },
  {
    id: 'oauth-5',
    text: 'pages_show_list & pages_read_engagement',
    subtitle: 'Analyze Facebook and Instagram page engagement',
  },
  {
    id: 'oauth-6',
    text: 'User clicks "Continue" to grant access',
    subtitle: 'Permissions are now authorized',
  },

  // 온보딩
  {
    id: 'onboard-1',
    text: 'Step 3: Onboarding - Permission Explanation',
    subtitle: 'App explains why each permission is needed',
  },
  {
    id: 'onboard-2',
    text: 'Why connect your Meta account?',
    subtitle: 'Clear explanation of data usage and benefits',
  },

  // Use Case 1: ads_read
  {
    id: 'use1-1',
    text: 'Use Case 1: Real-time Ad Performance Monitoring',
    subtitle: 'Using ads_read permission',
  },
  {
    id: 'use1-2',
    text: 'Dashboard displays real-time KPIs from Meta Ads',
    subtitle: 'ROAS, CTR, Conversions, Total Spend',
  },
  {
    id: 'use1-3',
    text: 'Interactive charts show performance trends',
    subtitle: 'Spend Trend and ROAS Trend over time',
  },

  // Use Case 2: ads_management
  {
    id: 'use2-1',
    text: 'Use Case 2: AI-Powered Optimization',
    subtitle: 'Using ads_management permission',
  },
  {
    id: 'use2-2',
    text: 'AI Insight: ROAS Improvement Opportunity',
    subtitle: 'Weekend budget increase could raise ROAS by 0.3x',
  },
  {
    id: 'use2-3',
    text: 'AI Insight: Budget Depletion Warning',
    subtitle: 'Daily budget will be depleted by 3 PM',
  },
  {
    id: 'use2-4',
    text: 'AI Insight: Targeting Optimization',
    subtitle: 'Women 25-34 have 2.1x higher conversion rate',
  },
  {
    id: 'use2-5',
    text: 'Users can take immediate action',
    subtitle: 'Click to adjust budget or targeting based on AI recommendations',
  },

  // Use Case 3: business_management
  {
    id: 'use3-1',
    text: 'Use Case 3: Campaign Management',
    subtitle: 'Using business_management permission',
  },
  {
    id: 'use3-2',
    text: 'View all campaigns with status and performance',
    subtitle: 'Filter by Active, Paused, Completed, Draft',
  },

  // 엔딩
  {
    id: 'end-1',
    text: 'Summary: Batwo provides advertisers with:',
    subtitle: '✓ Real-time monitoring ✓ AI optimization ✓ Unified management',
  },
  {
    id: 'end-2',
    text: 'All features require the requested Meta permissions',
    subtitle: 'Thank you for reviewing our application',
  },
]

// Ads Management Standard Access 촬영용 캡션 시퀀스 (ads_read + ads_management 전용)
const adsStandardAccessCaptions: Caption[] = [
  // Scene 1: App Introduction (0:00-0:10)
  {
    id: 'intro',
    text: 'Batwo — AI-Powered Marketing Platform for E-Commerce',
    subtitle: 'Demonstrating Ads Management Standard Access',
  },

  // Scene 2: Login + OAuth (0:10-0:50)
  {
    id: 'login-1',
    text: 'Step 1: User Login & Meta Authorization',
    subtitle: 'Starting from logged-out state',
  },
  {
    id: 'login-2',
    text: 'User clicks "Continue with Meta"',
    subtitle: 'Initiating Meta OAuth permission request',
  },
  {
    id: 'oauth-1',
    text: 'Meta OAuth Consent Screen',
    subtitle: 'The following permissions are requested:',
  },
  {
    id: 'oauth-2',
    text: 'ads_read — Read campaign performance data',
    subtitle: 'ROAS, spend, conversions, and CTR metrics',
  },
  {
    id: 'oauth-3',
    text: 'ads_management — Create and manage campaigns',
    subtitle: 'Campaign creation, editing, and status management',
  },
  {
    id: 'oauth-4',
    text: 'User approves permissions',
    subtitle: 'Both ads_read and ads_management granted',
  },
  {
    id: 'oauth-5',
    text: 'Meta account successfully connected',
    subtitle: 'User redirected to Batwo dashboard',
  },

  // Scene 3: ads_read Demonstration (0:50-1:50)
  {
    id: 'ads-read-header',
    text: 'Permission: ads_read — Campaign Performance Dashboard',
    subtitle: 'API: GET /act_{ad-account-id}/insights',
  },
  {
    id: 'ads-read-1',
    text: '[1] User navigates to KPI Dashboard',
    subtitle: 'Sidebar navigation to performance metrics',
  },
  {
    id: 'ads-read-2',
    text: 'Campaign data from ads_read permission',
    subtitle: 'ROAS, Total Spend, Conversions, CTR',
  },
  {
    id: 'ads-read-3',
    text: '[2] 30-day performance trend',
    subtitle: 'Spend and ROAS trend charts',
  },
  {
    id: 'ads-read-4',
    text: '[3] AI-driven campaign insights',
    subtitle: 'Data-driven optimization recommendations',
  },
  {
    id: 'ads-read-5',
    text: '[4] User changes date range',
    subtitle: 'Filtering performance data by time period',
  },
  {
    id: 'ads-read-6',
    text: '[5] User drills into campaign performance',
    subtitle: 'Individual campaign metrics and details',
  },
  {
    id: 'ads-read-done',
    text: '✓ ads_read permission demonstrated successfully',
    subtitle: 'All ads_read features shown end-to-end',
  },

  // Scene 4: ads_management Demonstration (1:50-3:00)
  {
    id: 'ads-mgmt-header',
    text: 'Permission: ads_management — Create and Manage Campaigns',
    subtitle: 'API: POST /act_{ad-account-id}/campaigns',
  },
  {
    id: 'ads-mgmt-1',
    text: '[1] User clicks Create Campaign',
    subtitle: 'Starting campaign creation flow',
  },
  {
    id: 'ads-mgmt-2',
    text: '[2] User enters campaign name',
    subtitle: 'Campaign: Spring Sale 2026',
  },
  {
    id: 'ads-mgmt-3',
    text: '[3] User selects campaign objective',
    subtitle: 'Objective: Conversions',
  },
  {
    id: 'ads-mgmt-4',
    text: '[4] User sets daily budget',
    subtitle: 'Budget: ₩50,000',
  },
  {
    id: 'ads-mgmt-5',
    text: '[5] User submits campaign to Meta',
    subtitle: 'Campaign creation via ads_management permission',
  },
  {
    id: 'ads-mgmt-6',
    text: 'Campaign created successfully',
    subtitle: 'New campaign appears in the campaign list',
  },
  {
    id: 'ads-mgmt-7',
    text: '[6] User pauses an existing campaign',
    subtitle: 'Campaign status: ACTIVE → PAUSED',
  },
  {
    id: 'ads-mgmt-8',
    text: '[7] User resumes the paused campaign',
    subtitle: 'Campaign status: PAUSED → ACTIVE',
  },
  {
    id: 'ads-mgmt-done',
    text: '✓ ads_management permission demonstrated successfully',
    subtitle: 'All ads_management features shown end-to-end',
  },

  // Scene 5: Summary (3:00-3:20)
  {
    id: 'summary-1',
    text: 'Ads Management Standard Access — Demonstrated',
    subtitle: 'Both permissions actively used in this application',
  },
  {
    id: 'summary-2',
    text: '1. ads_read — Campaign performance dashboard [✓]',
    subtitle: '2. ads_management — Create and manage campaigns [✓]',
  },
]

// 캡션 세트 매핑
const captionSets: Record<string, Caption[]> = {
  default: defaultCaptionSequence,
  'ads-standard-access': adsStandardAccessCaptions,
}

export function CaptionOverlay() {
  const searchParams = useSearchParams()
  const hideCaption = searchParams.get('hideCaption') === 'true'
  const captionMode = searchParams.get('captionMode') || 'default'

  const captions = useMemo(
    () => captionSets[captionMode] || defaultCaptionSequence,
    [captionMode]
  )

  // sessionStorage로 캡션 인덱스 유지 (페이지 이동 시에도 유지)
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`demo-caption-index-${captionMode}`)
      return saved ? Math.min(parseInt(saved, 10), captions.length - 1) : 0
    }
    return 0
  })
  const [isVisible, setIsVisible] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)

  // sessionStorage에 인덱스 저장
  useEffect(() => {
    sessionStorage.setItem(`demo-caption-index-${captionMode}`, String(currentIndex))
  }, [currentIndex, captionMode])

  // Playwright에서 직접 인덱스 설정 가능하도록 글로벌 함수 노출
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__setCaptionIndex = (index: number) => {
      setCurrentIndex(Math.min(Math.max(0, index), captions.length - 1))
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__getCaptionIndex = () => currentIndex
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).__setCaptionIndex
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).__getCaptionIndex
    }
  }, [captions.length, currentIndex])

  const currentCaption = captions[currentIndex]

  const nextCaption = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, captions.length - 1))
  }, [captions.length])

  const prevCaption = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  const toggleVisibility = useCallback(() => {
    setIsVisible((prev) => !prev)
  }, [])

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + 방향키로 캡션 전환
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          nextCaption()
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          prevCaption()
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          toggleVisibility()
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          setIsMinimized((prev) => !prev)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextCaption, prevCaption, toggleVisibility])

  if (hideCaption) {
    return null
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999]">
        <button
          type="button"
          onClick={toggleVisibility}
          className="rounded-full bg-black/80 px-4 py-2 text-sm text-white shadow-lg hover:bg-black/90"
        >
          Show Captions (Ctrl+↑)
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] pointer-events-none">
      {/* 캡션 영역 */}
      <div className="flex justify-center pb-6">
        <div
          className={cn(
            'pointer-events-auto rounded-lg bg-black/85 backdrop-blur-sm shadow-2xl transition-all duration-300',
            isMinimized ? 'px-4 py-2' : 'px-8 py-4 max-w-4xl'
          )}
        >
          {isMinimized ? (
            <div className="flex items-center gap-4 text-white">
              <span className="text-sm opacity-70">
                {currentIndex + 1}/{captions.length}
              </span>
              <span className="text-sm truncate max-w-xs">{currentCaption.text}</span>
              <button
                type="button"
                onClick={() => setIsMinimized(false)}
                className="text-xs opacity-70 hover:opacity-100"
              >
                Expand
              </button>
            </div>
          ) : (
            <>
              {/* 메인 캡션 */}
              <p className="text-center text-xl font-semibold text-white leading-relaxed">
                {currentCaption.text}
              </p>

              {/* 서브 캡션 */}
              {currentCaption.subtitle && (
                <p className="mt-2 text-center text-base text-white/80">
                  {currentCaption.subtitle}
                </p>
              )}

              {/* 컨트롤 */}
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={prevCaption}
                  disabled={currentIndex === 0}
                  className="rounded-full bg-white/20 px-3 py-1 text-sm text-white hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>

                <span className="text-sm text-white/60">
                  {currentIndex + 1} / {captions.length}
                </span>

                <button
                  type="button"
                  onClick={nextCaption}
                  disabled={currentIndex === captions.length - 1}
                  className="rounded-full bg-white/20 px-3 py-1 text-sm text-white hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next →
                </button>

                <div className="ml-4 border-l border-white/20 pl-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/20"
                  >
                    Minimize
                  </button>
                  <button
                    type="button"
                    onClick={toggleVisibility}
                    className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/20"
                  >
                    Hide
                  </button>
                </div>
              </div>

              {/* 단축키 힌트 */}
              <p className="mt-3 text-center text-xs text-white/40">
                Shortcuts: Ctrl+← Prev | Ctrl+→ Next | Ctrl+↑ Hide | Ctrl+↓ Minimize
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
