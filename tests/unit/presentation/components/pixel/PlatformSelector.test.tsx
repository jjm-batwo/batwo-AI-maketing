import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlatformSelector } from '@presentation/components/pixel/PlatformSelector'
import { EcommercePlatform } from '@domain/entities/PlatformIntegration'

describe('PlatformSelector', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('렌더링', () => {
    it('should_render_three_platform_cards', () => {
      render(<PlatformSelector onSelect={mockOnSelect} />)

      expect(screen.getByText('카페24')).toBeInTheDocument()
      expect(screen.getByText('자체몰 (커스텀)')).toBeInTheDocument()
      expect(screen.getByText('네이버 스마트스토어')).toBeInTheDocument()
    })

    it('should_render_auto_badge_for_cafe24', () => {
      render(<PlatformSelector onSelect={mockOnSelect} />)

      expect(screen.getByText('자동 설치')).toBeInTheDocument()
    })

    it('should_render_manual_badge_for_custom_site', () => {
      render(<PlatformSelector onSelect={mockOnSelect} />)

      // 자체몰과 네이버 모두 수동 배지 → 2개
      const manualBadges = screen.getAllByText('수동 설치')
      expect(manualBadges.length).toBeGreaterThanOrEqual(1)
    })

    it('should_render_description_for_each_platform', () => {
      render(<PlatformSelector onSelect={mockOnSelect} />)

      expect(
        screen.getByText(/카페24 쇼핑몰에 픽셀을 자동으로 설치/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/직접 운영하는 웹사이트에 스크립트를 수동으로 설치/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/네이버 스마트스토어에 픽셀 설치/i)
      ).toBeInTheDocument()
    })
  })

  describe('선택 동작', () => {
    it('should_call_onSelect_with_CAFE24_when_cafe24_card_clicked', () => {
      render(<PlatformSelector onSelect={mockOnSelect} />)

      fireEvent.click(screen.getByText('카페24').closest('button')!)

      expect(mockOnSelect).toHaveBeenCalledWith(EcommercePlatform.CAFE24)
    })

    it('should_call_onSelect_with_CUSTOM_when_custom_card_clicked', () => {
      render(<PlatformSelector onSelect={mockOnSelect} />)

      fireEvent.click(screen.getByText('자체몰 (커스텀)').closest('button')!)

      expect(mockOnSelect).toHaveBeenCalledWith(EcommercePlatform.CUSTOM)
    })

    it('should_call_onSelect_with_NAVER_when_naver_card_clicked', () => {
      render(<PlatformSelector onSelect={mockOnSelect} />)

      fireEvent.click(screen.getByText('네이버 스마트스토어').closest('button')!)

      expect(mockOnSelect).toHaveBeenCalledWith(EcommercePlatform.NAVER_SMARTSTORE)
    })

    it('should_highlight_selected_platform_card', () => {
      render(
        <PlatformSelector
          onSelect={mockOnSelect}
          selectedPlatform={EcommercePlatform.CUSTOM}
        />
      )

      const customButton = screen.getByText('자체몰 (커스텀)').closest('button')
      expect(customButton).toHaveAttribute('data-selected', 'true')
    })

    it('should_not_highlight_unselected_cards', () => {
      render(
        <PlatformSelector
          onSelect={mockOnSelect}
          selectedPlatform={EcommercePlatform.CUSTOM}
        />
      )

      const cafe24Button = screen.getByText('카페24').closest('button')
      expect(cafe24Button).toHaveAttribute('data-selected', 'false')
    })
  })

  describe('접근성', () => {
    it('should_be_keyboard_navigable_with_enter_key', () => {
      render(<PlatformSelector onSelect={mockOnSelect} />)

      const cafe24Button = screen.getByText('카페24').closest('button')!
      cafe24Button.focus()
      fireEvent.keyDown(cafe24Button, { key: 'Enter' })

      expect(mockOnSelect).toHaveBeenCalledWith(EcommercePlatform.CAFE24)
    })

    it('should_have_role_list_for_platform_cards', () => {
      render(<PlatformSelector onSelect={mockOnSelect} />)

      expect(screen.getByRole('list', { name: /플랫폼 선택/i })).toBeInTheDocument()
    })
  })
})
