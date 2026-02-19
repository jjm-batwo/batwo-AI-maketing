import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CTASection } from '@/presentation/components/landing/CTASection'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('CTASection 전환율 개선', () => {
  describe('CTA 문구 개선 (HeroSection 일관성)', () => {
    it('Primary CTA에 "14일 무료 체험 시작하기" 문구가 표시된다', () => {
      render(<CTASection />)

      const ctaButton = screen.getByRole('link', { name: /14일 무료 체험 시작하기/i })
      expect(ctaButton).toBeInTheDocument()
      expect(ctaButton).toHaveAttribute('href', '/register')
    })

    it('로그인 버튼 대신 단일 CTA로 통합되었다', () => {
      render(<CTASection />)

      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(1)
      expect(links[0]).toHaveAttribute('href', '/register')
    })
  })

  describe('신뢰 신호 추가', () => {
    it('신뢰 신호 컨테이너가 존재한다', () => {
      render(<CTASection />)

      const trustContainer = screen.getByTestId('cta-trust-indicators')
      expect(trustContainer).toBeInTheDocument()
    })

    it('신용카드 관련 신뢰 신호가 표시된다', () => {
      render(<CTASection />)

      expect(screen.getByText(/신용카드 불필요/i)).toBeInTheDocument()
    })

    it('설정 시간 신뢰 신호가 표시된다', () => {
      render(<CTASection />)

      expect(screen.getByText(/5분 설정/i)).toBeInTheDocument()
    })

    it('취소 관련 신뢰 신호가 표시된다', () => {
      render(<CTASection />)

      expect(screen.getByText(/언제든 취소/i)).toBeInTheDocument()
    })
  })

  describe('접근성', () => {
    it('메인 헤드라인이 h2 태그로 렌더링된다', () => {
      render(<CTASection />)

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent(/AI 마케팅/)
    })

    it('CTA 버튼에 키보드로 접근할 수 있다', () => {
      render(<CTASection />)

      const ctaLink = screen.getByRole('link', { name: /14일 무료 체험 시작하기/i })
      expect(ctaLink).toBeVisible()
    })
  })

  describe('기존 기능 유지', () => {
    it('메인 헤드라인이 표시된다', () => {
      render(<CTASection />)

      expect(screen.getByText(/지금 바로 AI 마케팅을 시작하세요/i)).toBeInTheDocument()
    })

    it('서브 헤드라인이 표시된다', () => {
      render(<CTASection />)

      expect(screen.getByText(/마케팅 전문가가 아니어도 괜찮습니다/i)).toBeInTheDocument()
    })

    it('바투 브랜드 메시지가 표시된다', () => {
      render(<CTASection />)

      expect(screen.getByText(/바투가 당신의 광고를 성공으로 이끕니다/i)).toBeInTheDocument()
    })
  })
})
