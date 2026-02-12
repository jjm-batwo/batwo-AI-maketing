'use client'

import { memo, useState, useEffect, useRef } from 'react'
import { BrowserChrome } from './BrowserChrome'

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  type?: 'text' | 'typing' | 'campaign-card'
}

interface CampaignData {
  name: string
  target: string
  budget: string
  status: string
}

export const AIChatDemo = memo(function AIChatDemo() {
  const [messages, setMessages] = useState<Message[]>([])
  const [visible, setVisible] = useState(true)
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false

    // 딜레이 유틸
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = setTimeout(() => {
          if (!cancelledRef.current) resolve()
        }, ms)
        // cleanup 시 reject 대신 그냥 resolve 안 함
        cleanups.push(() => clearTimeout(id))
      })

    const cleanups: (() => void)[] = []

    async function runLoop() {
      while (!cancelledRef.current) {
        // 1. 사용자 메시지
        setVisible(true)
        setMessages([{ id: '1', role: 'user', content: '20대 여성 타겟 봄 신상품 캠페인 만들어줘', type: 'text' }])
        await wait(800)
        if (cancelledRef.current) break

        // 2. AI 타이핑 인디케이터
        setMessages(prev => [...prev, { id: '2', role: 'ai', content: '', type: 'typing' }])
        await wait(1200)
        if (cancelledRef.current) break

        // 3. AI 응답
        setMessages(prev => prev.map(msg =>
          msg.id === '2' ? { ...msg, content: '캠페인을 생성하고 있습니다...', type: 'text' as const } : msg
        ))
        await wait(1500)
        if (cancelledRef.current) break

        // 4. 캠페인 카드 표시
        setMessages(prev => [...prev, { id: '3', role: 'ai', content: '', type: 'campaign-card' }])
        await wait(800)
        if (cancelledRef.current) break

        // 5. AI 최종 메시지
        setMessages(prev => [...prev, { id: '4', role: 'ai', content: '봄 신상품 캠페인이 생성되었습니다! 예상 ROAS 3.2x', type: 'text' }])
        await wait(3000)
        if (cancelledRef.current) break

        // 6. 페이드아웃
        setVisible(false)
        await wait(800)
        if (cancelledRef.current) break

        // 7. 리셋 후 반복
        setMessages([])
      }
    }

    runLoop()

    return () => {
      cancelledRef.current = true
      cleanups.forEach(fn => fn())
    }
  }, [])

  return (
    <div className="relative glass-card rounded-2xl p-4 md:p-6 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] group aspect-[4/3] md:aspect-auto">
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-purple-600/30 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500 pointer-events-none" aria-hidden="true" />

      <div className="relative bg-card/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm border border-border/50">
        <BrowserChrome url="app.batwo.io/chat" />

        {/* 채팅 영역 */}
        <div className={`p-4 md:p-6 space-y-4 h-[400px] overflow-hidden transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`animate-fade-in-up`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {message.type === 'text' && (
                <ChatBubble role={message.role} content={message.content} />
              )}
              {message.type === 'typing' && (
                <TypingIndicator />
              )}
              {message.type === 'campaign-card' && (
                <CampaignCard />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

// 채팅 버블 컴포넌트
const ChatBubble = memo(function ChatBubble({ role, content }: { role: 'user' | 'ai'; content: string }) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        } shadow-sm`}
      >
        <p className="text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  )
})

// 타이핑 인디케이터
const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-muted text-foreground px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
})

// 캠페인 카드 컴포넌트
const CampaignCard = memo(function CampaignCard() {
  const campaignData: CampaignData = {
    name: '봄 신상품 런칭 캠페인',
    target: '20-29세 여성',
    budget: '₩500,000',
    status: '승인 대기'
  }

  return (
    <div className="flex justify-start animate-fade-in-up">
      <div className="max-w-[85%] bg-card border border-border rounded-xl shadow-md overflow-hidden">
        {/* 카드 헤더 */}
        <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="font-semibold text-sm">{campaignData.name}</h4>
          </div>
        </div>

        {/* 카드 내용 */}
        <div className="p-4 space-y-3">
          <InfoRow icon="🎯" label="타겟" value={campaignData.target} />
          <InfoRow icon="💰" label="일일 예산" value={campaignData.budget} />
          <InfoRow icon="📊" label="상태" value={campaignData.status} />
        </div>
      </div>
    </div>
  )
})

// 정보 행 컴포넌트
const InfoRow = memo(function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg" role="img" aria-label={label}>
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
})
