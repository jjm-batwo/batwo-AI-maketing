/**
 * 🔴 RED Phase: Error Pages Tests
 *
 * These tests verify that error pages render correctly with Korean text.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NotFoundPage from '@/app/not-found'
import ErrorPage from '@/app/error'
import GlobalErrorPage from '@/app/global-error'

describe('Error Pages', () => {
  describe('NotFoundPage (404)', () => {
    it('should render 404 page with Korean text', () => {
      render(<NotFoundPage />)

      expect(screen.getByText(/페이지를 찾을 수 없습니다/i)).toBeInTheDocument()
    })

    it('should display 404 error code', () => {
      render(<NotFoundPage />)

      expect(screen.getByText('404')).toBeInTheDocument()
    })

    it('should have a link to go back home', () => {
      render(<NotFoundPage />)

      const homeLink = screen.getByRole('link', { name: /홈으로/i })
      expect(homeLink).toBeInTheDocument()
      expect(homeLink).toHaveAttribute('href', '/')
    })

    it('should display helpful message', () => {
      render(<NotFoundPage />)

      expect(
        screen.getByText(/요청하신 페이지가 존재하지 않거나 이동되었습니다/i)
      ).toBeInTheDocument()
    })
  })

  describe('ErrorPage (Error Boundary)', () => {
    const mockError = new Error('Test error message')
    const mockReset = vi.fn()

    beforeEach(() => {
      mockReset.mockClear()
    })

    it('should render error page with Korean text', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />)

      expect(screen.getByText(/문제가 발생했습니다/i)).toBeInTheDocument()
    })

    it('should display error message in development', () => {
      // In test environment, NODE_ENV is 'test' which we treat like development
      render(<ErrorPage error={mockError} reset={mockReset} />)

      // Error details should be visible in dev/test mode
      expect(screen.getByText(/Test error message/i)).toBeInTheDocument()
    })

    it('should have a retry button', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />)

      const retryButton = screen.getByRole('button', { name: /다시 시도/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('should call reset function when retry button is clicked', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />)

      const retryButton = screen.getByRole('button', { name: /다시 시도/i })
      fireEvent.click(retryButton)

      expect(mockReset).toHaveBeenCalledTimes(1)
    })

    it('should have a link to go back home', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />)

      const homeLink = screen.getByRole('link', { name: /홈으로/i })
      expect(homeLink).toBeInTheDocument()
      expect(homeLink).toHaveAttribute('href', '/')
    })
  })

  describe('GlobalErrorPage', () => {
    const mockError = new Error('Critical error')
    const mockReset = vi.fn()
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      mockReset.mockClear()
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
        const [firstArg] = args
        if (typeof firstArg === 'string' && firstArg.startsWith('Global error:')) {
          return
        }
      })
    })

    afterEach(() => {
      consoleErrorSpy.mockRestore()
    })

    it('should render global error page content', () => {
      // GlobalError renders html/body but RTL wraps in container
      // We test that the component renders correctly
      const { container } = render(<GlobalErrorPage error={mockError} reset={mockReset} />)

      // Check the rendered structure includes main content
      expect(container.querySelector('main')).toBeInTheDocument()
    })

    it('should have Korean error message', () => {
      render(<GlobalErrorPage error={mockError} reset={mockReset} />)

      expect(screen.getByText(/심각한 오류가 발생했습니다/i)).toBeInTheDocument()
    })

    it('should have a retry button', () => {
      render(<GlobalErrorPage error={mockError} reset={mockReset} />)

      const retryButton = screen.getByRole('button', { name: /다시 시도/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('should call reset when retry is clicked', () => {
      render(<GlobalErrorPage error={mockError} reset={mockReset} />)

      const retryButton = screen.getByRole('button', { name: /다시 시도/i })
      fireEvent.click(retryButton)

      expect(mockReset).toHaveBeenCalledTimes(1)
    })

    it('should display error digest when available', () => {
      const errorWithDigest = Object.assign(new Error('Critical error'), {
        digest: 'error-123',
      })

      render(<GlobalErrorPage error={errorWithDigest} reset={mockReset} />)

      expect(screen.getByText(/error-123/i)).toBeInTheDocument()
    })
  })
})
