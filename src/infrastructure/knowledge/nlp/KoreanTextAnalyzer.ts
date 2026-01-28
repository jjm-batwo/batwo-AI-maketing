/**
 * Korean Text Analyzer
 *
 * Provides Korean language text analysis for marketing content.
 * Uses regex-based morphological analysis as the default approach.
 * Designed to optionally support mecab-ko for enhanced analysis in the future.
 *
 * Phase 3: Korean NLP Enhancement
 */

export interface MorphemeResult {
  /** Original surface form */
  surface: string
  /** Part of speech tag */
  pos: string
  /** Reading (if applicable) */
  reading?: string
}

export interface TextAnalysisResult {
  /** Morpheme analysis results */
  morphemes: MorphemeResult[]
  /** Total syllable count (Korean jamo-based) */
  syllableCount: number
  /** Word count (space-separated) */
  wordCount: number
  /** Character count (excluding spaces) */
  charCount: number
  /** Detected power words */
  powerWords: string[]
  /** Emotional tone indicators */
  emotionalTone: {
    urgency: number    // 0-1
    trust: number      // 0-1
    excitement: number // 0-1
    fear: number       // 0-1
    curiosity: number  // 0-1
  }
  /** Reading time estimate (seconds) */
  estimatedReadingTime: number
  /** Whether advanced NLP was available */
  advancedNlpUsed: boolean
}

// Korean urgency words
const URGENCY_WORDS = [
  '지금', '즉시', '바로', '오늘', '한정', '마감', '서두르', '놓치', '급', '긴급',
  '마지막', '단', '딱', '곧', '빨리', '속', '제한', '종료', '마감임박', '품절임박',
]

// Korean trust words
const TRUST_WORDS = [
  '검증', '인증', '보증', '안전', '신뢰', '전문', '공식', '정품', '보장', '확인',
  '증명', '권위', '추천', '인정', '실증', '과학적', '임상', '특허', '수상', '1위',
]

// Korean excitement words
const EXCITEMENT_WORDS = [
  '놀라운', '혁신', '최초', '특별', '독점', '파격', '대박', '초특가', '무료',
  '혜택', '선물', '보너스', '새로운', '최신', '프리미엄', '럭셔리', '고급', 'VIP',
]

// Korean fear/loss aversion words
const FEAR_WORDS = [
  '놓치', '잃', '위험', '후회', '실패', '손해', '피해', '문제', '걱정', '불안',
  '경고', '주의', '조심', '안되', '못하', '없어', '사라', '소진', '매진',
]

// Korean curiosity words
const CURIOSITY_WORDS = [
  '비밀', '비결', '방법', '이유', '알고', '몰랐', '사실', '진짜', '실제',
  '숨겨진', '알려지지', '처음', '새롭', '발견', '밝혀', '공개', '최초공개',
]

// Korean marketing power words (comprehensive list)
const POWER_WORDS = [
  // Urgency
  '지금', '즉시', '바로', '오늘만', '한정', '마감', '서두르세요', '놓치지',
  // Value
  '무료', '할인', '특가', '세일', '혜택', '보너스', '선물', '적립',
  // Social proof
  '베스트셀러', '인기', '추천', '후기', '리뷰', '만족', '재구매',
  // Exclusivity
  '독점', '한정판', 'VIP', '프리미엄', '특별', '단독',
  // Trust
  '보장', '환불', '교환', '안심', '정품', '공식', '인증',
  // Action
  '시작', '도전', '변화', '성공', '달성', '완성',
]

/**
 * Analyze Korean text and extract marketing-relevant features.
 * Works without any external NLP dependencies.
 */
export function analyzeKoreanText(text: string): TextAnalysisResult {
  const cleanText = text.trim()

  if (!cleanText) {
    return createEmptyResult()
  }

  const morphemes = basicMorphemeAnalysis(cleanText)
  const syllableCount = countKoreanSyllables(cleanText)
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length
  const charCount = cleanText.replace(/\s/g, '').length
  const powerWords = detectPowerWords(cleanText)
  const emotionalTone = analyzeEmotionalTone(cleanText)
  const estimatedReadingTime = estimateReadingTime(syllableCount, wordCount)

  return {
    morphemes,
    syllableCount,
    wordCount,
    charCount,
    powerWords,
    emotionalTone,
    estimatedReadingTime,
    advancedNlpUsed: false,
  }
}

/**
 * Count Korean syllables (based on Unicode Hangul block).
 * Each Hangul character (AC00-D7AF) counts as one syllable.
 */
