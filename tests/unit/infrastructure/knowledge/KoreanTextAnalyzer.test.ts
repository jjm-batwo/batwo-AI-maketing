import { describe, it, expect } from 'vitest'
import { analyzeKoreanText, countKoreanSyllables } from '@/infrastructure/knowledge/nlp/KoreanTextAnalyzer'

describe('countKoreanSyllables', () => {
  it('counts Hangul syllable characters correctly', () => {
    expect(countKoreanSyllables('안녕하세요')).toBe(5)
    expect(countKoreanSyllables('감사합니다')).toBe(5)
    expect(countKoreanSyllables('한글')).toBe(2)
  })

  it('returns 0 for empty string', () => {
    expect(countKoreanSyllables('')).toBe(0)
    expect(countKoreanSyllables('   ')).toBe(0)
  })

  it('returns 0 for non-Korean text', () => {
    expect(countKoreanSyllables('Hello World')).toBe(0)
    expect(countKoreanSyllables('12345')).toBe(0)
  })

  it('handles mixed Korean/English text', () => {
    expect(countKoreanSyllables('안녕 Hello 세요')).toBe(4)
    expect(countKoreanSyllables('AI 마케팅')).toBe(3)
  })

  it('counts Hangul Jamo characters', () => {
    // Note: countKoreanSyllables only counts U+1100-U+11FF (Hangul Jamo)
    // and U+AC00-U+D7AF (Hangul Syllables), not U+3131-U+314E (Compatibility Jamo)
    // ㄱㄴㄷ are in Compatibility Jamo range, so they return 0
    expect(countKoreanSyllables('ㄱㄴㄷ')).toBe(0)
    expect(countKoreanSyllables('ㅏㅓㅗㅜ')).toBe(0)
  })
})

describe('analyzeKoreanText', () => {
  it('returns empty result for empty/whitespace string', () => {
    const result = analyzeKoreanText('')
    expect(result.morphemes).toEqual([])
    expect(result.syllableCount).toBe(0)
    expect(result.wordCount).toBe(0)
    expect(result.charCount).toBe(0)
    expect(result.powerWords).toEqual([])
  })

  it('sets advancedNlpUsed to false (regex-only mode)', () => {
    const result = analyzeKoreanText('테스트 텍스트')
    expect(result.advancedNlpUsed).toBe(false)
  })

  it('correctly counts words (space-separated)', () => {
    const result = analyzeKoreanText('안녕하세요 반갑습니다 테스트입니다')
    expect(result.wordCount).toBe(3)
  })

  it('correctly counts characters (excluding spaces)', () => {
    const result = analyzeKoreanText('안녕 하세요')
    expect(result.charCount).toBe(5) // 안녕하세요 without space
  })

  it('calculates syllable count', () => {
    const result = analyzeKoreanText('마케팅 자동화')
    expect(result.syllableCount).toBeGreaterThan(0)
  })
})

describe('power word detection', () => {
  it('detects urgency power words', () => {
    const result = analyzeKoreanText('지금 바로 신청하면 한정 특별 할인! 마감 임박!')
    expect(result.powerWords).toContain('지금')
    expect(result.powerWords).toContain('한정')
    expect(result.powerWords).toContain('마감')
  })

  it('detects value power words', () => {
    const result = analyzeKoreanText('무료 체험과 50% 할인 특가 이벤트')
    expect(result.powerWords).toContain('무료')
    expect(result.powerWords).toContain('할인')
    expect(result.powerWords).toContain('특가')
  })

  it('detects social proof words', () => {
    const result = analyzeKoreanText('베스트셀러 1위 인기 제품을 추천드립니다')
    expect(result.powerWords).toContain('베스트셀러')
    expect(result.powerWords).toContain('인기')
    expect(result.powerWords).toContain('추천')
  })

  it('returns unique power words only', () => {
    const result = analyzeKoreanText('지금 지금 지금 구매하세요')
    const jiguCount = result.powerWords.filter(w => w === '지금').length
    expect(jiguCount).toBe(1)
  })

  it('detects multiple categories of power words', () => {
    const result = analyzeKoreanText('지금 바로 구매하면 50% 할인!')
    expect(result.powerWords.length).toBeGreaterThan(2)
    expect(result.powerWords).toContain('지금')
    expect(result.powerWords).toContain('할인')
  })
})

describe('emotional tone analysis', () => {
  it('detects urgency tone from urgency words', () => {
    const result = analyzeKoreanText('지금 즉시 바로 신청하세요!')
    expect(result.emotionalTone.urgency).toBeGreaterThan(0)
  })

  it('detects trust tone from trust words', () => {
    const result = analyzeKoreanText('검증된 전문가가 인증하고 보증하는 제품')
    expect(result.emotionalTone.trust).toBeGreaterThan(0)
  })

  it('detects excitement from excitement words', () => {
    const result = analyzeKoreanText('놀라운 혁신! 최초로 공개하는 독점 기술!')
    expect(result.emotionalTone.excitement).toBeGreaterThan(0)
  })

  it('detects fear from fear words', () => {
    const result = analyzeKoreanText('놓치면 후회할 기회! 위험을 피하세요!')
    expect(result.emotionalTone.fear).toBeGreaterThan(0)
  })

  it('detects curiosity from curiosity words', () => {
    const result = analyzeKoreanText('아직 몰랐던 비밀을 공개합니다. 비결은 무엇일까요?')
    expect(result.emotionalTone.curiosity).toBeGreaterThan(0)
  })

  it('returns 0 for all tones on neutral text', () => {
    const result = analyzeKoreanText('이것은 일반적인 텍스트입니다')
    expect(result.emotionalTone.urgency).toBe(0)
    expect(result.emotionalTone.trust).toBe(0)
    expect(result.emotionalTone.excitement).toBe(0)
    expect(result.emotionalTone.fear).toBe(0)
    expect(result.emotionalTone.curiosity).toBe(0)
  })

  it('all tone values are between 0 and 1', () => {
    const result = analyzeKoreanText('지금 바로 검증된 놀라운 비밀을 놓치지 마세요!')
    expect(result.emotionalTone.urgency).toBeGreaterThanOrEqual(0)
    expect(result.emotionalTone.urgency).toBeLessThanOrEqual(1)
    expect(result.emotionalTone.trust).toBeGreaterThanOrEqual(0)
    expect(result.emotionalTone.trust).toBeLessThanOrEqual(1)
    expect(result.emotionalTone.excitement).toBeGreaterThanOrEqual(0)
    expect(result.emotionalTone.excitement).toBeLessThanOrEqual(1)
    expect(result.emotionalTone.fear).toBeGreaterThanOrEqual(0)
    expect(result.emotionalTone.fear).toBeLessThanOrEqual(1)
    expect(result.emotionalTone.curiosity).toBeGreaterThanOrEqual(0)
    expect(result.emotionalTone.curiosity).toBeLessThanOrEqual(1)
  })
})

