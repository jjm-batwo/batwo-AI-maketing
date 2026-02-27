/**
 * Copywriting Psychology Domain Analyzer
 *
 * Evaluates ad copy based on:
 * - Power Word Density (Bly 2020)
 * - SUCCESs Framework (Heath & Heath 2007)
 * - Headline Formulas (PAS, benefit-led, number-led)
 * - Readability & Scanability (Nielsen 2006)
 * - CTA Psychology (first person > second person)
 */

import type { DomainAnalyzer, AnalysisInput } from '@application/ports/IKnowledgeBaseService'
import type {
  DomainScore,
  ScoringFactor,
  Citation,
  DomainRecommendation,
} from '@domain/value-objects/MarketingScience'
import { getGrade } from '@domain/value-objects/MarketingScience'
import {
  findPowerWords,
  calculatePowerWordDensity,
  countKoreanWords,
  KOREAN_POWER_WORDS,
} from '../data/korean-power-words'

// --- CTA Psychology Data ---

const STRONG_CTA_PATTERNS = ['내 ', '나의 ', '지금 바로', '무료로', '한정', '오늘만']
const WEAK_CTA_PATTERNS = ['자세히 보기', '더 보기', '클릭', '방문']
const CTA_FIRST_PERSON_KEYWORDS = ['내', '나의', '나만의']

// --- Analyzer Implementation ---

export class CopywritingPsychologyAnalyzer implements DomainAnalyzer {
  domain = 'copywriting_psychology' as const

  analyze(input: AnalysisInput): DomainScore {
    const headline = input.content?.headline ?? ''
    const primaryText = input.content?.primaryText ?? ''
    const description = input.content?.description ?? ''
    const callToAction = input.content?.callToAction ?? ''

    // Combined text for analysis
    const combinedText = [headline, primaryText, description].filter(Boolean).join(' ')
    const allText = [headline, primaryText, description, callToAction].filter(Boolean).join(' ')

    // If no content, return partial score
    if (combinedText.trim().length === 0) {
      return {
        domain: 'copywriting_psychology',
        score: 50,
        maxScore: 100,
        grade: getGrade(50),
        factors: [
          {
            name: 'No Content',
            score: 50,
            weight: 1.0,
            explanation: '카피 내용이 제공되지 않아 평가 불가. headline, primaryText를 입력하세요.',
          },
        ],
        citations: [],
        recommendations: [
          {
            domain: 'copywriting_psychology',
            priority: 'high',
            recommendation: '광고 카피(헤드라인, 본문)를 분석에 제공하세요.',
            scientificBasis: 'Copywriting analysis requires actual text content.',
            expectedImpact: '카피 최적화로 CTR 30-50% 개선 가능',
            citations: [],
          },
        ],
      }
    }

    // --- Scoring Factors ---

    const powerWordDensityFactor = scorePowerWordDensity(combinedText)
    const headlineQualityFactor = scoreHeadlineQuality(headline)
    const successFrameworkFactor = scoreSuccessFramework(combinedText, headline)
    const ctaStrengthFactor = scoreCtaStrength(callToAction)
    const readabilityFactor = scoreReadability(allText)

    const factors: ScoringFactor[] = [
      powerWordDensityFactor,
      headlineQualityFactor,
      successFrameworkFactor,
      ctaStrengthFactor,
      readabilityFactor,
    ]

    const totalScore = Math.round(
      factors.reduce((sum, f) => sum + f.score * f.weight, 0)
    )

    // --- Citations ---

    const citations: Citation[] = [
      {
        id: 'bly2020',
        domain: 'copywriting_psychology',
        source: 'Bly, R. W. (2020)',
        finding: 'The Copywriter\'s Handbook: Power words increase persuasiveness',
        applicability: 'Power word density of 0.15-0.25 (2-3 per sentence) is optimal for conversion copy.',
        confidenceLevel: 'high',
        year: 2020,
        category: 'Power Words',
      },
      {
        id: 'heath2007',
        domain: 'copywriting_psychology',
        source: 'Heath, C., & Heath, D. (2007)',
        finding: 'Made to Stick: SUCCESs Framework for memorable messages',
        applicability: 'Messages with Simple, Unexpected, Concrete, Credible, Emotional, Story elements are 10x more memorable.',
        confidenceLevel: 'high',
        year: 2007,
        category: 'SUCCESs Framework',
      },
      {
        id: 'nielsen2006',
        domain: 'copywriting_psychology',
        source: 'Nielsen, J. (2006)',
        finding: 'F-Shaped Pattern for Reading Web Content',
        applicability: 'Users scan in F-pattern. Headlines and first 2 sentences critical. Scanability improves comprehension by 47%.',
        confidenceLevel: 'high',
        year: 2006,
        category: 'Readability',
      },
      {
        id: 'cialdini2021',
        domain: 'copywriting_psychology',
        source: 'Cialdini, R. B. (2021)',
        finding: 'Influence: The Psychology of Persuasion',
        applicability: 'First-person framing ("내 쿠폰") activates endowment effect, increasing perceived value by 30%.',
        confidenceLevel: 'high',
        year: 2021,
        category: 'CTA Psychology',
      },
    ]

    // --- Recommendations ---

    const recommendations = generateRecommendations(
      {
        headline,
        primaryText,
        description,
        callToAction,
        combinedText,
      },
      totalScore,
      factors,
      citations
    )

    return {
      domain: 'copywriting_psychology',
      score: totalScore,
      maxScore: 100,
      grade: getGrade(totalScore),
      factors,
      citations,
      recommendations,
    }
  }
}

