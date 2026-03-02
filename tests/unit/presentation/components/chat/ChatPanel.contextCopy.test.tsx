import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { ChatPanel } from '@presentation/components/chat/ChatPanel'

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})

// 외부 의존성 공통 모킹 (dashboardInsights를 동적으로 변경 가능)
const mockDashboardInsights = vi.fn<() => undefined | Array<{ type: string; title: string; description: string }>>()
vi.mock('@/presentation/stores/uiStore', () => ({
  useUIStore: () => ({
    isChatPanelOpen: true,
    closeChatPanel: vi.fn(),
    activeConversationId: null,
    dashboardInsights: mockDashboardInsights(),
  }),
}))

vi.mock('@/presentation/hooks/useAgentChat', () => ({
  useAgentChat: () => ({
    messages: [], // EmptyState가 렌더링되도록 빈 배열
    isLoading: false,
    error: null,
    sendMessage: vi.fn(),
    confirmAction: vi.fn(),
    cancelAction: vi.fn(),
    clearMessages: vi.fn(),
  }),
}))

vi.mock('@/presentation/hooks/useAlerts', () => ({
  useAlerts: () => ({
    alerts: [],
    dismissAlert: vi.fn(),
  }),
}))

vi.mock('@/presentation/stores/campaignStore', () => ({
  useCampaignStore: () => ({
    setGuideRecommendation: vi.fn(),
  }),
}))

// usePathname을 동적으로 변경할 수 있도록 모킹
const mockPathname = vi.fn<() => string>()
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: vi.fn() }),
}))

describe('ChatPanel contextCopy — 탭별 제안 메시지', () => {
  beforeEach(() => {
    mockPathname.mockReset()
    mockDashboardInsights.mockReturnValue(undefined)
  })

  it('should_show_dashboard_title_when_pathname_includes_dashboard', () => {
    mockPathname.mockReturnValue('/dashboard')
    render(<ChatPanel />)
    expect(screen.getByText('대시보드 AI 어시스턴트')).toBeInTheDocument()
  })

  it('should_show_campaigns_title_when_pathname_includes_campaigns', () => {
    mockPathname.mockReturnValue('/campaigns')
    render(<ChatPanel />)
    expect(screen.getByText('캠페인 AI 어시스턴트')).toBeInTheDocument()
  })

  it('should_show_reports_title_when_pathname_includes_reports', () => {
    mockPathname.mockReturnValue('/reports')
    render(<ChatPanel />)
    expect(screen.getByText('보고서 AI 어시스턴트')).toBeInTheDocument()
  })

  it('should_show_competitors_title_when_pathname_includes_competitors', () => {
    mockPathname.mockReturnValue('/competitors')
    render(<ChatPanel />)
    expect(screen.getByText('경쟁사분석 AI 어시스턴트')).toBeInTheDocument()
  })

  it('should_show_portfolio_title_when_pathname_includes_portfolio', () => {
    mockPathname.mockReturnValue('/portfolio')
    render(<ChatPanel />)
    expect(screen.getByText('포트폴리오 AI 어시스턴트')).toBeInTheDocument()
  })

  it('should_show_3_suggestions_for_each_tab', () => {
    const paths = ['/dashboard', '/campaigns', '/reports', '/competitors', '/portfolio']

    for (const path of paths) {
      mockPathname.mockReturnValue(path)
      const { unmount } = render(<ChatPanel />)

      // EmptyState의 제안 질문 버튼은 w-full text-left rounded-xl 클래스의 button
      // 최소 3개의 제안 버튼이 있어야 함
      const suggestionButtons = screen.getAllByRole('button')
      // ChatHeader에도 버튼이 있으므로 최소 3개 이상 확인 (제안 3개 + 헤더 버튼들)
      expect(suggestionButtons.length).toBeGreaterThanOrEqual(3)

      unmount()
    }
  })

  it('should_show_competitors_specific_suggestions', () => {
    mockPathname.mockReturnValue('/competitors')
    render(<ChatPanel />)

    // 경쟁사분석 관련 타이틀이 렌더링되어야 함
    expect(screen.getByText('경쟁사분석 AI 어시스턴트')).toBeInTheDocument()
    // 경쟁사분석 관련 제안 질문이 렌더링되어야 함
    expect(screen.getByText('주요 경쟁사 광고비 변화 추이를 알려줘')).toBeInTheDocument()
  })

  it('should_show_portfolio_specific_suggestions', () => {
    mockPathname.mockReturnValue('/portfolio')
    render(<ChatPanel />)

    // 포트폴리오 관련 타이틀이 렌더링되어야 함
    expect(screen.getByText('포트폴리오 AI 어시스턴트')).toBeInTheDocument()
    // 포트폴리오 관련 제안 질문이 렌더링되어야 함
    expect(screen.getByText('현재 포트폴리오 채널별 성과를 분석해줘')).toBeInTheDocument()
  })

  it('should_show_generic_fallback_when_pathname_is_unknown', () => {
    mockPathname.mockReturnValue('/unknown-page')
    render(<ChatPanel />)
    expect(screen.getByText('바투 AI 어시스턴트')).toBeInTheDocument()
  })

  it('should_not_override_tab_suggestions_with_dashboard_insights_on_non_dashboard_tabs', () => {
    // dashboardInsights가 존재하더라도 /campaigns 등 비대시보드 탭에서는 탭별 제안이 유지되어야 함
    mockDashboardInsights.mockReturnValue([
      { type: 'warning', title: 'CTR 급락', description: '어제 대비 CTR 20% 하락' },
      { type: 'opportunity', title: 'CPA 개선 기회', description: 'CPA 최적화 가능' },
    ])

    const nonDashboardPaths = ['/campaigns', '/reports', '/competitors', '/portfolio']

    for (const path of nonDashboardPaths) {
      mockPathname.mockReturnValue(path)
      const { unmount } = render(<ChatPanel />)

      // insight 기반 제안("CTR 급락 원인을 분석해줘")이 렌더링되지 않아야 함
      expect(screen.queryByText('CTR 급락 원인을 분석해줘')).not.toBeInTheDocument()
      expect(screen.queryByText('CPA 개선 기회 활용 방법을 알려줘')).not.toBeInTheDocument()

      unmount()
    }
  })

  it('should_show_insight_suggestions_on_dashboard_tab_when_insights_exist', () => {
    mockDashboardInsights.mockReturnValue([
      { type: 'warning', title: 'CTR 급락', description: '어제 대비 CTR 20% 하락' },
      { type: 'opportunity', title: 'CPA 개선 기회', description: 'CPA 최적화 가능' },
    ])
    mockPathname.mockReturnValue('/dashboard')
    render(<ChatPanel />)

    // /dashboard에서는 insight 기반 제안이 렌더링되어야 함
    expect(screen.getByText('CTR 급락 원인을 분석해줘')).toBeInTheDocument()
    expect(screen.getByText('CPA 개선 기회 활용 방법을 알려줘')).toBeInTheDocument()
  })
})
