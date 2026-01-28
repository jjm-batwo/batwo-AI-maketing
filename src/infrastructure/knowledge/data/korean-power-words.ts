export const KOREAN_POWER_WORDS = {
  urgency: ['즉시', '지금', '바로', '오늘만', '마감임박', '한정', '서둘러', '긴급', '빨리', '당장'],
  free: ['무료', '공짜', '0원', '무상', '증정', '사은품', '덤', '추가'],
  trust: ['보장', '검증', '인증', '공식', '정품', '특허', '수상', '안전', '믿을 수 있는'],
  exclusivity: ['독점', '단독', '최초', '프리미엄', 'VIP', '한정판', '특별', '전용', '오직'],
  emotion: ['놀라운', '환상적', '꿈의', '기적', '감동', '최고의', '완벽한', '극적인', '경이로운'],
  result: ['확실한', '즉각적', '극대화', '효과', '성과', '달성', '입증된', '검증된'],
  social: ['인기', '베스트', '화제', '추천', '1위', '품절임박', '핫딜', '트렌드', '대세'],
  savings: ['할인', '세일', '특가', '파격', '최저가', '반값', '초특가', '대폭', '합리적'],
} as const

export type PowerWordCategory = keyof typeof KOREAN_POWER_WORDS

export const ALL_POWER_WORDS: string[] = Object.values(KOREAN_POWER_WORDS).flat()

// Korean text utility: count Korean characters (Hangul syllables U+AC00-U+D7AF)
export function countKoreanCharacters(text: string): number {
  return Array.from(text).filter(ch => {
    const code = ch.charCodeAt(0)
    return code >= 0xAC00 && code <= 0xD7AF
  }).length
}

// Count "words" in Korean text using character-based approach
// Korean doesn't reliably space-delimit words, so we count character groups
export function countKoreanWords(text: string): number {
  // Split by whitespace and filter empty strings
  return text.split(/\s+/).filter(s => s.length > 0).length
}

// Find power words present in text
export function findPowerWords(text: string): { word: string; category: PowerWordCategory }[] {
  const found: { word: string; category: PowerWordCategory }[] = []
  for (const [category, words] of Object.entries(KOREAN_POWER_WORDS)) {
    for (const word of words) {
      if (text.includes(word)) {
        found.push({ word, category: category as PowerWordCategory })
      }
    }
  }
  return found
}

// Calculate power word density (power words per total word count)
export function calculatePowerWordDensity(text: string): number {
  const wordCount = countKoreanWords(text)
  if (wordCount === 0) return 0
  const powerWordCount = findPowerWords(text).length
  return powerWordCount / wordCount
}
