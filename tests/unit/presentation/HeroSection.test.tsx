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
    it('Primary CTA에 "14일 무료로 시작하기" 문구가 표시된다', () => {
      render(<HeroSection />)

      const ctaButton = screen.getByRole('link', { name: /14일 무료로 시작하기/i })
      expect(ctaButton).toBeInTheDocument()
      expect(ctaButton).toHaveAttribute('href', '/register')
    })

    it('Secondary CTA "서비스 소개 영상"이 표시된다', () => {
      render(<HeroSection />)

      const secondaryCta = screen.getByRole('link', { name: /서비스 소개 영상/i })
      expect(secondaryCta).toBeInTheDocument()
      expect(secondaryCta).toHaveAttribute('href', '#how-it-works')
    })
  })

  describe('사용자 수 Badge (사회적 증거)', () => {
    it('"1,200+ 마케터가 선택한 솔루션" 텍스트가 표시된다', () => {
      render(<HeroSection />)

      expect(screen.getByText(/1,200\+/i)).toBeInTheDocument()
      expect(screen.getByText(/마케터가 선택한 솔루션/i)).toBeInTheDocument()
    })

    it('별점 4.9/5.0이 표시된다', () => {
      render(<HeroSection />)

      expect(screen.getByText(/4\.9\/5\.0/i)).toBeInTheDocument()
    })
  })

  describe('신뢰 신호 아이콘', () => {
    it('초기 비용 0원 신뢰 신호가 표시된다', () => {
      render(<HeroSection />)

      expect(screen.getByText(/초기 비용 0원/i)).toBeInTheDocument()
    })

    it('5분 간편 설정 신뢰 신호가 표시된다', () => {
      render(<HeroSection />)

      expect(screen.getByText(/5분 간편 설정/i)).toBeInTheDocument()
    })

    it('언제든 해지 가능 신뢰 신호가 표시된다', () => {
      render(<HeroSection />)

      expect(screen.getByText(/언제든 해지 가능/i)).toBeInTheDocument()
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

      const ctaLink = screen.getByRole('link', { name: /14일 무료로 시작하기/i })
      expect(ctaLink).toBeVisible()
    })
  })

  describe('기존 기능 유지', () => {
    it('Badge "AI 기반 마케팅 자동화"가 표시된다', () => {
      render(<HeroSection />)

      expect(screen.getByText(/AI 기반 마케팅 자동화/i)).toBeInTheDocument()
    })

    it('서브 헤드라인이 표시된다', () => {
      render(<HeroSection />)

      expect(screen.getByText(/복잡한 메타, 구글 광고 설정을 AI가/i)).toBeInTheDocument()
    })
  })
})
