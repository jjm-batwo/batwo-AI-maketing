import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AllocationTable } from '@/presentation/components/portfolio/AllocationTable'
import type { CampaignAllocation } from '@/presentation/hooks/usePortfolio'

const mockAllocations: CampaignAllocation[] = [
  {
    campaignId: 'camp-1',
    campaignName: '여름 프로모션',
    objective: 'CONVERSIONS',
    currentBudget: 500000,
    recommendedBudget: 600000,
    changePercent: 20,
    metrics: { roas: 3.5, cpa: 12000, marginalROAS: 2.8 },
    reasoning: '높은 전환율로 예산 증가 권장',
  },
  {
    campaignId: 'camp-2',
    campaignName: '브랜드 인지도',
    objective: 'BRAND_AWARENESS',
    currentBudget: 300000,
    recommendedBudget: 250000,
    changePercent: -16.7,
    metrics: { roas: 1.2, cpa: 25000, marginalROAS: 0.9 },
    reasoning: '낮은 ROAS로 예산 축소 권장',
  },
]

describe('AllocationTable', () => {
  describe('rendering', () => {
    it('should render campaign names', () => {
      render(<AllocationTable allocations={mockAllocations} />)
      expect(screen.getByText('여름 프로모션')).toBeInTheDocument()
      expect(screen.getByText('브랜드 인지도')).toBeInTheDocument()
    })

    it('should render current budget with KRW format', () => {
      render(<AllocationTable allocations={mockAllocations} />)
      expect(screen.getByText('500,000원')).toBeInTheDocument()
      expect(screen.getByText('300,000원')).toBeInTheDocument()
    })

    it('should render recommended budget with KRW format', () => {
      render(<AllocationTable allocations={mockAllocations} />)
      expect(screen.getByText('600,000원')).toBeInTheDocument()
      expect(screen.getByText('250,000원')).toBeInTheDocument()
    })

    it('should render positive change percent with + sign', () => {
      render(<AllocationTable allocations={mockAllocations} />)
      expect(screen.getByText('+20.0%')).toBeInTheDocument()
    })

    it('should render negative change percent', () => {
      render(<AllocationTable allocations={mockAllocations} />)
      expect(screen.getByText('-16.7%')).toBeInTheDocument()
    })

    it('should render marginal ROAS', () => {
      render(<AllocationTable allocations={mockAllocations} />)
      expect(screen.getByText('2.80x')).toBeInTheDocument()
      expect(screen.getByText('0.90x')).toBeInTheDocument()
    })

    it('should render nothing when allocations are empty', () => {
      const { container } = render(<AllocationTable allocations={[]} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('color coding', () => {
    it('should apply green color for positive change', () => {
      render(<AllocationTable allocations={mockAllocations} />)
      const positiveCell = screen.getByText('+20.0%')
      expect(positiveCell).toHaveClass('text-green-600')
    })

    it('should apply red color for negative change', () => {
      render(<AllocationTable allocations={mockAllocations} />)
      const negativeCell = screen.getByText('-16.7%')
      expect(negativeCell).toHaveClass('text-red-600')
    })
  })

  describe('table headers', () => {
    it('should render all column headers', () => {
      render(<AllocationTable allocations={mockAllocations} />)
      expect(screen.getByText('캠페인명')).toBeInTheDocument()
      expect(screen.getByText('현재 예산')).toBeInTheDocument()
      expect(screen.getByText('추천 예산')).toBeInTheDocument()
      expect(screen.getByText('변화율')).toBeInTheDocument()
      expect(screen.getByText('한계 ROAS')).toBeInTheDocument()
    })
  })
})
