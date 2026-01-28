import { DollarSign, TrendingUp, BarChart3, Target, FileText, type LucideIcon } from 'lucide-react'

export type DashboardTab = 'dashboard' | 'campaign' | 'report'

export interface KPIData {
  label: string
  value: string
  trend: string
  icon: LucideIcon
  primary?: boolean
}

export interface DashboardData {
  title: string
  subtitle: string
  kpis: KPIData[]
  chart: number[]
  insight: {
    title: string
    content: string
  }
}

export const DASHBOARD_DATA: Record<DashboardTab, DashboardData> = {
  dashboard: {
    title: '광고 캠페인 성과',
    subtitle: '실시간 데이터 업데이트 중',
    kpis: [
      { label: '총 광고비', value: '₩1.2M', trend: '↑ 12%', icon: DollarSign },
      { label: '매출 발생', value: '₩4.3M', trend: '↑ 24%', icon: TrendingUp },
      { label: 'ROAS', value: '358%', trend: 'Top 5%', icon: BarChart3, primary: true },
    ],
    chart: [35, 55, 40, 70, 50, 85, 60],
    insight: {
      title: 'AI 최적화 제안',
      content: '20대 여성 타겟의 전환율이 상승세입니다. 예산을 15% 증액하면 ROAS가 4.2x로 개선될 것으로 예측됩니다.',
    },
  },
  campaign: {
    title: '활성 캠페인 관리',
    subtitle: '12개 캠페인 운영 중',
    kpis: [
      { label: '활성 광고', value: '24개', trend: '↑ 2', icon: Target },
      { label: '클릭률(CTR)', value: '4.2%', trend: '↑ 0.8%', icon: TrendingUp },
      { label: 'CPA', value: '₩8,200', trend: '↓ 15%', icon: DollarSign, primary: true },
    ],
    chart: [60, 45, 75, 50, 80, 55, 90],
    insight: {
      title: '캠페인 자동 튜닝',
      content: '성과가 낮은 A그룹 소재를 일시중지하고 성과가 높은 B그룹으로 예산을 자동 재배분했습니다.',
    },
  },
  report: {
    title: '주간 AI 성과 분석',
    subtitle: '2024년 1월 3주차',
    kpis: [
      { label: '광고 효율', value: '우수', trend: 'A+', icon: BarChart3 },
      { label: '전환수', value: '1,240건', trend: '↑ 18%', icon: TrendingUp },
      { label: '예상 매출', value: '₩15.8M', trend: '↑ 3.2M', icon: FileText, primary: true },
    ],
    chart: [40, 60, 50, 80, 70, 90, 85],
    insight: {
      title: '마켓 인사이트',
      content: '최근 경쟁사 광고 노출이 감소했습니다. 지금이 공격적으로 노출을 늘려 시장 점유율을 확보할 최적기입니다.',
    },
  },
}

export const TAB_CONFIG = [
  { id: 'dashboard' as const, label: '대시보드', icon: BarChart3 },
  { id: 'campaign' as const, label: '캠페인 관리', icon: Target },
  { id: 'report' as const, label: 'AI 보고서', icon: FileText },
]
