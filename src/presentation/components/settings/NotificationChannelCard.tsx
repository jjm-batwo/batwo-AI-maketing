'use client'

import { useState } from 'react'
import type { NotificationChannelType } from '@domain/entities/NotificationChannel'

interface ChannelConfig {
  webhookUrl?: string
  channelName?: string
  phoneNumber?: string
  email?: string
}

interface ChannelData {
  id: string
  type: NotificationChannelType
  config: ChannelConfig
  isActive: boolean
}

const CHANNEL_INFO: Record<
  NotificationChannelType,
  { label: string; icon: string; description: string }
> = {
  SLACK: {
    label: 'Slack',
    icon: '💬',
    description: 'Slack Webhook URL을 등록하면 채널에 알림이 전송됩니다.',
  },
  KAKAO: {
    label: '카카오톡 알림톡',
    icon: '💛',
    description: '카카오톡 알림톡으로 알림이 전송됩니다.',
  },
  EMAIL: {
    label: '이메일',
    icon: '📧',
    description: '이메일로 알림이 전송됩니다.',
  },
}

export function NotificationChannelCard({
  channel,
  type,
  onSave,
  onDelete,
  isLoading,
}: {
  channel?: ChannelData
  type: NotificationChannelType
  onSave: (type: NotificationChannelType, config: ChannelConfig) => void
  onDelete?: (id: string) => void
  isLoading?: boolean
}) {
  const channelType = channel?.type ?? type
  const info = CHANNEL_INFO[channelType]
  const [isEditing, setIsEditing] = useState(!channel)
  const [webhookUrl, setWebhookUrl] = useState(channel?.config?.webhookUrl ?? '')
  const [channelName, setChannelName] = useState(channel?.config?.channelName ?? '')
  const [phoneNumber, setPhoneNumber] = useState(channel?.config?.phoneNumber ?? '')
  const [email, setEmail] = useState(channel?.config?.email ?? '')

  const handleSave = () => {
    let config: ChannelConfig = {}
    switch (channelType) {
      case 'SLACK':
        config = { webhookUrl, channelName: channelName || undefined }
        break
      case 'KAKAO':
        config = { phoneNumber }
        break
      case 'EMAIL':
        config = { email }
        break
    }
    onSave(channelType, config)
    setIsEditing(false)
  }

  const inputClass =
    'w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none transition-colors'

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{info.icon}</span>
          <div>
            <h3 className="font-semibold text-foreground">{info.label}</h3>
            <p className="text-sm text-muted-foreground">{info.description}</p>
          </div>
        </div>
        {channel && (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              channel.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {channel.isActive ? '연결됨' : '비활성'}
          </span>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          {channelType === 'SLACK' && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/T00/B00/xxx"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  채널 이름 (선택)
                </label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="#alerts"
                  className={inputClass}
                />
              </div>
            </>
          )}
          {channelType === 'KAKAO' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">전화번호</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="01012345678"
                className={inputClass}
              />
            </div>
          )}
          {channelType === 'EMAIL' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">이메일 주소</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alert@example.com"
                className={inputClass}
              />
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {isLoading ? '저장 중...' : '저장'}
            </button>
            {channel && (
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80 transition"
              >
                취소
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {channelType === 'SLACK' && channel?.config?.webhookUrl && (
              <span>Webhook: ...{channel.config.webhookUrl.slice(-12)}</span>
            )}
            {channelType === 'KAKAO' && channel?.config?.phoneNumber && (
              <span>
                전화번호:{' '}
                {channel.config.phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3')}
              </span>
            )}
            {channelType === 'EMAIL' && channel?.config?.email && (
              <span>이메일: {channel.config.email}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/80 transition"
            >
              수정
            </button>
            {channel && onDelete && (
              <button
                onClick={() => onDelete(channel.id)}
                className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition"
              >
                삭제
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
