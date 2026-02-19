import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CompetitorCard } from '@/presentation/components/competitors/CompetitorCard'

const defaultProps = {
  pageName: '나이키 코리아',
  pageId: 'nike-korea-123',
  adCount: 42,
  dominantFormats: ['video', 'carousel'],
  commonHooks: ['한정 특가', '오늘만 할인'],
  averageAdLifespan: 14,
}

describe('CompetitorCard', () => {
  describe('rendering', () => {
    it('should render page name', () => {
      render(<CompetitorCard {...defaultProps} />)
      expect(screen.getByText('나이키 코리아')).toBeInTheDocument()
    })

    it('should render page id', () => {
      render(<CompetitorCard {...defaultProps} />)
      expect(screen.getByText(/nike-korea-123/)).toBeInTheDocument()
    })

    it('should render ad count', () => {
      render(<CompetitorCard {...defaultProps} />)
      expect(screen.getByText(/42/)).toBeInTheDocument()
    })

    it('should render average ad lifespan', () => {
      render(<CompetitorCard {...defaultProps} />)
      expect(screen.getByText(/14/)).toBeInTheDocument()
    })
  })

  describe('dominant formats', () => {
    it('should render all dominant format badges', () => {
      render(<CompetitorCard {...defaultProps} />)
      // 포맷 레이블(한국어) 또는 원본값 렌더링
      expect(screen.getByText(/동영상|video/i)).toBeInTheDocument()
      expect(screen.getByText(/캐러셀|carousel/i)).toBeInTheDocument()
    })

    it('should render empty formats gracefully', () => {
      render(<CompetitorCard {...defaultProps} dominantFormats={[]} />)
      expect(screen.getByText('나이키 코리아')).toBeInTheDocument()
    })
  })

  describe('common hooks', () => {
    it('should render all common hook badges', () => {
      render(<CompetitorCard {...defaultProps} />)
      expect(screen.getByText('한정 특가')).toBeInTheDocument()
      expect(screen.getByText('오늘만 할인')).toBeInTheDocument()
    })

    it('should render empty hooks gracefully', () => {
      render(<CompetitorCard {...defaultProps} commonHooks={[]} />)
      expect(screen.getByText('나이키 코리아')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle zero ad count', () => {
      render(<CompetitorCard {...defaultProps} adCount={0} />)
      expect(screen.getByText(/0/)).toBeInTheDocument()
    })

    it('should handle single format and hook', () => {
      render(
        <CompetitorCard
          {...defaultProps}
          dominantFormats={['video']}
          commonHooks={['특가']}
        />
      )
      expect(screen.getByText(/동영상|video/i)).toBeInTheDocument()
      expect(screen.getByText('특가')).toBeInTheDocument()
    })
  })
})
