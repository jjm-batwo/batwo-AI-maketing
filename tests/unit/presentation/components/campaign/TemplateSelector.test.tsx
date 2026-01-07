import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TemplateSelector } from '@presentation/components/campaign/TemplateSelector'
import {
  getAllCampaignTemplates,
  CampaignTemplate,
} from '@domain/value-objects/CampaignTemplate'

describe('TemplateSelector', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render all available templates', () => {
      render(<TemplateSelector onSelect={mockOnSelect} />)

      const templates = getAllCampaignTemplates()
      templates.forEach((template) => {
        expect(screen.getByText(template.name)).toBeInTheDocument()
      })
    })

    it('should display template descriptions', () => {
      render(<TemplateSelector onSelect={mockOnSelect} />)

      const templates = getAllCampaignTemplates()
      templates.forEach((template) => {
        expect(screen.getByText(template.description)).toBeInTheDocument()
      })
    })

    it('should show template icons', () => {
      render(<TemplateSelector onSelect={mockOnSelect} />)

      // Each template should have an icon container
      const templates = getAllCampaignTemplates()
      expect(screen.getAllByRole('button').length).toBe(templates.length)
    })

    it('should display suggested budget for each template', () => {
      render(<TemplateSelector onSelect={mockOnSelect} />)

      // Check for budget displays (in KRW format)
      expect(screen.getAllByText(/₩|원/i).length).toBeGreaterThan(0)
    })
  })

  describe('selection', () => {
    it('should call onSelect with template when clicked', () => {
      render(<TemplateSelector onSelect={mockOnSelect} />)

      const trafficTemplate = screen.getByText('트래픽 늘리기')
      fireEvent.click(trafficTemplate.closest('button')!)

      expect(mockOnSelect).toHaveBeenCalledTimes(1)
      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'traffic',
        })
      )
    })

    it('should highlight selected template', () => {
      const templates = getAllCampaignTemplates()
      const { rerender } = render(
        <TemplateSelector
          onSelect={mockOnSelect}
          selectedTemplateId={templates[0].id}
        />
      )

      // Selected template should have visual indication
      const selectedButton = screen
        .getByText(templates[0].name)
        .closest('button')
      expect(selectedButton).toHaveClass('border-primary')
    })
  })

  describe('categories', () => {
    it('should display template categories', () => {
      render(<TemplateSelector onSelect={mockOnSelect} />)

      // Multiple templates may have same category, use getAllByText
      expect(screen.getAllByText('트래픽').length).toBeGreaterThan(0)
      expect(screen.getAllByText('전환').length).toBeGreaterThan(0)
      expect(screen.getAllByText('인지도').length).toBeGreaterThan(0)
    })
  })

  describe('tips', () => {
    it('should have tips defined for each template', () => {
      const templates = getAllCampaignTemplates()

      // Verify each template has tips
      templates.forEach((template) => {
        expect(template.tips).toBeDefined()
        expect(template.tips.length).toBeGreaterThan(0)
      })
    })
  })

  describe('accessibility', () => {
    it('should have accessible button labels', () => {
      render(<TemplateSelector onSelect={mockOnSelect} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName()
      })
    })

    it('should support keyboard navigation', () => {
      render(<TemplateSelector onSelect={mockOnSelect} />)

      const firstButton = screen.getAllByRole('button')[0]
      firstButton.focus()

      expect(document.activeElement).toBe(firstButton)
    })
  })
})
