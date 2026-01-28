import { Zap, BarChart3, FileText, Shield, type LucideIcon } from 'lucide-react'

export interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

export const FEATURES: Feature[] = [
  {
    icon: Zap,
    title: 'AI 캠페인 자동 세팅',
    description:
      '비즈니스 정보만 입력하면 AI가 최적의 Meta 광고 캠페인을 자동으로 구성합니다.',
  },
  {
    icon: BarChart3,
    title: '실시간 KPI 대시보드',
    description:
      'ROAS, CTR, 전환율 등 핵심 지표를 한눈에 확인하고 광고 성과를 추적하세요.',
  },
  {
    icon: FileText,
    title: 'AI 주간 보고서',
    description:
      '광고 성과를 분석한 인사이트와 개선 제안을 매주 자동으로 받아보세요.',
  },
  {
    icon: Shield,
    title: 'Meta 공식 연동',
    description:
      'Meta Business API와 안전하게 연동하여 광고 계정을 직접 관리합니다.',
  },
]