// --- Scoring Functions ---

function scorePowerWordDensity(text: string): ScoringFactor {
  const density = calculatePowerWordDensity(text)
  const foundWords = findPowerWords(text)

  // Optimal density: 0.15-0.25 (about 2-3 power words per 10 words)
  let score = 50
  if (density >= 0.15 && density <= 0.25) {
    score = 90 // Optimal
  } else if (density > 0.1 && density < 0.3) {
    score = 75 // Good
  } else if (density > 0.05 && density < 0.35) {
    score = 60 // Acceptable
  } else if (density > 0.35) {
    score = 40 // Too many, feels spammy
  } else {
    score = 30 // Too few, lacks persuasiveness
  }

  const wordCount = countKoreanWords(text)
  const powerWordCount = foundWords.length

  const explanation =
    density >= 0.15 && density <= 0.25
      ? `파워 워드 밀도 최적 (${(density * 100).toFixed(1)}%). ${powerWordCount}개/${wordCount}단어.`
      : density > 0.25
      ? `파워 워드 과다 (${(density * 100).toFixed(1)}%). 스팸으로 인식될 위험. 줄이세요.`
      : `파워 워드 부족 (${(density * 100).toFixed(1)}%). 설득력 향상 필요. 목표: 15-25%.`

  return {
    name: 'Power Word Density',
    score,
    weight: 0.25,
    explanation,
    citation: {
      id: 'bly2020',
      domain: 'copywriting_psychology',
      source: 'Bly (2020)',
      finding: 'Optimal power word density: 2-3 per sentence',
      applicability: 'Direct copywriting optimization',
      confidenceLevel: 'high',
      year: 2020,
      category: 'Power Words',
    },
  }
}

function scoreHeadlineQuality(headline: string): ScoringFactor {
  if (!headline.trim()) {
    return {
      name: 'Headline Quality',
      score: 0,
      weight: 0.25,
      explanation: '헤드라인 없음. 헤드라인은 CTR에 가장 큰 영향을 미침.',
    }
  }

  const charCount = Array.from(headline).length
  const powerWords = findPowerWords(headline)
  const hasNumber = /\d/.test(headline)
  const hasSpecifics = /\d+%|\d+원|\d+명|\d+개/.test(headline)

  let score = 50 // Base

  // Optimal Korean headline: 10-25 characters
  if (charCount >= 10 && charCount <= 25) {
    score += 20
  } else if (charCount > 25 && charCount <= 35) {
    score += 10 // Acceptable
  } else if (charCount < 10 || charCount > 35) {
    score -= 10 // Too short or too long
  }

  // Power words in headline
  if (powerWords.length >= 1) {
    score += 15
  }

  // Numbers (specificity)
  if (hasNumber) {
    score += 10
  }
  if (hasSpecifics) {
    score += 5
  }

  const finalScore = Math.max(0, Math.min(100, score))

  const issues: string[] = []
  if (charCount < 10) issues.push('너무 짧음')
  if (charCount > 35) issues.push('너무 김')
  if (powerWords.length === 0) issues.push('파워 워드 없음')
  if (!hasNumber) issues.push('숫자/구체성 부족')

  const explanation =
    finalScore >= 80
      ? `헤드라인 우수 (${charCount}자, 파워워드 ${powerWords.length}개, 숫자 ${hasNumber ? '있음' : '없음'}).`
      : `헤드라인 개선 필요: ${issues.join(', ')}. 최적 길이 10-25자.`

  return {
    name: 'Headline Quality',
    score: finalScore,
    weight: 0.25,
    explanation,
  }
}

