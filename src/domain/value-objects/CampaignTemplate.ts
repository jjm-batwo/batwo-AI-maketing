import { CampaignObjective } from './CampaignObjective'
import { TargetAudience } from '../entities/Campaign'

export type CampaignTemplateId = 'traffic' | 'conversions' | 'awareness' | 'engagement' | 'leads'

export interface CampaignTemplate {
  id: CampaignTemplateId
  name: string
  description: string
  objective: CampaignObjective
  suggestedDailyBudget: number // KRW
  suggestedTargetAudience: Partial<TargetAudience>
  icon: string
  category: string
  tips: string[]
}

export const CAMPAIGN_TEMPLATES: Record<CampaignTemplateId, CampaignTemplate> = {
  traffic: {
    id: 'traffic',
    name: '트래픽 늘리기',
    description: '웹사이트나 앱으로 더 많은 방문자를 유도합니다',
    objective: CampaignObjective.TRAFFIC,
    suggestedDailyBudget: 30000, // 3만원
    suggestedTargetAudience: {
      ageMin: 18,
      ageMax: 55,
      genders: ['all'],
    },
    icon: 'MousePointerClick',
    category: '트래픽',
    tips: [
      '랜딩 페이지 로딩 속도를 최적화하세요',
      'CTA 버튼을 눈에 띄게 배치하세요',
      'A/B 테스트로 최적의 광고 소재를 찾으세요',
    ],
  },
  conversions: {
    id: 'conversions',
    name: '전환 극대화',
    description: '구매, 가입 등 원하는 행동을 유도합니다',
    objective: CampaignObjective.CONVERSIONS,
    suggestedDailyBudget: 50000, // 5만원
    suggestedTargetAudience: {
      ageMin: 25,
      ageMax: 45,
      genders: ['all'],
    },
    icon: 'ShoppingCart',
    category: '전환',
    tips: [
      '전환 픽셀을 정확히 설치하세요',
      '리타겟팅 오디언스를 활용하세요',
      '전환 창구를 단순화하세요',
    ],
  },
  awareness: {
    id: 'awareness',
    name: '브랜드 인지도',
    description: '브랜드를 더 많은 사람들에게 알립니다',
    objective: CampaignObjective.AWARENESS,
    suggestedDailyBudget: 20000, // 2만원
    suggestedTargetAudience: {
      ageMin: 18,
      ageMax: 65,
      genders: ['all'],
    },
    icon: 'Megaphone',
    category: '인지도',
    tips: [
      '기억에 남는 비주얼을 사용하세요',
      '일관된 브랜드 메시지를 전달하세요',
      '동영상 광고가 효과적입니다',
    ],
  },
  engagement: {
    id: 'engagement',
    name: '참여 유도',
    description: '게시물 반응, 댓글, 공유를 늘립니다',
    objective: CampaignObjective.TRAFFIC, // Meta maps engagement to traffic objective
    suggestedDailyBudget: 25000, // 2.5만원
    suggestedTargetAudience: {
      ageMin: 18,
      ageMax: 45,
      genders: ['all'],
    },
    icon: 'Heart',
    category: '트래픽',
    tips: [
      '질문을 던져 대화를 유도하세요',
      '감정을 자극하는 콘텐츠가 효과적입니다',
      '댓글에 빠르게 응답하세요',
    ],
  },
  leads: {
    id: 'leads',
    name: '리드 수집',
    description: '잠재고객 정보를 수집합니다',
    objective: CampaignObjective.CONVERSIONS,
    suggestedDailyBudget: 40000, // 4만원
    suggestedTargetAudience: {
      ageMin: 25,
      ageMax: 55,
      genders: ['all'],
    },
    icon: 'UserPlus',
    category: '전환',
    tips: [
      '입력 필드를 최소화하세요',
      '리드 마그넷(무료 자료)을 제공하세요',
      '개인정보 보호 정책을 명시하세요',
    ],
  },
}

export function getCampaignTemplate(
  id: CampaignTemplateId
): CampaignTemplate | undefined {
  return CAMPAIGN_TEMPLATES[id]
}

export function getAllCampaignTemplates(): CampaignTemplate[] {
  return Object.values(CAMPAIGN_TEMPLATES)
}
