import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecommendationList } from '@/presentation/components/competitors/RecommendationList'

describe('RecommendationList', () => {
  describe('rendering', () => {
    it('should render all recommendations', () => {
      const recommendations = ['동영상 광고를 늘리세요', '후크 문구를 강화하세요', '주말 예산을 늘리세요']
      render(<RecommendationList recommendations={recommendations} />)
      expect(screen.getByText('동영상 광고를 늘리세요')).toBeInTheDocument()
      expect(screen.getByText('후크 문구를 강화하세요')).toBeInTheDocument()
      expect(screen.getByText('주말 예산을 늘리세요')).toBeInTheDocument()
    })

    it('should render numbered list items', () => {
      const recommendations = ['추천 1', '추천 2', '추천 3']
      render(<RecommendationList recommendations={recommendations} />)
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should render nothing when recommendations are empty', () => {
      const { container } = render(<RecommendationList recommendations={[]} />)
      expect(container.firstChild).toBeNull()
    })

    it('should render single recommendation', () => {
      render(<RecommendationList recommendations={['단일 추천사항']} />)
      expect(screen.getByText('단일 추천사항')).toBeInTheDocument()
    })
  })

  describe('title', () => {
    it('should render title when recommendations exist', () => {
      render(<RecommendationList recommendations={['추천사항 내용']} />)
      expect(screen.getByText('AI 추천 전략')).toBeInTheDocument()
    })
  })
})