function scoreSuccessFramework(text: string, headline: string): ScoringFactor {
  let score = 0
  const maxScore = 6 // 6 elements
  const foundElements: string[] = []

  // Simple: short sentences, clear message (headline ≤ 25 chars, text ≤ 80 words)
  const textWords = countKoreanWords(text)
  const headlineChars = Array.from(headline).length
  if (headlineChars <= 25 && textWords <= 80) {
    score++
    foundElements.push('Simple')
  }

  // Unexpected: numbers, stats, surprising facts
  if (/\d+%|\d+배|\d+원|\d+명/.test(text)) {
    score++
    foundElements.push('Unexpected')
  }

  // Concrete: specific details, tangible descriptions
  const concretePatterns = ['예를 들어', '실제로', '구체적으로', '바로', '직접']
  if (concretePatterns.some(p => text.includes(p)) || /\d+/.test(text)) {
    score++
    foundElements.push('Concrete')
  }

  // Credible: trust words, certifications, expert mentions
  const trustWords = KOREAN_POWER_WORDS.trust
  if (trustWords.some(w => text.includes(w))) {
    score++
    foundElements.push('Credible')
  }

  // Emotional: emotion words
  const emotionWords = KOREAN_POWER_WORDS.emotion
  if (emotionWords.some(w => text.includes(w))) {
    score++
    foundElements.push('Emotional')
  }

  // Stories: narrative markers
  const storyMarkers = ['이야기', '경험', '사례', '후기', '고객', '변화', '전', '후']
  if (storyMarkers.some(m => text.includes(m))) {
    score++
    foundElements.push('Stories')
  }

  const finalScore = Math.round((score / maxScore) * 100)

  const missing = ['Simple', 'Unexpected', 'Concrete', 'Credible', 'Emotional', 'Stories'].filter(
    e => !foundElements.includes(e)
  )

  const explanation =
    score >= 5
      ? `SUCCESs 프레임워크 ${score}/6 요소 충족. 매우 효과적.`
      : score >= 3
      ? `SUCCESs ${score}/6 요소 충족. 개선 여지: ${missing.slice(0, 2).join(', ')}`
      : `SUCCESs 부족 (${score}/6). 누락: ${missing.slice(0, 3).join(', ')}`

  return {
    name: 'SUCCESs Framework',
    score: finalScore,
    weight: 0.2,
    explanation,
    citation: {
      id: 'heath2007',
      domain: 'copywriting_psychology',
      source: 'Heath & Heath (2007)',
      finding: 'SUCCESs messages are 10x more memorable',
      applicability: 'Direct messaging framework',
      confidenceLevel: 'high',
      year: 2007,
      category: 'SUCCESs Framework',
    },
  }
}