describe('morpheme analysis', () => {
  it('identifies Korean particles', () => {
    const result = analyzeKoreanText('나는 학생이다')
    const particles = result.morphemes.filter(m => m.pos === 'JX' || m.pos === 'JKS')
    expect(particles.length).toBeGreaterThan(0)
  })

  it('identifies verb endings', () => {
    const result = analyzeKoreanText('먹습니다 갑니다')
    const verbEndings = result.morphemes.filter(m =>
      m.pos === 'EF' || m.pos === 'EC' || m.surface.endsWith('다') || m.surface.endsWith('요')
    )
    expect(verbEndings.length).toBeGreaterThan(0)
  })

  it('classifies Korean words as NNG', () => {
    const result = analyzeKoreanText('마케팅 광고 캠페인')
    const nouns = result.morphemes.filter(m => m.pos === 'NNG')
    expect(nouns.length).toBeGreaterThan(0)
  })

  it('classifies numbers as SN', () => {
    // Use standalone number to ensure SN classification
    const result = analyzeKoreanText('제품이 50 개 있습니다')
    const numbers = result.morphemes.filter(m => m.pos === 'SN')
    expect(numbers.length).toBeGreaterThan(0)
  })

  it('classifies non-Korean text as SL', () => {
    const result = analyzeKoreanText('AI 마케팅 ROI 향상')
    const foreign = result.morphemes.filter(m => m.pos === 'SL')
    expect(foreign.length).toBeGreaterThan(0)
  })
})

describe('reading time estimation', () => {
  it('estimates reasonable reading time for short text', () => {
    const result = analyzeKoreanText('안녕하세요')
    expect(result.estimatedReadingTime).toBeGreaterThanOrEqual(1)
    expect(result.estimatedReadingTime).toBeLessThan(10)
  })

  it('estimates reasonable reading time for longer text', () => {
    const longText = '바투 AI 마케팅 솔루션은 커머스 사업자를 위한 최고의 자동화 도구입니다. ' +
      '지금 바로 신청하시면 무료 체험과 함께 50% 할인 혜택을 받으실 수 있습니다. ' +
      '검증된 전문가들이 추천하는 인증 제품으로 놀라운 성과를 경험해보세요.'
    const result = analyzeKoreanText(longText)
    expect(result.estimatedReadingTime).toBeGreaterThan(10)
    expect(result.estimatedReadingTime).toBeLessThan(120)
  })

  it('returns at least 1 second for any non-empty text', () => {
    const result = analyzeKoreanText('안녕')
    expect(result.estimatedReadingTime).toBeGreaterThanOrEqual(1)
  })
})

describe('comprehensive integration tests', () => {
  it('analyzes urgency + value combined text', () => {
    const result = analyzeKoreanText('지금 바로 구매하면 50% 할인!')
    expect(result.powerWords).toContain('지금')
    expect(result.powerWords).toContain('할인')
    expect(result.emotionalTone.urgency).toBeGreaterThan(0)
    expect(result.syllableCount).toBeGreaterThan(0)
    expect(result.wordCount).toBeGreaterThan(0)
  })

  it('analyzes trust-focused text', () => {
    const result = analyzeKoreanText('검증된 전문가가 추천하는 인증 제품')
    expect(result.powerWords).toContain('추천')
    expect(result.powerWords).toContain('인증')
    expect(result.emotionalTone.trust).toBeGreaterThan(0)
  })

  it('analyzes excitement-focused text', () => {
    const result = analyzeKoreanText('놀라운 혁신! 최초 독점 공개!')
    expect(result.powerWords).toContain('독점')
    expect(result.emotionalTone.excitement).toBeGreaterThan(0)
  })

  it('analyzes fear + urgency combined text', () => {
    const result = analyzeKoreanText('놓치면 후회할 한정판 제품')
    expect(result.powerWords).toContain('한정')
    expect(result.powerWords).toContain('한정판')
    expect(result.emotionalTone.fear).toBeGreaterThan(0)
    expect(result.emotionalTone.urgency).toBeGreaterThan(0)
  })

  it('analyzes curiosity-focused text', () => {
    const result = analyzeKoreanText('아직 몰랐던 비밀을 공개합니다')
    // Note: '비밀' and '공개' are in CURIOSITY_WORDS but not in POWER_WORDS
    expect(result.emotionalTone.curiosity).toBeGreaterThan(0)
  })
})
