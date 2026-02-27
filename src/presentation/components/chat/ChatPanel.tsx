'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useKeyboardNavigation } from '@/presentation/hooks/useKeyboardNavigation'
import { Bot, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/presentation/stores/uiStore'
import { useAgentChat } from '@/presentation/hooks/useAgentChat'
import { useAlerts } from '@/presentation/hooks/useAlerts'
import { ChatHeader } from './ChatHeader'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { SuggestedQuestions } from './SuggestedQuestions'
import { ConfirmationCard } from './ConfirmationCard'
import { DataCard } from './DataCard'
import { ChatMessageFeedback } from './ChatMessageFeedback'
import { AlertBanner } from './AlertBanner'
import { GuideQuestionCard } from './GuideQuestionCard'
import { GuideRecommendationCard } from './GuideRecommendationCard'
import { usePathname, useRouter } from 'next/navigation'
import { useCampaignStore } from '@/presentation/stores/campaignStore'

export function ChatPanel() {
  const { isChatPanelOpen, closeChatPanel, activeConversationId } = useUIStore()
  const { messages, isLoading, error, sendMessage, confirmAction, cancelAction, clearMessages } =
    useAgentChat(activeConversationId ?? undefined)
  const { alerts, dismissAlert } = useAlerts()
  const router = useRouter()
  const pathname = usePathname()
  const { setGuideRecommendation } = useCampaignStore()

  const { dashboardInsights } = useUIStore()

  const contextCopy = useMemo(() => {
    if (pathname?.includes('/reports')) {
      return {
        title: '보고서 AI 어시스턴트',
        description: '리포트 핵심 요약, 이상 징후 해석, 다음 액션 제안을 빠르게 받아보세요.',
        suggestions: [
          '이번 보고서 핵심 포인트 3가지만 요약해줘',
          '성과가 급감한 지표 원인부터 알려줘',
          '다음 주 개선 액션 플랜을 만들어줘',
        ],
      }
    }

    if (pathname?.includes('/dashboard')) {
      return {
        title: '대시보드 AI 어시스턴트',
        description: '실시간 KPI를 바탕으로 성과 해석과 우선순위 액션을 제안해드려요.',
        suggestions: [
          '오늘 ROAS 변동 원인과 대응안을 알려줘',
          '지출 대비 전환 효율이 낮은 캠페인 찾아줘',
          '지금 바로 실행할 최우선 최적화 3개 추천해줘',
        ],
      }
    }

    if (pathname?.includes('/campaigns')) {
      return {
        title: '캠페인 AI 어시스턴트',
        description: '캠페인 생성, 예산 배분, 타겟 전략까지 상황에 맞게 도와드려요.',
        suggestions: [
          '이번 주 캠페인 성과 분석해줘',
          '예산을 어떻게 재분배하면 좋을까?',
          '새 전환 캠페인을 만들어줘',
        ],
      }
    }

    return {
      title: '바투 AI 어시스턴트',
      description: '성과 분석, 예산 최적화, 새 캠페인 생성 등 무엇이든 물어보세요.',
      suggestions: [
        '현재 성과에서 가장 먼저 개선할 포인트 알려줘',
        '효율이 낮은 캠페인 정리 기준을 제안해줘',
        '이번 주 목표 대비 액션 플랜을 만들어줘',
      ],
    }
  }, [pathname])

  // AI 가이드 질문 응답 처리
  const handleGuideAnswer = (option: { value: string; label: string }) => {
    sendMessage(option.label)
  }

  // AI 가이드 추천 수락
  const handleAcceptRecommendation = (recommendation: {
    formData: { objective: string; dailyBudget: number; campaignMode: 'ADVANTAGE_PLUS' | 'MANUAL' }
    reasoning: string
    experienceLevel: string
  }) => {
    setGuideRecommendation({
      formData: recommendation.formData,
      context: recommendation.reasoning,
      timestamp: Date.now(),
    })
    closeChatPanel()
    router.push('/campaigns/new')
  }

  // 직접 설정 선택
  const handleManualCreate = () => {
    closeChatPanel()
    router.push('/campaigns/new')
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLElement>(null)

  // 키보드 네비게이션 (ArrowUp/Down: 메시지 간 이동, Escape: 입력창으로)
  useKeyboardNavigation(messagesContainerRef, chatInputRef)

  // 메시지가 추가되면 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleNewChat = () => {
    clearMessages()
  }

  const handleSendMessage = async (message: string) => {
    await sendMessage(message)
  }

  // 마지막 메시지의 추천 질문
  const lastMessage = messages[messages.length - 1]
  const suggestedQuestions = lastMessage?.suggestedQuestions

  return (
    <>
      {/* Overlay for mobile */}
      {isChatPanelOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={closeChatPanel}
        />
      )}

      {/* Chat Panel */}
      <aside
        data-testid="chat-panel"
        className={cn(
          'fixed right-0 top-0 h-full z-50 flex flex-col',
          'w-full sm:w-[400px] md:w-[420px]',
          'bg-background border-l border-border shadow-2xl',
          'transition-transform duration-300 ease-in-out',
          isChatPanelOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <ChatHeader onNewChat={handleNewChat} onClose={closeChatPanel} />

        {/* Alerts */}
        {alerts.length > 0 && (
          <AlertBanner alerts={alerts} onDismiss={dismissAlert} onAnalyze={handleSendMessage} />
        )}

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          data-testid="chat-messages-container"
          role="log"
          aria-live="polite"
          aria-label="채팅 메시지 목록"
          className="flex-1 overflow-y-auto"
        >
          {messages.length === 0 ? (
            <EmptyState
              title={contextCopy.title}
              description={contextCopy.description}
              suggestions={contextCopy.suggestions}
              insights={dashboardInsights}
              onSuggestion={handleSendMessage}
            />
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id}>
                  {/* Message Text */}
                  <ChatMessage
                    role={msg.role}
                    content={msg.content}
                    isStreaming={msg.isStreaming}
                    timestamp={msg.timestamp}
                  />

                  {/* Feedback for assistant messages */}
                  {msg.role === 'assistant' && !msg.isStreaming && msg.content && (
                    <div className="pl-11 pr-4 -mt-1 mb-1">
                      <ChatMessageFeedback messageId={msg.id} />
                    </div>
                  )}

                  {/* Data Cards */}
                  {msg.dataCards?.map((card, i) => (
                    <DataCard
                      key={`${msg.id}-card-${i}`}
                      cardType={card.cardType}
                      data={card.data}
                    />
                  ))}

                  {/* Confirmation Card */}
                  {msg.confirmationCard && (
                    <ConfirmationCard
                      actionId={msg.confirmationCard.actionId}
                      toolName={msg.confirmationCard.toolName}
                      summary={msg.confirmationCard.summary}
                      details={msg.confirmationCard.details}
                      warnings={msg.confirmationCard.warnings}
                      expiresAt={msg.confirmationCard.expiresAt}
                      onConfirm={confirmAction}
                      onCancel={cancelAction}
                    />
                  )}

                  {/* Guide Question Card */}
                  {msg.guideQuestion && (
                    <GuideQuestionCard
                      questionId={msg.guideQuestion.questionId}
                      question={msg.guideQuestion.question}
                      options={msg.guideQuestion.options}
                      progress={msg.guideQuestion.progress}
                      onAnswer={handleGuideAnswer}
                      isAnswered={msg.guideQuestion.answered}
                      selectedValue={msg.guideQuestion.selectedValue}
                    />
                  )}

                  {/* Guide Recommendation Card */}
                  {msg.guideRecommendation && (
                    <GuideRecommendationCard
                      recommendation={msg.guideRecommendation}
                      onAccept={() => handleAcceptRecommendation(msg.guideRecommendation!)}
                      onManual={handleManualCreate}
                    />
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 text-center">
            <span className="text-xs text-destructive">{error}</span>
          </div>
        )}

        {/* Suggested Questions */}
        {suggestedQuestions && !isLoading && (
          <SuggestedQuestions
            questions={suggestedQuestions}
            onSelect={handleSendMessage}
            className="border-t"
          />
        )}

        {/* Input */}
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </aside>
    </>
  )
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({
  title,
  description,
  suggestions,
  insights,
  onSuggestion,
}: {
  title: string
  description: string
  suggestions: string[]
  insights?: import('@/presentation/stores/uiStore').DashboardInsightSummary[]
  onSuggestion: (msg: string) => void
}) {
  // 인사이트 기반 동적 제안 생성
  const insightSuggestions = insights?.length
    ? insights.slice(0, 2).map((insight) => {
        if (insight.type === 'warning') {
          return `${insight.title} 원인을 분석해줘`
        }
        if (insight.type === 'opportunity') {
          return `${insight.title} 활용 방법을 알려줘`
        }
        return `${insight.title}에 대해 자세히 알려줘`
      })
    : []

  const finalSuggestions = insightSuggestions.length > 0
    ? [...insightSuggestions, suggestions[2] ?? suggestions[0]]
    : suggestions

  const insightIconMap = {
    warning: AlertTriangle,
    opportunity: TrendingUp,
    tip: Lightbulb,
    success: TrendingUp,
  }

  const insightColorMap = {
    warning: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300',
    opportunity: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300',
    tip: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-300',
    success: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300',
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Bot className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-5 max-w-[280px]">{description}</p>

      {/* AI 인사이트 알림 카드 */}
      {insights && insights.length > 0 && (
        <div className="w-full space-y-2 mb-4">
          {insights.slice(0, 2).map((insight, index) => {
            const Icon = insightIconMap[insight.type]
            return (
              <button
                key={index}
                onClick={() => onSuggestion(
                  insight.type === 'warning'
                    ? `${insight.title} 원인을 분석해줘`
                    : `${insight.title}에 대해 자세히 알려줘`
                )}
                className={cn(
                  'w-full text-left rounded-xl px-4 py-3 border transition-all',
                  'hover:shadow-sm hover:scale-[1.01]',
                  insightColorMap[insight.type]
                )}
              >
                <div className="flex items-start gap-2.5">
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-tight">{insight.title}</p>
                    <p className="text-[11px] opacity-80 mt-0.5 line-clamp-2">{insight.description}</p>
                    {(insight.currentValue !== undefined || insight.changePercent !== undefined) && (
                      <div className="flex items-center gap-2 mt-1.5">
                        {insight.currentValue !== undefined && (
                          <span className="text-xs font-bold">
                            {insight.metric === 'ctr' || insight.metric === 'cvr'
                              ? `${insight.currentValue.toFixed(2)}%`
                              : insight.metric === 'roas'
                                ? `${insight.currentValue.toFixed(2)}x`
                                : insight.metric === 'spend' || insight.metric === 'revenue' || insight.metric === 'cpa'
                                  ? `${insight.currentValue.toLocaleString()}원`
                                  : insight.currentValue.toLocaleString()}
                          </span>
                        )}
                        {insight.changePercent !== undefined && (
                          <span className={cn(
                            'text-[11px] font-medium',
                            insight.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {insight.changePercent >= 0 ? '↑' : '↓'}{Math.abs(insight.changePercent).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-[11px] font-medium mt-1.5 opacity-70">
                      클릭하여 원인 분석 →
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* 제안 질문 */}
      <div className="w-full space-y-2">
        {finalSuggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestion(suggestion)}
            className={cn(
              'w-full text-left rounded-xl px-4 py-3 text-xs',
              'border border-border bg-background',
              'hover:bg-primary/5 hover:border-primary/30',
              'transition-colors duration-200'
            )}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