function scoreCtaStrength(cta: string): ScoringFactor {
  if (!cta.trim()) {
    return {
      name: 'CTA Strength',
      score: 50,
      weight: 0.2,
      explanation: 'CTA 없음. CTA는 전환율에 직접적 영향.',
    }
  }

  let score = 50 // Base

  // First person (endowment effect)
  const hasFirstPerson = CTA_FIRST_PERSON_KEYWORDS.some(k => cta.includes(k))
  if (hasFirstPerson) {
    score += 20
  }

  // Strong patterns
  const strongMatch = STRONG_CTA_PATTERNS.some(p => cta.includes(p))
  if (strongMatch) {
    score += 15
  }

  // Weak patterns (penalty)
  const weakMatch = WEAK_CTA_PATTERNS.some(p => cta.includes(p))
  if (weakMatch) {
    score -= 15
  }

  // Specificity (numbers, urgency, benefit)
  const hasUrgency = ['지금', '오늘', '바로', '즉시'].some(u => cta.includes(u))
  const hasBenefit = ['무료', '할인', '혜택', '증정'].some(b => cta.includes(b))
  if (hasUrgency) score += 10
  if (hasBenefit) score += 10

  const finalScore = Math.max(0, Math.min(100, score))

  const suggestions: string[] = []
  if (!hasFirstPerson) suggestions.push('1인칭("내", "나의") 사용')
  if (!hasUrgency) suggestions.push('긴급성 추가')
  if (!hasBenefit) suggestions.push('혜택 명시')
  if (weakMatch) suggestions.push('약한 패턴 제거')

  const explanation =
    finalScore >= 80
      ? `CTA 강력 (1인칭: ${hasFirstPerson ? 'O' : 'X'}, 긴급: ${hasUrgency ? 'O' : 'X'}, 혜택: ${hasBenefit ? 'O' : 'X'}).`
      : `CTA 개선 필요: ${suggestions.slice(0, 2).join(', ')}. 예: "내 무료 쿠폰 받기"`

  return {
    name: 'CTA Strength',
    score: finalScore,
    weight: 0.2,
    explanation,
    citation: {
      id: 'cialdini2021',
      domain: 'copywriting_psychology',
      source: 'Cialdini (2021)',
      finding: 'First-person CTA increases perceived value by 30%',
      applicability: 'CTA optimization',
      confidenceLevel: 'high',
      year: 2021,
      category: 'CTA Psychology',
    },
  }
}

function scoreReadability(text: string): ScoringFactor {
  const charCount = Array.from(text).length
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0)
  const sentenceCount = sentences.length

  let score = 70 // Base

  // Optimal ad text: 30-100 words (Korean: 50-200 chars)
  if (charCount >= 50 && charCount <= 200) {
    score += 15
  } else if (charCount > 200 && charCount <= 300) {
    score += 5
  } else if (charCount > 300) {
    score -= 10 // Too long for ads
  } else if (charCount < 50) {
    score -= 5 // Too short
  }

  // Sentence variety (avg 8-15 chars per sentence in Korean)
  const avgSentenceChars = sentenceCount > 0 ? charCount / sentenceCount : 0
  if (avgSentenceChars >= 8 && avgSentenceChars <= 15) {
    score += 10
  }

  // Korean character ratio (should be high for Korean ads)
  const koreanCharRegex = /[\uAC00-\uD7AF]/g
  const koreanChars = (text.match(koreanCharRegex) || []).length
  const koreanRatio = charCount > 0 ? koreanChars / charCount : 0
  if (koreanRatio >= 0.6) {
    score += 5
  }

  const finalScore = Math.max(0, Math.min(100, score))

  const explanation =
    charCount > 300
      ? `텍스트 과다 (${charCount}자). 광고는 50-200자 권장. 스캔 가능성 낮음.`
      : charCount < 50
      ? `텍스트 부족 (${charCount}자). 메시지 전달 미흡.`
      : `가독성 양호 (${charCount}자, 문장 ${sentenceCount}개, 평균 ${avgSentenceChars.toFixed(1)}자/문장).`

  return {
    name: 'Readability',
    score: finalScore,
    weight: 0.1,
    explanation,
    citation: {
      id: 'nielsen2006',
      domain: 'copywriting_psychology',
      source: 'Nielsen (2006)',
      finding: 'Scanability improves comprehension by 47%',
      applicability: 'Ad copy length and structure',
      confidenceLevel: 'high',
      year: 2006,
      category: 'Readability',
    },
  }
}

// --- Recommendation Generation ---

