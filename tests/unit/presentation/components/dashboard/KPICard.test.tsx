import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { KPICard } from '@/presentation/components/dashboard/KPICard'

describe('KPICard', () => {
  const defaultProps = {
    title: 'ROAS',
    value: 3.5,
    unit: 'x',
    change: 12.5,
    changeType: 'increase' as const,
  }

  describe('rendering', () => {
    it('should render title correctly', () => {
      render(<KPICard {...defaultProps} />)
      expect(screen.getByText('ROAS')).toBeInTheDocument()
    })

    it('should render value with unit', () => {
      render(<KPICard {...defaultProps} />)
      expect(screen.getByText('3.5x')).toBeInTheDocument()
    })

    it('should render percentage change', () => {
      render(<KPICard {...defaultProps} />)
      expect(screen.getByText('+12.50%')).toBeInTheDocument()
    })

    it('should render currency value correctly', () => {
      render(
        <KPICard
          title="총 지출"
          value={1500000}
          unit="원"
          format="currency"
          change={-5.2}
          changeType="decrease"
        />
      )
      expect(screen.getByText('1,500,000원')).toBeInTheDocument()
    })

    it('should render percentage value correctly', () => {
      render(
        <KPICard
          title="CTR"
          value={2.35}
          unit="%"
          format="percentage"
          change={0.5}
          changeType="increase"
        />
      )
      // formatValue uses toFixed(1), so 2.35 becomes "2.4%"
      expect(screen.getByText('2.4%')).toBeInTheDocument()
    })
  })

  describe('change indicator', () => {
    it('should show green color for positive change', () => {
      render(<KPICard {...defaultProps} change={10} changeType="increase" />)
      const changeElement = screen.getByText('+10.00%').closest('div')
      expect(changeElement).toHaveClass('text-green-700')
    })

    it('should show red color for negative change', () => {
      render(<KPICard {...defaultProps} change={-10} changeType="decrease" />)
      const changeElement = screen.getByText('-10.00%').closest('div')
      expect(changeElement).toHaveClass('text-red-700')
    })

    it('should show neutral color for no change', () => {
      render(<KPICard {...defaultProps} change={0} changeType="neutral" />)
      const changeElement = screen.getByText('0%').closest('div')
      expect(changeElement).toHaveClass('text-gray-600')
    })
  })

  describe('loading state', () => {
    it('should show skeleton when loading', () => {
      render(<KPICard {...defaultProps} isLoading />)
      expect(screen.getByTestId('kpi-skeleton')).toBeInTheDocument()
    })

    it('should not show value when loading', () => {
      render(<KPICard {...defaultProps} isLoading />)
      expect(screen.queryByText('3.5x')).not.toBeInTheDocument()
    })
  })

  describe('icon', () => {
    it('should render icon when provided', () => {
      render(<KPICard {...defaultProps} icon="chart" />)
      expect(screen.getByTestId('kpi-icon')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have accessible label', () => {
      render(<KPICard {...defaultProps} />)
      expect(screen.getByRole('article')).toHaveAttribute(
        'aria-label',
        'ROAS: 3.5x'
      )
    })
  })
})
