/**
 * 🔴 RED Phase: Legal Pages Tests
 *
 * These tests verify that legal pages (terms, privacy) render correctly
 * with Korean text and proper structure.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TermsPage from '@/app/(legal)/terms/page'
import PrivacyPage from '@/app/(legal)/privacy/page'

describe('Legal Pages', () => {
  describe('TermsPage (이용약관)', () => {
    it('should render terms page with Korean title', () => {
      render(<TermsPage />)

      expect(screen.getByRole('heading', { name: /이용약관/i })).toBeInTheDocument()
    })

    it('should display service terms sections', () => {
      render(<TermsPage />)

      // Check for specific section heading
      expect(screen.getByRole('heading', { name: /제3조 \(서비스 이용\)/i })).toBeInTheDocument()
    })

    it('should display last updated date', () => {
      render(<TermsPage />)

      expect(screen.getByText(/최종 수정일/i)).toBeInTheDocument()
    })

    it('should have company information', () => {
      render(<TermsPage />)

      // Check for company name in content
      expect(screen.getByRole('heading', { name: /제1조 \(목적\)/i })).toBeInTheDocument()
    })

    it('should have contact email', () => {
      render(<TermsPage />)

      const emailLink = screen.getByRole('link', { name: /support@batwo.ai/i })
      expect(emailLink).toBeInTheDocument()
      expect(emailLink).toHaveAttribute('href', 'mailto:support@batwo.ai')
    })
  })

  describe('PrivacyPage (개인정보처리방침)', () => {
    it('should render privacy page with Korean title', () => {
      render(<PrivacyPage />)

      expect(
        screen.getByRole('heading', { name: /개인정보처리방침/i, level: 1 })
      ).toBeInTheDocument()
    })

    it('should display data collection section', () => {
      render(<PrivacyPage />)

      expect(screen.getByRole('heading', { name: /수집하는 개인정보/i })).toBeInTheDocument()
    })

    it('should display data usage section', () => {
      render(<PrivacyPage />)

      expect(screen.getByRole('heading', { name: /개인정보의 이용/i })).toBeInTheDocument()
    })

    it('should display data retention section', () => {
      render(<PrivacyPage />)

      expect(screen.getByRole('heading', { name: /보관 기간/i })).toBeInTheDocument()
    })

    it('should mention third-party services', () => {
      render(<PrivacyPage />)

      // Meta Ads API and OpenAI are used
      expect(screen.getByRole('heading', { name: /제3자 제공/i })).toBeInTheDocument()
    })

    it('should display last updated date', () => {
      render(<PrivacyPage />)

      expect(screen.getByText(/최종 수정일/i)).toBeInTheDocument()
    })

    it('should have contact email', () => {
      render(<PrivacyPage />)

      // There are multiple mentions of email, get the link in footer
      const emailLinks = screen.getAllByRole('link', { name: /support@batwo.ai/i })
      expect(emailLinks.length).toBeGreaterThan(0)
      expect(emailLinks[0]).toHaveAttribute('href', 'mailto:support@batwo.ai')
    })

    it('should have Meta and OpenAI mentioned', () => {
      render(<PrivacyPage />)

      expect(screen.getByText(/Meta Ads API/i)).toBeInTheDocument()
      expect(screen.getByText(/OpenAI API/i)).toBeInTheDocument()
    })
  })
})
