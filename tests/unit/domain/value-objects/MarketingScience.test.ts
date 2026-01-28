import { describe, it, expect } from 'vitest'
import {
  getGrade,
  calculateWeightedAverage,
  rankRecommendations,
  buildCompositeScore,
  ALL_KNOWLEDGE_DOMAINS,
  DEFAULT_DOMAIN_WEIGHTS,
  GRADE_BOUNDARIES,
  INDUSTRY_BENCHMARKS,
  MIN_REQUIRED_DOMAINS,
  type DomainScore,
  type DomainRecommendation,
  type KnowledgeDomain,
} from '@/domain/value-objects/MarketingScience'

describe('MarketingScience', () => {
  describe('getGrade', () => {
    it('90점 이상이면 A+ 등급을 반환해야 한다', () => {
      expect(getGrade(90)).toBe('A+')
      expect(getGrade(95)).toBe('A+')
      expect(getGrade(100)).toBe('A+')
    })

    it('80점이면 A 등급을 반환해야 한다', () => {
      expect(getGrade(80)).toBe('A')
      expect(getGrade(85)).toBe('A')
      expect(getGrade(89)).toBe('A')
    })

    it('70점이면 B+ 등급을 반환해야 한다', () => {
      expect(getGrade(70)).toBe('B+')
      expect(getGrade(75)).toBe('B+')
      expect(getGrade(79)).toBe('B+')
    })

    it('60점이면 B 등급을 반환해야 한다', () => {
      expect(getGrade(60)).toBe('B')
      expect(getGrade(65)).toBe('B')
      expect(getGrade(69)).toBe('B')
    })

    it('50점이면 C+ 등급을 반환해야 한다', () => {
      expect(getGrade(50)).toBe('C+')
      expect(getGrade(55)).toBe('C+')
      expect(getGrade(59)).toBe('C+')
    })

    it('40점이면 C 등급을 반환해야 한다', () => {
      expect(getGrade(40)).toBe('C')
      expect(getGrade(45)).toBe('C')
      expect(getGrade(49)).toBe('C')
    })

    it('30점이면 D 등급을 반환해야 한다', () => {
      expect(getGrade(30)).toBe('D')
      expect(getGrade(35)).toBe('D')
      expect(getGrade(39)).toBe('D')
    })

    it('0점이면 F 등급을 반환해야 한다', () => {
      expect(getGrade(0)).toBe('F')
      expect(getGrade(10)).toBe('F')
      expect(getGrade(29)).toBe('F')
    })
  })

  describe('calculateWeightedAverage', () => {
    it('도메인 점수의 가중 평균을 계산해야 한다', () => {
      const domainScores: DomainScore[] = [
        {
          domain: 'neuromarketing',
          score: 80,
          maxScore: 100,
          grade: 'A',
          factors: [],
          citations: [],
          recommendations: [],
        },
        {
          domain: 'marketing_psychology',
          score: 90,
          maxScore: 100,
          grade: 'A+',
          factors: [],
          citations: [],
          recommendations: [],
        },
      ]

      // neuromarketing: 80 * 0.20 = 16
      // marketing_psychology: 90 * 0.20 = 18
      // totalWeight: 0.20 + 0.20 = 0.40
      // weighted average: (16 + 18) / 0.40 = 85
      const result = calculateWeightedAverage(domainScores)
      expect(result).toBe(85)
    })

    it('빈 배열이면 0을 반환해야 한다', () => {
      const result = calculateWeightedAverage([])
      expect(result).toBe(0)
    })

    it('커스텀 가중치를 사용할 수 있어야 한다', () => {
      const domainScores: DomainScore[] = [
        {
          domain: 'neuromarketing',
          score: 80,
          maxScore: 100,
          grade: 'A',
          factors: [],
          citations: [],
          recommendations: [],
        },
        {
          domain: 'marketing_psychology',
          score: 60,
          maxScore: 100,
          grade: 'B',
          factors: [],
          citations: [],
          recommendations: [],
        },
      ]

      const customWeights: Record<KnowledgeDomain, number> = {
        neuromarketing: 0.7,
        marketing_psychology: 0.3,
        crowd_psychology: 0,
        meta_best_practices: 0,
        color_psychology: 0,
        copywriting_psychology: 0,
      }

      // neuromarketing: 80 * 0.7 = 56
      // marketing_psychology: 60 * 0.3 = 18
      // totalWeight: 0.7 + 0.3 = 1.0
      // weighted average: (56 + 18) / 1.0 = 74
      const result = calculateWeightedAverage(domainScores, customWeights)
      expect(result).toBe(74)
    })

    it('가중치가 0인 도메인은 무시해야 한다', () => {
      const domainScores: DomainScore[] = [
        {
          domain: 'neuromarketing',
          score: 80,
          maxScore: 100,
          grade: 'A',
          factors: [],
          citations: [],
          recommendations: [],
        },
      ]

      const result = calculateWeightedAverage(domainScores)
      // 단일 도메인이지만 가중치를 고려하면 80
      expect(result).toBe(80)
    })
  })

  describe('rankRecommendations', () => {
    it('우선순위(critical > high > medium > low) 순으로 정렬해야 한다', () => {
      const recommendations: DomainRecommendation[] = [
        {
          domain: 'neuromarketing',
          priority: 'low',
          recommendation: 'Low priority',
          scientificBasis: 'basis',
          expectedImpact: 'impact',
          citations: [],
        },
        {
          domain: 'marketing_psychology',
          priority: 'critical',
          recommendation: 'Critical priority',
          scientificBasis: 'basis',
          expectedImpact: 'impact',
          citations: [],
        },
        {
          domain: 'crowd_psychology',
          priority: 'medium',
          recommendation: 'Medium priority',
          scientificBasis: 'basis',
          expectedImpact: 'impact',
          citations: [],
        },
        {
          domain: 'meta_best_practices',
          priority: 'high',
          recommendation: 'High priority',
          scientificBasis: 'basis',
          expectedImpact: 'impact',
          citations: [],
        },
      ]

      const ranked = rankRecommendations(recommendations)

      expect(ranked[0].priority).toBe('critical')
      expect(ranked[1].priority).toBe('high')
      expect(ranked[2].priority).toBe('medium')
      expect(ranked[3].priority).toBe('low')
    })

    it('원본 배열을 변경하지 않아야 한다', () => {
      const recommendations: DomainRecommendation[] = [
        {
          domain: 'neuromarketing',
          priority: 'low',
          recommendation: 'Low priority',
          scientificBasis: 'basis',
          expectedImpact: 'impact',
          citations: [],
        },
        {
          domain: 'marketing_psychology',
          priority: 'critical',
          recommendation: 'Critical priority',
          scientificBasis: 'basis',
          expectedImpact: 'impact',
          citations: [],
        },
      ]

      const original = [...recommendations]
      const ranked = rankRecommendations(recommendations)

      // 원본 배열은 변경되지 않음
      expect(recommendations[0].priority).toBe('low')
      expect(recommendations[1].priority).toBe('critical')

      // 정렬된 배열은 변경됨
      expect(ranked[0].priority).toBe('critical')
      expect(ranked[1].priority).toBe('low')

      // 원본과 정렬된 배열이 다른 참조
      expect(ranked).not.toBe(recommendations)
    })

    it('빈 배열을 처리해야 한다', () => {
      const ranked = rankRecommendations([])
      expect(ranked).toEqual([])
    })

    it('동일 우선순위는 원래 순서를 유지해야 한다', () => {
      const recommendations: DomainRecommendation[] = [
        {
          domain: 'neuromarketing',
          priority: 'high',
          recommendation: 'First high',
          scientificBasis: 'basis',
          expectedImpact: 'impact',
          citations: [],
        },
        {
          domain: 'marketing_psychology',
          priority: 'high',
          recommendation: 'Second high',
          scientificBasis: 'basis',
          expectedImpact: 'impact',
          citations: [],
        },
      ]

      const ranked = rankRecommendations(recommendations)

      expect(ranked[0].recommendation).toBe('First high')
      expect(ranked[1].recommendation).toBe('Second high')
    })
  })

  describe('buildCompositeScore', () => {
    it('종합 점수를 올바르게 구성해야 한다', () => {
      const domainScores: DomainScore[] = [
        {
          domain: 'neuromarketing',
          score: 80,
          maxScore: 100,
          grade: 'A',
          factors: [],
          citations: [],
          recommendations: [],
        },
        {
          domain: 'marketing_psychology',
          score: 90,
          maxScore: 100,
          grade: 'A+',
          factors: [],
          citations: [],
          recommendations: [],
        },
      ]

      const failedDomains: KnowledgeDomain[] = ['crowd_psychology']

      const composite = buildCompositeScore(domainScores, failedDomains)

      expect(composite.overall).toBe(85) // 가중 평균
      expect(composite.grade).toBe('A') // 85점은 A
      expect(composite.domainScores).toEqual(domainScores)
      expect(composite.analyzedDomains).toEqual(['neuromarketing', 'marketing_psychology'])
      expect(composite.failedDomains).toEqual(['crowd_psychology'])
      expect(composite.topRecommendations).toEqual([])
      expect(composite.totalCitations).toEqual([])
      expect(composite.summary).toBe('')
    })

    it('실패한 도메인을 포함해야 한다', () => {
      const domainScores: DomainScore[] = [
        {
          domain: 'neuromarketing',
          score: 80,
          maxScore: 100,
          grade: 'A',
          factors: [],
          citations: [],
          recommendations: [],
        },
      ]

      const failedDomains: KnowledgeDomain[] = [
        'marketing_psychology',
        'crowd_psychology',
        'meta_best_practices',
      ]

      const composite = buildCompositeScore(domainScores, failedDomains)

      expect(composite.failedDomains).toEqual([
        'marketing_psychology',
        'crowd_psychology',
        'meta_best_practices',
      ])
      expect(composite.analyzedDomains).toEqual(['neuromarketing'])
    })

    it('상위 5개 추천만 포함해야 한다', () => {
      const recommendations: DomainRecommendation[] = Array.from({ length: 10 }, (_, i) => ({
        domain: 'neuromarketing',
        priority: i < 3 ? 'critical' : i < 6 ? 'high' : 'medium',
        recommendation: `Recommendation ${i + 1}`,
        scientificBasis: 'basis',
        expectedImpact: 'impact',
        citations: [],
      }))

      const domainScores: DomainScore[] = [
        {
          domain: 'neuromarketing',
          score: 80,
          maxScore: 100,
          grade: 'A',
          factors: [],
          citations: [],
          recommendations,
        },
      ]

      const composite = buildCompositeScore(domainScores, [])

      expect(composite.topRecommendations).toHaveLength(5)
      // 우선순위 순으로 정렬된 상위 5개
      expect(composite.topRecommendations[0].priority).toBe('critical')
      expect(composite.topRecommendations[1].priority).toBe('critical')
      expect(composite.topRecommendations[2].priority).toBe('critical')
      expect(composite.topRecommendations[3].priority).toBe('high')
      expect(composite.topRecommendations[4].priority).toBe('high')
    })

    it('모든 인용을 수집해야 한다', () => {
      const citations1 = [
        {
          id: 'cite-1',
          domain: 'neuromarketing' as KnowledgeDomain,
          source: 'Source 1',
          finding: 'Finding 1',
          applicability: 'Applicable',
          confidenceLevel: 'high' as const,
          category: 'Category 1',
        },
      ]

      const citations2 = [
        {
          id: 'cite-2',
          domain: 'marketing_psychology' as KnowledgeDomain,
          source: 'Source 2',
          finding: 'Finding 2',
          applicability: 'Applicable',
          confidenceLevel: 'medium' as const,
          category: 'Category 2',
        },
      ]

      const domainScores: DomainScore[] = [
        {
          domain: 'neuromarketing',
          score: 80,
          maxScore: 100,
          grade: 'A',
          factors: [],
          citations: citations1,
          recommendations: [],
        },
        {
          domain: 'marketing_psychology',
          score: 90,
          maxScore: 100,
          grade: 'A+',
          factors: [],
          citations: citations2,
          recommendations: [],
        },
      ]

      const composite = buildCompositeScore(domainScores, [])

      expect(composite.totalCitations).toHaveLength(2)
      expect(composite.totalCitations).toEqual([...citations1, ...citations2])
    })

    it('커스텀 가중치를 사용할 수 있어야 한다', () => {
      const domainScores: DomainScore[] = [
        {
          domain: 'neuromarketing',
          score: 80,
          maxScore: 100,
          grade: 'A',
          factors: [],
          citations: [],
          recommendations: [],
        },
        {
          domain: 'marketing_psychology',
          score: 60,
          maxScore: 100,
          grade: 'B',
          factors: [],
          citations: [],
          recommendations: [],
        },
      ]

      const customWeights: Record<KnowledgeDomain, number> = {
        neuromarketing: 0.8,
        marketing_psychology: 0.2,
        crowd_psychology: 0,
        meta_best_practices: 0,
        color_psychology: 0,
        copywriting_psychology: 0,
      }

      const composite = buildCompositeScore(domainScores, [], customWeights)

      // 80 * 0.8 + 60 * 0.2 = 64 + 12 = 76
      expect(composite.overall).toBe(76)
      expect(composite.grade).toBe('B+')
    })
  })

  describe('Constants', () => {
    it('ALL_KNOWLEDGE_DOMAINS에 6개 도메인이 있어야 한다', () => {
      expect(ALL_KNOWLEDGE_DOMAINS).toHaveLength(6)
      expect(ALL_KNOWLEDGE_DOMAINS).toEqual([
        'neuromarketing',
        'marketing_psychology',
        'crowd_psychology',
        'meta_best_practices',
        'color_psychology',
        'copywriting_psychology',
      ])
    })

    it('DEFAULT_DOMAIN_WEIGHTS 합이 1.0이어야 한다', () => {
      const sum = Object.values(DEFAULT_DOMAIN_WEIGHTS).reduce((acc, weight) => acc + weight, 0)
      expect(sum).toBeCloseTo(1.0, 5)
    })

    it('DEFAULT_DOMAIN_WEIGHTS가 모든 도메인을 포함해야 한다', () => {
      const domains = Object.keys(DEFAULT_DOMAIN_WEIGHTS)
      expect(domains).toHaveLength(6)
      ALL_KNOWLEDGE_DOMAINS.forEach(domain => {
        expect(DEFAULT_DOMAIN_WEIGHTS[domain]).toBeDefined()
        expect(DEFAULT_DOMAIN_WEIGHTS[domain]).toBeGreaterThan(0)
      })
    })

    it('GRADE_BOUNDARIES가 내림차순으로 정렬되어 있어야 한다', () => {
      for (let i = 0; i < GRADE_BOUNDARIES.length - 1; i++) {
        expect(GRADE_BOUNDARIES[i].min).toBeGreaterThan(GRADE_BOUNDARIES[i + 1].min)
      }
    })

    it('GRADE_BOUNDARIES에 8개 등급이 있어야 한다', () => {
      expect(GRADE_BOUNDARIES).toHaveLength(8)
      const grades = GRADE_BOUNDARIES.map(b => b.grade)
      expect(grades).toEqual(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'])
    })

    it('INDUSTRY_BENCHMARKS에 8개 업종이 있어야 한다', () => {
      expect(Object.keys(INDUSTRY_BENCHMARKS)).toHaveLength(8)
      expect(INDUSTRY_BENCHMARKS).toHaveProperty('ecommerce')
      expect(INDUSTRY_BENCHMARKS).toHaveProperty('food_beverage')
      expect(INDUSTRY_BENCHMARKS).toHaveProperty('beauty')
      expect(INDUSTRY_BENCHMARKS).toHaveProperty('fashion')
      expect(INDUSTRY_BENCHMARKS).toHaveProperty('education')
      expect(INDUSTRY_BENCHMARKS).toHaveProperty('service')
      expect(INDUSTRY_BENCHMARKS).toHaveProperty('saas')
      expect(INDUSTRY_BENCHMARKS).toHaveProperty('health')
    })

    it('각 업종 벤치마크가 필수 속성을 포함해야 한다', () => {
      Object.values(INDUSTRY_BENCHMARKS).forEach(benchmark => {
        expect(benchmark).toHaveProperty('avgCTR')
        expect(benchmark).toHaveProperty('avgCVR')
        expect(benchmark).toHaveProperty('avgROAS')
        expect(typeof benchmark.avgCTR).toBe('number')
        expect(typeof benchmark.avgCVR).toBe('number')
        expect(typeof benchmark.avgROAS).toBe('number')
      })
    })

    it('MIN_REQUIRED_DOMAINS이 3이어야 한다', () => {
      expect(MIN_REQUIRED_DOMAINS).toBe(3)
    })
  })
})