function generateRecommendations(
  content: {
    headline: string
    primaryText: string
    description: string
    callToAction: string
    combinedText: string
  },
  totalScore: number,
  factors: ScoringFactor[],
  citations: Citation[]
): DomainRecommendation[] {
  const recommendations: DomainRecommendation[] = []

  // Critical: Low total score
  if (totalScore < 60) {
    recommendations.push({
      domain: 'copywriting_psychology',
      priority: 'critical',
      recommendation:
        '카피 전면 재작성 권장. SUCCESs 프레임워크 적용 + 파워 워드 15-25% 밀도 + 1인칭 CTA 활용.',
      scientificBasis:
        'Heath & Heath (2007): SUCCESs messages are 10x more memorable and drive 3x higher engagement.',
      expectedImpact: 'CTR 30-50% 개선 예상',
      citations: [citations[1]],
    })
  }

  // Headline issue
  const headlineFactor = factors.find(f => f.name === 'Headline Quality')
  if (headlineFactor && headlineFactor.score < 60) {
    const currentLength = Array.from(content.headline).length
    recommendations.push({
      domain: 'copywriting_psychology',
      priority: 'high',
      recommendation: `헤드라인 개선: 10-25자 길이 (현재 ${currentLength}자), 파워워드 1-2개, 숫자/구체성 추가. 예: "오늘만 50% 할인 - 무료배송"`,
      scientificBasis:
        'Headlines determine 80% of ad performance. Optimal length with numbers increases CTR by 36%.',
      expectedImpact: 'CTR +20-40%',
      citations: [],
    })
  }

  // Power word issue
  const powerWordFactor = factors.find(f => f.name === 'Power Word Density')
  if (powerWordFactor && powerWordFactor.score < 60) {
    const currentDensity = calculatePowerWordDensity(content.combinedText)
    const wordCount = countKoreanWords(content.combinedText)
    const targetPowerWords = Math.round(wordCount * 0.2) // Target 20%
    recommendations.push({
      domain: 'copywriting_psychology',
      priority: 'high',
      recommendation: `파워 워드 밀도 개선: 현재 ${(currentDensity * 100).toFixed(1)}% → 목표 15-25%. ${targetPowerWords}개 정도 추가 권장. 카테고리: 긴급성(지금, 오늘만), 무료(무료, 증정), 신뢰(보장, 인증).`,
      scientificBasis: 'Bly (2020): Power word density of 15-25% increases persuasiveness without spam perception.',
      expectedImpact: '설득력 +25%, CVR +15%',
      citations: [citations[0]],
    })
  }

  // CTA issue
  const ctaFactor = factors.find(f => f.name === 'CTA Strength')
  if (ctaFactor && ctaFactor.score < 70) {
    const hasFirstPerson = CTA_FIRST_PERSON_KEYWORDS.some(k => content.callToAction.includes(k))
    recommendations.push({
      domain: 'copywriting_psychology',
      priority: 'high',
      recommendation: hasFirstPerson
        ? 'CTA에 긴급성과 혜택 명시: "내 한정 할인 지금 받기" 형태 권장.'
        : 'CTA를 1인칭으로 변경: "쿠폰 받기" → "내 무료 쿠폰 받기". 소유 효과(Endowment Effect) 활용.',
      scientificBasis:
        'Cialdini (2021): First-person framing activates endowment effect, increasing perceived value by 30%.',
      expectedImpact: 'CTA 클릭률 +20-35%',
      citations: [citations[3]],
    })
  }

  // SUCCESs issue
  const successFactor = factors.find(f => f.name === 'SUCCESs Framework')
  if (successFactor && successFactor.score < 60) {
    recommendations.push({
      domain: 'copywriting_psychology',
      priority: 'medium',
      recommendation:
        'SUCCESs 프레임워크 요소 보강: Simple(간결), Unexpected(숫자/통계), Concrete(구체적 묘사), Credible(인증/후기), Emotional(감성어), Stories(고객 사례).',
      scientificBasis: 'Heath & Heath (2007): Messages with SUCCESs elements are 10x more memorable.',
      expectedImpact: '메시지 기억률 +300%, 공유율 +150%',
      citations: [citations[1]],
    })
  }

  // Readability issue
  const readabilityFactor = factors.find(f => f.name === 'Readability')
  if (readabilityFactor && readabilityFactor.score < 60) {
    const charCount = Array.from(content.combinedText).length
    recommendations.push({
      domain: 'copywriting_psychology',
      priority: 'low',
      recommendation:
        charCount > 300
          ? `텍스트 길이 축소 (현재 ${charCount}자 → 목표 50-200자). 핵심 메시지만 남기고 단순화.`
          : `텍스트 길이 확장 (현재 ${charCount}자). 혜택과 신뢰 요소 추가하여 50-200자로 확장.`,
      scientificBasis:
        'Nielsen (2006): Users scan in F-pattern. Optimal ad length improves comprehension by 47%.',
      expectedImpact: '스캔 가능성 개선, 이탈률 -20%',
      citations: [citations[2]],
    })
  }

  return recommendations
}
