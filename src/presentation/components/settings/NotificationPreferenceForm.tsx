'use client'

import { useState } from 'react'
import type { NotificationChannelType } from '@domain/entities/NotificationChannel'
import type { AlertType, MinSeverity } from '@domain/value-objects/NotificationPreference'

interface PreferenceData {
  id: string
  alertType: AlertType
  channels: NotificationChannelType[]
  minSeverity: MinSeverity
  isActive: boolean
}

const ALERT_TYPE_INFO: Record<AlertType, { label: string; icon: string; description: string }> = {
  anomaly: {
    label: '이상 감지',
    icon: '🚨',
    description: 'ROAS 급락, 지출 급증 등 이상 징후 발생 시',
  },
  budget: {
    label: '예산 알림',
    icon: '💰',
    description: '일일 예산 90% 이상 소진 또는 초과 시',
  },
  milestone: {
    label: '마일스톤',
    icon: '🎯',
    description: 'ROAS 3.0x 달성 등 성과 달성 시',
  },
  recommendation: {
    label: '최적화 추천',
    icon: '💡',
    description: 'AI 최적화 제안이 있을 때',
  },
}

const SEVERITY_OPTIONS: { value: MinSeverity; label: string }[] = [
  { value: 'INFO', label: '모든 알림' },
  { value: 'WARNING', label: '경고 이상' },
  { value: 'CRITICAL', label: '심각만' },
]

const CHANNEL_OPTIONS: { value: NotificationChannelType; label: string }[] = [
  { value: 'SLACK', label: 'Slack' },
  { value: 'KAKAO', label: '카카오톡' },
  { value: 'EMAIL', label: '이메일' },
]

export function NotificationPreferenceForm({
  preferences,
  availableChannels,
  onSave,
  isLoading,
}: {
  preferences: PreferenceData[]
  availableChannels: NotificationChannelType[]
  onSave: (
    alertType: AlertType,
    channels: NotificationChannelType[],
    minSeverity: MinSeverity,
    isActive: boolean
  ) => void
  isLoading?: boolean
}) {
  const alertTypes: AlertType[] = ['anomaly', 'budget', 'milestone', 'recommendation']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">알림 유형별 설정</h2>
        <p className="text-sm text-muted-foreground">
          각 유형에 대해 수신할 채널과 최소 심각도를 설정하세요
        </p>
      </div>

      {alertTypes.map((alertType) => {
        const info = ALERT_TYPE_INFO[alertType]
        const existing = preferences.find((p) => p.alertType === alertType)

        return (
          <PreferenceRow
            key={alertType}
            alertType={alertType}
            label={info.label}
            icon={info.icon}
            description={info.description}
            preference={existing}
            availableChannels={availableChannels}
            onSave={onSave}
            isLoading={isLoading}
          />
        )
      })}
    </div>
  )
}

function PreferenceRow({
  alertType,
  label,
  icon,
  description,
  preference,
  availableChannels,
  onSave,
  isLoading,
}: {
  alertType: AlertType
  label: string
  icon: string
  description: string
  preference?: PreferenceData
  availableChannels: NotificationChannelType[]
  onSave: (
    alertType: AlertType,
    channels: NotificationChannelType[],
    minSeverity: MinSeverity,
    isActive: boolean
  ) => void
  isLoading?: boolean
}) {
  const [channels, setChannels] = useState<NotificationChannelType[]>(preference?.channels ?? [])
  const [minSeverity, setMinSeverity] = useState<MinSeverity>(preference?.minSeverity ?? 'WARNING')
  const [isActive, setIsActive] = useState(preference?.isActive ?? true)
  const [isDirty, setIsDirty] = useState(false)

  const handleChannelToggle = (channelType: NotificationChannelType) => {
    const newChannels = channels.includes(channelType)
      ? channels.filter((c) => c !== channelType)
      : [...channels, channelType]
    setChannels(newChannels)
    setIsDirty(true)
  }

  const handleSave = () => {
    if (channels.length === 0) return
    onSave(alertType, channels, minSeverity, isActive)
    setIsDirty(false)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div>
            <h3 className="font-medium text-foreground">{label}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => {
              setIsActive(e.target.checked)
              setIsDirty(true)
            }}
            className="peer sr-only"
          />
          <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-background after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
        </label>
      </div>

      {isActive && (
        <div className="space-y-3 ml-10">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">수신 채널</label>
            <div className="flex gap-2 flex-wrap">
              {CHANNEL_OPTIONS.filter((opt) => availableChannels.includes(opt.value)).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleChannelToggle(opt.value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    channels.includes(opt.value)
                      ? 'bg-primary/10 text-primary ring-1 ring-primary'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              {availableChannels.length === 0 && (
                <p className="text-sm text-muted-foreground italic">먼저 알림 채널을 등록하세요</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">최소 심각도</label>
            <div className="flex gap-2">
              {SEVERITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setMinSeverity(opt.value)
                    setIsDirty(true)
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    minSeverity === opt.value
                      ? 'bg-primary/10 text-primary ring-1 ring-primary'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {isDirty && (
            <button
              onClick={handleSave}
              disabled={isLoading || channels.length === 0}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {isLoading ? '저장 중...' : '저장'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
