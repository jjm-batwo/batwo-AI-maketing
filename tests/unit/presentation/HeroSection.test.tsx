import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroSection } from '@/presentation/components/landing/HeroSection'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock intersection observer hook
vi.mock('@/presentation/hooks', () => ({
  useIntersectionObserver: () => ({
    ref: { current: null },
    isIntersecting: true,
  }),
}))

describe('HeroSection 전환율 개선', () => {
  describe('CTA 문구 개선', () => {
    it('Primary CTA에 "14일 무료 체험 시작하기" 문구가 표시된다', () => {
      render(<HeroSection />)

      const ctaButton = screen.getByRole('link', { name: /14일 무료 체험 시작하기/i })
      expect(ctaButton).toBeInTheDocument()
      expect(ctaButton).toHaveAttribute('href', '/register')
    })

    it('Secondary CTA "작동 방식 보기"가 유지된다', () => {
      render(<HeroSection />)

      const secondaryCta = screen.getByRole('link', { name: /작동 방식 보기/i })
      expect(secondaryCta).toBeInTheDocument()
      expect(secondaryCta).toHaveAttribute('href', '#how-it-works')
    })
  })

  describe('사용자 수 Badge (사회적 증거)', () => {
    it('"1,000+ 마케터가 사용 중" 텍스트가 표시된다', () => {
      render(<HeroSection />)

      expect(screen.getByText(/1,000\+ 마케터가 사용 중/i)).toBeInTheDocument()
    })

    it('아바타 placeholder가 장식용으로 숨겨져 있다 (aria-hidden)', () => {
      render(<HeroSection />)

      const avatarContainer = screen.getByTestId('social-proof-avatars')
      expect(avatarContainer).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('신뢰 신호 아이콘', () => {
    it('신뢰 신호 컨테이너가 존재한다', () => {
      render(<HeroSection />)

      const trustContainer = screen.getByTestId('trust-indicators')
      expect(trustContainer).toBeInTheDocument()
    })

    it('신용카드 관련 신뢰 신호가 표시된다', () => {
      render(<HeroSection />)

      expect(screen.getByText(/신용카드/i)).toBeInTheDocument()
    })

    it('설정 시간 신뢰 신호가 표시된다', () => {
      render(<HeroSection />)

      expect(screen.getByText(/5분/i)).toBeInTheDocument()
    })

    it('취소 관련 신뢰 신호가 표시된다', () => {
      render(<HeroSection />)

      expect(screen.getByText(/취소/i)).toBeInTheDocument()
    })
  })

  describe('접근성', () => {
    it('메인 헤드라인이 h1 태그로 렌더링된다', () => {
      render(<HeroSection />)

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent(/마케팅 지식 없이도/)
    })

    it('CTA 버튼에 키보드로 접근할 수 있다', () => {
      render(<HeroSection />)

      const ctaLink = screen.getByRole('link', { name: /14일 무료 체험 시작하기/i })
      expect(ctaLink).toBeVisible()
    })
  })

  describe('기존 기능 유지', () => {
    it('Badge "AI 기반 마케팅 자동화"가 표시된다', () => {
      render(<HeroSection />)

      expect(screen.getByText(/AI 기반 마케팅 자동화/i)).toBeInTheDocument()
    })

    it('메인 헤드라인 "Meta 광고 자동화"가 표시된다', () => {
      render(<HeroSection />)

      expect(screen.getByText(/Meta 광고 자동화/i)).toBeInTheDocument()
    })
  })
})