export function countKoreanSyllables(text: string): number {
  let count = 0
  for (const char of text) {
    const code = char.charCodeAt(0)
    // Hangul Syllables block: U+AC00 to U+D7AF
    if (code >= 0xAC00 && code <= 0xD7AF) {
      count++
    }
    // Hangul Jamo: U+1100 to U+11FF (also count)
    else if (code >= 0x1100 && code <= 0x11FF) {
      count++
    }
  }
  return count
}

/**
 * Basic morpheme analysis using regex patterns.
 * Not as accurate as mecab-ko but provides useful approximations.
 */
function basicMorphemeAnalysis(text: string): MorphemeResult[] {
  const results: MorphemeResult[] = []
  const words = text.split(/\s+/).filter(Boolean)

  for (const word of words) {
    // Simple heuristic: Korean words often end with particles/endings
    const particles = ['은', '는', '이', '가', '을', '를', '에', '에서', '로', '으로', '와', '과', '도', '만', '의', '께', '한테', '에게']

    let matched = false
    for (const particle of particles) {
      if (word.endsWith(particle) && word.length > particle.length) {
        const stem = word.slice(0, -particle.length)
        if (stem.length > 0) {
          results.push({ surface: stem, pos: 'NNG' }) // General noun guess
          results.push({ surface: particle, pos: 'JKS' }) // Particle
          matched = true
          break
        }
      }
    }

    if (!matched) {
      // Check if it looks like a verb/adjective ending
      const verbEndings = ['다', '요', '니다', '습니다', '세요', '해요', '하다', '된다']
      let isVerb = false
      for (const ending of verbEndings) {
        if (word.endsWith(ending) && word.length > ending.length) {
          const stem = word.slice(0, -ending.length)
          if (stem.length > 0) {
            results.push({ surface: stem, pos: 'VV' }) // Verb
            results.push({ surface: ending, pos: 'EF' }) // Ending
            isVerb = true
            break
          }
        }
      }

      if (!isVerb) {
        // Treat as a noun or unclassified
        const isKorean = /[\uAC00-\uD7AF]/.test(word)
        results.push({
          surface: word,
          pos: isKorean ? 'NNG' : (/^[0-9]+$/.test(word) ? 'SN' : 'SL'),
        })
      }
    }
  }

  return results
}

/**
 * Detect power words in the text.
 */
function detectPowerWords(text: string): string[] {
  const found: string[] = []
  const lowerText = text.toLowerCase()

  for (const word of POWER_WORDS) {
    if (lowerText.includes(word)) {
      found.push(word)
    }
  }

  return [...new Set(found)]
}

/**
 * Analyze emotional tone of the text.
 * Returns scores (0-1) for each emotional dimension.
 */
function analyzeEmotionalTone(text: string): TextAnalysisResult['emotionalTone'] {
  const lowerText = text.toLowerCase()

  const countMatches = (words: string[]): number => {
    let count = 0
    for (const word of words) {
      if (lowerText.includes(word)) count++
    }
    return count
  }

  const normalize = (count: number, total: number): number => {
    return Math.min(count / Math.max(total * 0.3, 1), 1)
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length

  return {
    urgency: normalize(countMatches(URGENCY_WORDS), wordCount),
    trust: normalize(countMatches(TRUST_WORDS), wordCount),
    excitement: normalize(countMatches(EXCITEMENT_WORDS), wordCount),
    fear: normalize(countMatches(FEAR_WORDS), wordCount),
    curiosity: normalize(countMatches(CURIOSITY_WORDS), wordCount),
  }
}

/**
 * Estimate reading time in seconds.
 * Korean readers average ~250 syllables per minute.
 */
function estimateReadingTime(syllableCount: number, wordCount: number): number {
  // Korean: ~250 syllables per minute (reading speed)
  // Non-Korean: ~200 words per minute
  const koreanSeconds = (syllableCount / 250) * 60
  const otherSeconds = (wordCount / 200) * 60
  return Math.max(koreanSeconds, otherSeconds, 1)
}

/**
 * Create empty analysis result.
 */
function createEmptyResult(): TextAnalysisResult {
  return {
    morphemes: [],
    syllableCount: 0,
    wordCount: 0,
    charCount: 0,
    powerWords: [],
    emotionalTone: {
      urgency: 0,
      trust: 0,
      excitement: 0,
      fear: 0,
      curiosity: 0,
    },
    estimatedReadingTime: 0,
    advancedNlpUsed: false,
  }
}
