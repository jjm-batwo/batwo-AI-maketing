/**
 * DashboardWidget 밸류 오브젝트
 * 커스텀 대시보드의 위젯 타입, 위치, 설정을 정의합니다.
 */

export type WidgetType =
  | 'kpi_card' // 단일 KPI 메트릭
  | 'kpi_chart' // 시계열 차트
  | 'funnel' // 전환 퍼널
  | 'benchmark' // 벤치마크 카드
  | 'ai_insights' // AI 인사이트
  | 'campaign_table' // 캠페인 요약 테이블
  | 'donut_chart' // 상태 분포
  | 'savings' // 절감액
  | 'anomaly_alert' // 이상 탐지

export const WIDGET_TYPE_LABELS: Record<WidgetType, string> = {
  kpi_card: 'KPI 카드',
  kpi_chart: 'KPI 차트',
  funnel: '전환 퍼널',
  benchmark: '벤치마크',
  ai_insights: 'AI 인사이트',
  campaign_table: '캠페인 테이블',
  donut_chart: '상태 분포',
  savings: '절감액',
  anomaly_alert: '이상 탐지',
}

export const ALL_WIDGET_TYPES: WidgetType[] = [
  'kpi_card',
  'kpi_chart',
  'funnel',
  'benchmark',
  'ai_insights',
  'campaign_table',
  'donut_chart',
  'savings',
  'anomaly_alert',
]

export interface WidgetPosition {
  x: number // grid column (0-based)
  y: number // grid row (0-based)
  w: number // width in grid units (1-12)
  h: number // height in grid units
}

export interface WidgetConfig {
  metric?: string // kpi_card: 'roas', 'ctr', etc.
  period?: string // '7d', '30d', '90d'
  campaignId?: string // 특정 캠페인 필터
  chartType?: string // 'line', 'area', 'bar'
  title?: string // 커스텀 타이틀
}

export interface DashboardWidget {
  id: string
  type: WidgetType
  position: WidgetPosition
  config: WidgetConfig
}

/** 위젯 타입별 기본 크기 */
export const WIDGET_DEFAULT_SIZES: Record<WidgetType, { w: number; h: number }> = {
  kpi_card: { w: 3, h: 2 },
  kpi_chart: { w: 8, h: 4 },
  funnel: { w: 6, h: 4 },
  benchmark: { w: 4, h: 3 },
  ai_insights: { w: 4, h: 4 },
  campaign_table: { w: 12, h: 4 },
  donut_chart: { w: 4, h: 3 },
  savings: { w: 4, h: 3 },
  anomaly_alert: { w: 6, h: 3 },
}

/** 위젯 타입별 최소 크기 */
export const WIDGET_MIN_SIZES: Record<WidgetType, { w: number; h: number }> = {
  kpi_card: { w: 2, h: 2 },
  kpi_chart: { w: 4, h: 3 },
  funnel: { w: 4, h: 3 },
  benchmark: { w: 3, h: 2 },
  ai_insights: { w: 3, h: 3 },
  campaign_table: { w: 6, h: 3 },
  donut_chart: { w: 3, h: 2 },
  savings: { w: 3, h: 2 },
  anomaly_alert: { w: 4, h: 2 },
}

export const MAX_WIDGETS = 20

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'w1', type: 'kpi_card', position: { x: 0, y: 0, w: 3, h: 2 }, config: { metric: 'roas' } },
  { id: 'w2', type: 'kpi_card', position: { x: 3, y: 0, w: 3, h: 2 }, config: { metric: 'ctr' } },
  { id: 'w3', type: 'kpi_card', position: { x: 6, y: 0, w: 3, h: 2 }, config: { metric: 'cpa' } },
  { id: 'w4', type: 'kpi_card', position: { x: 9, y: 0, w: 3, h: 2 }, config: { metric: 'spend' } },
  { id: 'w5', type: 'kpi_chart', position: { x: 0, y: 2, w: 8, h: 4 }, config: { period: '30d' } },
  { id: 'w6', type: 'ai_insights', position: { x: 8, y: 2, w: 4, h: 4 }, config: {} },
  { id: 'w7', type: 'campaign_table', position: { x: 0, y: 6, w: 12, h: 4 }, config: {} },
]

/** 미니멀 프리셋 */
export const MINIMAL_PRESET_WIDGETS: DashboardWidget[] = [
  { id: 'w1', type: 'kpi_card', position: { x: 0, y: 0, w: 4, h: 2 }, config: { metric: 'roas' } },
  { id: 'w2', type: 'kpi_card', position: { x: 4, y: 0, w: 4, h: 2 }, config: { metric: 'ctr' } },
  { id: 'w3', type: 'kpi_card', position: { x: 8, y: 0, w: 4, h: 2 }, config: { metric: 'spend' } },
  { id: 'w4', type: 'kpi_chart', position: { x: 0, y: 2, w: 12, h: 4 }, config: { period: '30d' } },
]

/** 분석 중심 프리셋 */
export const ANALYTICS_PRESET_WIDGETS: DashboardWidget[] = [
  { id: 'w1', type: 'kpi_card', position: { x: 0, y: 0, w: 3, h: 2 }, config: { metric: 'roas' } },
  { id: 'w2', type: 'kpi_card', position: { x: 3, y: 0, w: 3, h: 2 }, config: { metric: 'ctr' } },
  { id: 'w3', type: 'kpi_card', position: { x: 6, y: 0, w: 3, h: 2 }, config: { metric: 'cpa' } },
  { id: 'w4', type: 'kpi_card', position: { x: 9, y: 0, w: 3, h: 2 }, config: { metric: 'spend' } },
  { id: 'w5', type: 'kpi_chart', position: { x: 0, y: 2, w: 6, h: 4 }, config: { period: '30d' } },
  { id: 'w6', type: 'funnel', position: { x: 6, y: 2, w: 6, h: 4 }, config: {} },
  { id: 'w7', type: 'benchmark', position: { x: 0, y: 6, w: 4, h: 3 }, config: {} },
  { id: 'w8', type: 'donut_chart', position: { x: 4, y: 6, w: 4, h: 3 }, config: {} },
  { id: 'w9', type: 'anomaly_alert', position: { x: 8, y: 6, w: 4, h: 3 }, config: {} },
]

export interface LayoutPreset {
  id: string
  name: string
  description: string
  widgets: DashboardWidget[]
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'default',
    name: '기본 레이아웃',
    description: 'KPI 카드, 차트, AI 인사이트, 캠페인 테이블',
    widgets: DEFAULT_WIDGETS,
  },
  {
    id: 'minimal',
    name: '미니멀',
    description: '핵심 KPI와 차트만 표시',
    widgets: MINIMAL_PRESET_WIDGETS,
  },
  {
    id: 'analytics',
    name: '분석 중심',
    description: '퍼널, 벤치마크, 이상 탐지 등 분석 위젯 포함',
    widgets: ANALYTICS_PRESET_WIDGETS,
  },
]

export function isValidWidgetType(type: string): type is WidgetType {
  return ALL_WIDGET_TYPES.includes(type as WidgetType)
}

export function isValidWidgetPosition(position: WidgetPosition): boolean {
  return (
    position.x >= 0 &&
    position.y >= 0 &&
    position.w >= 1 &&
    position.w <= 12 &&
    position.h >= 1 &&
    position.x + position.w <= 12
  )
}
