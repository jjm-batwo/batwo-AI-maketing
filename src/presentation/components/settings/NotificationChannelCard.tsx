'use client'

import { useState } from 'react'
import type { NotificationChannelType } from '@domain/entities/NotificationChannel'
import type { MinSeverity } from '@domain/value-objects/NotificationPreference'

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

const CHANNEL_INFO: Record<NotificationChannelType, { label: string; icon: string; description: string }> = {
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
  const type = channel?.type ?? 'SLACK'
  const info = CHANNEL_INFO[type]
  const [isEditing, setIsEditing] = useState(!channel)
  const [webhookUrl, setWebhookUrl] = useState(channel?.config?.webhookUrl ?? '')
  const [channelName, setChannelName] = useState(channel?.config?.channelName ?? '')
  const [phoneNumber, setPhoneNumber] = useState(channel?.config?.phoneNumber ?? '')
  const [email, setEmail] = useState(channel?.config?.email ?? '')

  const handleSave = () => {
    let config: ChannelConfig = {}
    switch (type) {
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
    onSave(type, config)
    setIsEditing(false)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{info.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{info.label}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{info.description}</p>
          </div>
        </div>
        {channel && (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              channel.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {channel.isActive ? '연결됨' : '비활성'}
          </span>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          {type === 'SLACK' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/T00/B00/xxx"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  채널 이름 (선택)
                </label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="#alerts"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
            </>
          )}
          {type === 'KAKAO' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                전화번호
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="01012345678"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
          )}
          {type === 'EMAIL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                이메일 주소
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alert@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {isLoading ? '저장 중...' : '저장'}
            </button>
            {channel && (
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition"
              >
                취소
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {type === 'SLACK' && channel?.config?.webhookUrl && (
              <span>Webhook: ...{channel.config.webhookUrl.slice(-12)}</span>
            )}
            {type === 'KAKAO' && channel?.config?.phoneNumber && (
              <span>전화번호: {channel.config.phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3')}</span>
            )}
            {type === 'EMAIL' && channel?.config?.email && (
              <span>이메일: {channel.config.email}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition"
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
