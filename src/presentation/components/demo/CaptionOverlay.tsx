'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface Caption {
  id: string
  text: string
  subtitle?: string
}

// Meta App Review 촬영용 캡션 시퀀스
const captionSequence: Caption[] = [
  // 인트로
  { id: 'intro', text: 'Batwo - AI Marketing Solution for E-commerce Advertisers', subtitle: 'Optimize Meta ad campaigns with real-time data and AI insights' },

  // 로그인
  { id: 'login-1', text: 'Step 1: User Authentication', subtitle: 'Users can sign in with Google, Kakao, or Meta accounts' },
  { id: 'login-2', text: 'Click "Continue with Meta" to start OAuth flow', subtitle: 'This initiates the permission request process' },

  // OAuth 권한
  { id: 'oauth-1', text: 'Step 2: User Grants Permissions', subtitle: 'The following permissions are requested:' },
  { id: 'oauth-2', text: 'ads_read - View ad campaign performance metrics', subtitle: 'Access ROAS, CTR, conversions, and spend data' },
  { id: 'oauth-3', text: 'ads_management - AI-powered campaign optimization', subtitle: 'Enable personalized optimization recommendations' },
  { id: 'oauth-4', text: 'business_management - Multi-account management', subtitle: 'Manage multiple ad accounts from one dashboard' },
  { id: 'oauth-5', text: 'pages_show_list & pages_read_engagement', subtitle: 'Analyze Facebook and Instagram page engagement' },
  { id: 'oauth-6', text: 'User clicks "Continue" to grant access', subtitle: 'Permissions are now authorized' },

  // 온보딩
  { id: 'onboard-1', text: 'Step 3: Onboarding - Permission Explanation', subtitle: 'App explains why each permission is needed' },
  { id: 'onboard-2', text: 'Why connect your Meta account?', subtitle: 'Clear explanation of data usage and benefits' },

  // Use Case 1: ads_read
  { id: 'use1-1', text: 'Use Case 1: Real-time Ad Performance Monitoring', subtitle: 'Using ads_read permission' },
  { id: 'use1-2', text: 'Dashboard displays real-time KPIs from Meta Ads', subtitle: 'ROAS, CTR, Conversions, Total Spend' },
  { id: 'use1-3', text: 'Interactive charts show performance trends', subtitle: 'Spend Trend and ROAS Trend over time' },

  // Use Case 2: ads_management
  { id: 'use2-1', text: 'Use Case 2: AI-Powered Optimization', subtitle: 'Using ads_management permission' },
  { id: 'use2-2', text: 'AI Insight: ROAS Improvement Opportunity', subtitle: 'Weekend budget increase could raise ROAS by 0.3x' },
  { id: 'use2-3', text: 'AI Insight: Budget Depletion Warning', subtitle: 'Daily budget will be depleted by 3 PM' },
  { id: 'use2-4', text: 'AI Insight: Targeting Optimization', subtitle: 'Women 25-34 have 2.1x higher conversion rate' },
  { id: 'use2-5', text: 'Users can take immediate action', subtitle: 'Click to adjust budget or targeting based on AI recommendations' },

  // Use Case 3: business_management
  { id: 'use3-1', text: 'Use Case 3: Campaign Management', subtitle: 'Using business_management permission' },
  { id: 'use3-2', text: 'View all campaigns with status and performance', subtitle: 'Filter by Active, Paused, Completed, Draft' },

  // 엔딩
  { id: 'end-1', text: 'Summary: Batwo provides advertisers with:', subtitle: '✓ Real-time monitoring ✓ AI optimization ✓ Unified management' },
  { id: 'end-2', text: 'All features require the requested Meta permissions', subtitle: 'Thank you for reviewing our application' },
]

export function CaptionOverlay() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)

  const currentCaption = captionSequence[currentIndex]

  const nextCaption = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, captionSequence.length - 1))
  }, [])

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

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999]">
        <button
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
              <span className="text-sm opacity-70">{currentIndex + 1}/{captionSequence.length}</span>
              <span className="text-sm truncate max-w-xs">{currentCaption.text}</span>
              <button
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
                  onClick={prevCaption}
                  disabled={currentIndex === 0}
                  className="rounded-full bg-white/20 px-3 py-1 text-sm text-white hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>

                <span className="text-sm text-white/60">
                  {currentIndex + 1} / {captionSequence.length}
                </span>

                <button
                  onClick={nextCaption}
                  disabled={currentIndex === captionSequence.length - 1}
                  className="rounded-full bg-white/20 px-3 py-1 text-sm text-white hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next →
                </button>

                <div className="ml-4 border-l border-white/20 pl-4 flex gap-2">
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/20"
                  >
                    Minimize
                  </button>
                  <button
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
