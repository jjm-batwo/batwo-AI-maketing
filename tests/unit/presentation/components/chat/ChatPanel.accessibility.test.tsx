import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { ChatPanel } from '@presentation/components/chat/ChatPanel'

beforeAll(() => {
  // jsdom에서 scrollIntoView 미구현 — mock으로 대체
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})

// 외부 의존성 모킹
vi.mock('@/presentation/stores/uiStore', () => ({
  useUIStore: () => ({
    isChatPanelOpen: true,
    closeChatPanel: vi.fn(),
    activeConversationId: null,
  }),
}))

vi.mock('@/presentation/hooks/useAgentChat', () => ({
  useAgentChat: () => ({
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: '안녕하세요',
        timestamp: new Date(),
        isStreaming: false,
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: '안녕하세요! 무엇을 도와드릴까요?',
        timestamp: new Date(),
        isStreaming: false,
      },
    ],
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

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/presentation/stores/campaignStore', () => ({
  useCampaignStore: () => ({
    setGuideRecommendation: vi.fn(),
  }),
}))

describe('ChatPanel 접근성', () => {
  it('should_have_role_log_on_messages_container', () => {
    render(<ChatPanel />)
    const container = screen.getByTestId('chat-messages-container')
    expect(container).toHaveAttribute('role', 'log')
  })

  it('should_have_aria_live_polite_on_messages_container', () => {
    render(<ChatPanel />)
    const container = screen.getByTestId('chat-messages-container')
    expect(container).toHaveAttribute('aria-live', 'polite')
  })

  it('should_have_aria_label_on_messages_container', () => {
    render(<ChatPanel />)
    const container = screen.getByTestId('chat-messages-container')
    expect(container).toHaveAttribute('aria-label', '채팅 메시지 목록')
  })

  it('should_have_role_article_on_each_message', () => {
    render(<ChatPanel />)
    const articles = screen.getAllByRole('article')
    expect(articles.length).toBeGreaterThanOrEqual(2)
  })

  it('should_have_tabIndex_0_on_each_message', () => {
    render(<ChatPanel />)
    const articles = screen.getAllByRole('article')
    articles.forEach((article) => {
      expect(article).toHaveAttribute('tabIndex', '0')
    })
  })

  it('should_have_aria_label_on_each_message', () => {
    render(<ChatPanel />)
    const userMsg = screen.getByRole('article', { name: /사용자 메시지/ })
    const assistantMsg = screen.getByRole('article', { name: /어시스턴트 메시지/ })
    expect(userMsg).toBeInTheDocument()
    expect(assistantMsg).toBeInTheDocument()
  })
})
