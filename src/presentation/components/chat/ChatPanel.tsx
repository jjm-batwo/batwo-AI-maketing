'use client'

import { useRef, useEffect } from 'react'
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
import { AlertBanner } from './AlertBanner'

export function ChatPanel() {
  const { isChatPanelOpen, closeChatPanel, activeConversationId } = useUIStore()
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    confirmAction,
    cancelAction,
    clearMessages,
  } = useAgentChat(activeConversationId ?? undefined)
  const { alerts, dismissAlert } = useAlerts()

  const messagesEndRef = useRef<HTMLDivElement>(null)

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
          <AlertBanner
            alerts={alerts}
            onDismiss={dismissAlert}
            onAnalyze={handleSendMessage}
          />
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyState onSuggestion={handleSendMessage} />
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

                  {/* Data Cards */}
                  {msg.dataCards?.map((card, i) => (
                    <DataCard key={`${msg.id}-card-${i}`} cardType={card.cardType} data={card.data} />
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

function EmptyState({ onSuggestion }: { onSuggestion: (msg: string) => void }) {
  const suggestions = [
    '이번 주 캠페인 성과 분석해줘',
    '예산을 어떻게 재분배하면 좋을까?',
    '새 전환 캠페인을 만들어줘',
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <span className="text-2xl">🤖</span>
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">
        바투 AI 어시스턴트
      </h3>
      <p className="text-xs text-muted-foreground mb-6 max-w-[280px]">
        캠페인 성과 분석, 예산 최적화, 새 캠페인 생성 등 무엇이든 물어보세요.
      </p>
      <div className="w-full space-y-2">
        {suggestions.map((suggestion, index) => (
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
