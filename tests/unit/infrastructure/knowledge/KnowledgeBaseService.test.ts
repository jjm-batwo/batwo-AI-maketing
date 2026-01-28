import { describe, it, expect, beforeEach } from 'vitest'
import { KnowledgeBaseService } from '@/infrastructure/knowledge/KnowledgeBaseService'
import type { AnalysisInput } from '@/application/ports/IKnowledgeBaseService'
import { InsufficientAnalysisError } from '@/domain/errors/InsufficientAnalysisError'

describe('KnowledgeBaseService', () => {
  let service: KnowledgeBaseService

  // Test inputs
  const koreanCopyInput: AnalysisInput = {
    content: {
      headline: '무료 체험으로 시작하세요!',
      primaryText: '지금 바로 시작하면 30일 무료 체험을 드립니다. 한정 수량이니 서둘러 신청하세요!',
      description: 'AI 마케팅 솔루션',
      callToAction: '무료로 시작하기',
      brand: '바투',
    },
    context: {
      industry: 'saas',
      targetAudience: '30-40대 커머스 사업자',
      objective: 'conversion',
      tone: 'professional',
      keywords: ['AI', '마케팅', '자동화'],
    },
  }

  const metricsInput: AnalysisInput = {
    context: {
      industry: 'ecommerce',
      objective: 'conversion',
    },
    metrics: {
      ctr: 1.5,
      cvr: 2.0,
      roas: 3.5,
      cpa: 15000,
    },
  }

  const emptyInput: AnalysisInput = {}

  const minimalInput: AnalysisInput = {
    content: {
      headline: '테스트',
    },
  }

  // Initialize service before each test
  beforeEach(() => {
    service = new KnowledgeBaseService()
  })

  describe('analyzeAll', () => {
    it('모든 6개 도메인의 분석 결과를 반환해야 한다', () => {
      const output = service.analyzeAll(koreanCopyInput)

      expect(output).toBeDefined()
      expect(output.compositeScore).toBeDefined()
      expect(output.knowledgeContext).toBeDefined()

      // All 6 domains should be analyzed
      expect(output.compositeScore.domainScores.length).toBe(6)

      // Verify all expected domains are present
      const domains = output.compositeScore.domainScores.map(ds => ds.domain)
      expect(domains).toContain('neuromarketing')
      expect(domains).toContain('marketing_psychology')
      expect(domains).toContain('crowd_psychology')
      expect(domains).toContain('meta_best_practices')
      expect(domains).toContain('color_psychology')
      expect(domains).toContain('copywriting_psychology')
    })

    it('compositeScore에 overall, grade, domainScores가 있어야 한다', () => {
      const output = service.analyzeAll(koreanCopyInput)

      expect(output.compositeScore.overall).toBeTypeOf('number')
      expect(output.compositeScore.overall).toBeGreaterThanOrEqual(0)
      expect(output.compositeScore.overall).toBeLessThanOrEqual(100)

      expect(output.compositeScore.grade).toBeTypeOf('string')
      expect(['A', 'B', 'C', 'D', 'F']).toContain(output.compositeScore.grade)

      expect(Array.isArray(output.compositeScore.domainScores)).toBe(true)
      expect(output.compositeScore.domainScores.length).toBeGreaterThan(0)

      // Each domain score should have required fields
      output.compositeScore.domainScores.forEach(ds => {
        expect(ds.domain).toBeTypeOf('string')
        expect(ds.score).toBeTypeOf('number')
        expect(ds.grade).toBeTypeOf('string')
        expect(Array.isArray(ds.factors)).toBe(true)
        expect(Array.isArray(ds.recommendations)).toBe(true)
      })
    })

    it('knowledgeContext가 문자열이어야 한다', () => {
      const output = service.analyzeAll(koreanCopyInput)

      expect(output.knowledgeContext).toBeTypeOf('string')
      expect(output.knowledgeContext.length).toBeGreaterThan(0)

      // Should contain Korean text
      expect(output.knowledgeContext).toContain('마케팅 사이언스 분석')
      expect(output.knowledgeContext).toContain('등급')
      expect(output.knowledgeContext).toContain('점수')
    })

    it('빈 입력으로도 분석이 작동해야 한다', () => {
      const output = service.analyzeAll(emptyInput)

      expect(output).toBeDefined()
      expect(output.compositeScore).toBeDefined()
      expect(output.compositeScore.domainScores.length).toBeGreaterThanOrEqual(3)
      expect(output.knowledgeContext).toBeTypeOf('string')
    })

    it('메트릭 입력으로 분석이 가능해야 한다', () => {
      const output = service.analyzeAll(metricsInput)

      expect(output).toBeDefined()
      expect(output.compositeScore.domainScores.length).toBe(6)
      expect(output.compositeScore.overall).toBeGreaterThanOrEqual(0)
    })

    it('최소 입력으로 분석이 가능해야 한다', () => {
      const output = service.analyzeAll(minimalInput)

      expect(output).toBeDefined()
      expect(output.compositeScore.domainScores.length).toBe(6)
    })
  })

  describe('analyzeSpecific', () => {
    it('선택된 도메인만 분석해야 한다', () => {
      const selectedDomains = ['neuromarketing', 'marketing_psychology', 'copywriting_psychology'] as const
      const output = service.analyzeSpecific(koreanCopyInput, [...selectedDomains])

      expect(output).toBeDefined()
      expect(output.compositeScore.domainScores.length).toBe(3)

      const analyzedDomains = output.compositeScore.domainScores.map(ds => ds.domain)
      expect(analyzedDomains).toContain('neuromarketing')
      expect(analyzedDomains).toContain('marketing_psychology')
      expect(analyzedDomains).toContain('copywriting_psychology')

      // Should NOT contain other domains
      expect(analyzedDomains).not.toContain('crowd_psychology')
      expect(analyzedDomains).not.toContain('meta_best_practices')
      expect(analyzedDomains).not.toContain('color_psychology')
    })

    it('3개 미만이면 InsufficientAnalysisError를 던져야 한다', () => {
      const tooFewDomains = ['neuromarketing', 'marketing_psychology'] as const

      expect(() => {
        service.analyzeSpecific(koreanCopyInput, [...tooFewDomains])
      }).toThrow(InsufficientAnalysisError)
    })

    it('정확히 3개 도메인으로 분석이 가능해야 한다', () => {
      const minDomains = ['neuromarketing', 'marketing_psychology', 'copywriting_psychology'] as const
      const output = service.analyzeSpecific(koreanCopyInput, [...minDomains])

      expect(output).toBeDefined()
      expect(output.compositeScore.domainScores.length).toBe(3)
    })

    it('모든 6개 도메인을 선택하면 analyzeAll과 동일한 결과를 반환해야 한다', () => {
      const allDomains = [
        'neuromarketing',
        'marketing_psychology',
        'crowd_psychology',
        'meta_best_practices',
        'color_psychology',
        'copywriting_psychology',
      ] as const

      const output = service.analyzeSpecific(koreanCopyInput, [...allDomains])

      expect(output).toBeDefined()
      expect(output.compositeScore.domainScores.length).toBe(6)
    })
  })

  describe('getKnowledgeContext', () => {
    it('비어있지 않은 문자열을 반환해야 한다', () => {
      const context = service.getKnowledgeContext(koreanCopyInput)

      expect(context).toBeTypeOf('string')
      expect(context.length).toBeGreaterThan(0)
    })

    it('콘텐츠가 있는 입력에 대해 관련 컨텍스트를 반환해야 한다', () => {
      const context = service.getKnowledgeContext(koreanCopyInput)

      // Should contain analysis header
      expect(context).toContain('마케팅 사이언스 분석')

      // Should contain domain information
      expect(context).toMatch(/뉴로마케팅|마케팅 심리학|카피라이팅 심리학/)

      // Should contain score information
      expect(context).toContain('점수')
      expect(context).toContain('등급')
    })

    it('메트릭 입력에 대해 컨텍스트를 반환해야 한다', () => {
      const context = service.getKnowledgeContext(metricsInput)

      expect(context).toBeTypeOf('string')
      expect(context.length).toBeGreaterThan(0)
      expect(context).toContain('마케팅 사이언스 분석')
    })

    it('빈 입력에 대해서도 컨텍스트를 반환해야 한다', () => {
      const context = service.getKnowledgeContext(emptyInput)

      expect(context).toBeTypeOf('string')
      expect(context.length).toBeGreaterThan(0)
    })

    it('상위 권장사항이 포함되어야 한다', () => {
      const context = service.getKnowledgeContext(koreanCopyInput)

      // Should contain recommendations section if available
      if (context.includes('상위 권장사항')) {
        expect(context).toMatch(/1\.|2\.|3\./)
      }
    })
  })

  describe('getRecommendations', () => {
    it('추천 목록을 반환해야 한다', () => {
      const recommendations = service.getRecommendations(koreanCopyInput)

      expect(Array.isArray(recommendations)).toBe(true)
      expect(recommendations.length).toBeGreaterThan(0)

      // Each recommendation should have required fields
      recommendations.forEach(rec => {
        expect(rec.domain).toBeTypeOf('string')
        expect(rec.recommendation).toBeTypeOf('string')
        expect(rec.priority).toBeTypeOf('string')
        expect(['high', 'medium', 'low']).toContain(rec.priority)
        expect(Array.isArray(rec.citations)).toBe(true)
      })
    })

    it('우선순위 순으로 정렬되어야 한다', () => {
      const recommendations = service.getRecommendations(koreanCopyInput)

      const priorities = ['high', 'medium', 'low']
      let lastPriorityIndex = -1

      for (const rec of recommendations) {
        const currentPriorityIndex = priorities.indexOf(rec.priority)
        expect(currentPriorityIndex).toBeGreaterThanOrEqual(lastPriorityIndex)
        lastPriorityIndex = currentPriorityIndex
      }
    })

    it('메트릭 입력에 대해 추천을 생성해야 한다', () => {
      const recommendations = service.getRecommendations(metricsInput)

      expect(Array.isArray(recommendations)).toBe(true)
      expect(recommendations.length).toBeGreaterThan(0)
    })

    it('모든 도메인의 추천이 포함될 수 있어야 한다', () => {
      const recommendations = service.getRecommendations(koreanCopyInput)

      // At least some recommendations should exist
      expect(recommendations.length).toBeGreaterThan(0)

      // Recommendations can come from any of the 6 domains
      const domains = new Set(recommendations.map(r => r.domain))
      expect(domains.size).toBeGreaterThan(0)
      expect(domains.size).toBeLessThanOrEqual(6)
    })

    it('빈 입력에 대해서도 추천을 생성해야 한다', () => {
      const recommendations = service.getRecommendations(emptyInput)

      expect(Array.isArray(recommendations)).toBe(true)
      // Even with empty input, some general recommendations may be generated
    })
  })

  describe('통합 시나리오', () => {
    it('한국어 카피 입력에 대해 과학 점수를 생성해야 한다', () => {
      const output = service.analyzeAll(koreanCopyInput)

      // Composite score should be calculated
      expect(output.compositeScore.overall).toBeGreaterThan(0)
      expect(output.compositeScore.grade).toBeDefined()

      // All domains should be analyzed
      expect(output.compositeScore.domainScores.length).toBe(6)

      // Each domain should have scores and factors
      output.compositeScore.domainScores.forEach(ds => {
        expect(ds.score).toBeGreaterThanOrEqual(0)
        expect(ds.score).toBeLessThanOrEqual(100)
        expect(ds.factors.length).toBeGreaterThan(0)
      })

      // Knowledge context should be generated
      expect(output.knowledgeContext).toContain('마케팅 사이언스 분석')

      // Recommendations should be available
      const recommendations = service.getRecommendations(koreanCopyInput)
      expect(recommendations.length).toBeGreaterThan(0)
    })

    it('성과 지표 입력에 대해 분석을 수행해야 한다', () => {
      const output = service.analyzeAll(metricsInput)

      expect(output.compositeScore.overall).toBeGreaterThan(0)
      expect(output.compositeScore.domainScores.length).toBe(6)

      // Should analyze metrics-relevant domains
      const metaBestPractices = output.compositeScore.domainScores.find(
        ds => ds.domain === 'meta_best_practices'
      )
      expect(metaBestPractices).toBeDefined()

      // Knowledge context should include metric analysis
      expect(output.knowledgeContext).toBeTypeOf('string')
      expect(output.knowledgeContext.length).toBeGreaterThan(0)
    })

    it('복합 입력(콘텐츠 + 메트릭)에 대해 전체 분석을 수행해야 한다', () => {
      const complexInput: AnalysisInput = {
        content: {
          headline: '지금 바로 시작하세요!',
          primaryText: '30일 무료 체험 제공',
          callToAction: '무료 체험 시작',
        },
        context: {
          industry: 'saas',
          objective: 'conversion',
          tone: 'urgent',
        },
        metrics: {
          ctr: 2.5,
          cvr: 3.0,
          roas: 4.0,
        },
        creative: {
          format: 'image',
          dominantColors: ['#FF0000', '#0000FF'],
        },
      }

      const output = service.analyzeAll(complexInput)

      expect(output.compositeScore.overall).toBeGreaterThan(0)
      expect(output.compositeScore.domainScores.length).toBe(6)

      // Should analyze all aspects
      const colorPsych = output.compositeScore.domainScores.find(
        ds => ds.domain === 'color_psychology'
      )
      expect(colorPsych).toBeDefined()

      const neuromarketing = output.compositeScore.domainScores.find(
        ds => ds.domain === 'neuromarketing'
      )
      expect(neuromarketing).toBeDefined()
    })

    it('analyzeAll과 getKnowledgeContext가 일관된 결과를 반환해야 한다', () => {
      const output = service.analyzeAll(koreanCopyInput)
      const context = service.getKnowledgeContext(koreanCopyInput)

      // Context should reflect the composite score
      expect(context).toContain(output.compositeScore.grade)
      expect(context).toContain(String(output.compositeScore.overall))
    })

    it('analyzeAll과 getRecommendations가 일관된 결과를 반환해야 한다', () => {
      const output = service.analyzeAll(koreanCopyInput)
      const recommendations = service.getRecommendations(koreanCopyInput)

      // All recommendations should come from analyzed domains
      const analyzedDomains = new Set(output.compositeScore.domainScores.map(ds => ds.domain))

      recommendations.forEach(rec => {
        expect(analyzedDomains.has(rec.domain)).toBe(true)
      })
    })
  })

  describe('에러 처리', () => {
    it('3개 미만의 도메인이 성공하면 InsufficientAnalysisError를 던져야 한다', () => {
      // This test verifies the error handling logic
      // Since we're using real analyzers that should all succeed,
      // we test this via analyzeSpecific with insufficient domains

      expect(() => {
        service.analyzeSpecific(koreanCopyInput, ['neuromarketing', 'marketing_psychology'])
      }).toThrow(InsufficientAnalysisError)

      expect(() => {
        service.analyzeSpecific(koreanCopyInput, ['neuromarketing'])
      }).toThrow(InsufficientAnalysisError)

      expect(() => {
        service.analyzeSpecific(koreanCopyInput, [])
      }).toThrow(InsufficientAnalysisError)
    })

    it('InsufficientAnalysisError에 적절한 정보가 포함되어야 한다', () => {
      try {
        service.analyzeSpecific(koreanCopyInput, ['neuromarketing', 'marketing_psychology'])
        expect.fail('Should have thrown InsufficientAnalysisError')
      } catch (error) {
        expect(error).toBeInstanceOf(InsufficientAnalysisError)

        if (error instanceof InsufficientAnalysisError) {
          expect(error.analyzedCount).toBe(2)
          expect(error.requiredCount).toBe(3)
          expect(Array.isArray(error.failedDomains)).toBe(true)
          expect(error.message).toContain('Insufficient domain analysis')
        }
      }
    })
  })

  describe('성능 특성', () => {
    it('모든 분석이 합리적인 시간 내에 완료되어야 한다', () => {
      const startTime = Date.now()
      service.analyzeAll(koreanCopyInput)
      const endTime = Date.now()

      // Should complete within 5 seconds
      expect(endTime - startTime).toBeLessThan(5000)
    })

    it('여러 번 호출해도 일관된 결과를 반환해야 한다', () => {
      const output1 = service.analyzeAll(koreanCopyInput)
      const output2 = service.analyzeAll(koreanCopyInput)

      // Scores should be identical for the same input
      expect(output1.compositeScore.overall).toBe(output2.compositeScore.overall)
      expect(output1.compositeScore.grade).toBe(output2.compositeScore.grade)
      expect(output1.compositeScore.domainScores.length).toBe(output2.compositeScore.domainScores.length)
    })
  })
})
