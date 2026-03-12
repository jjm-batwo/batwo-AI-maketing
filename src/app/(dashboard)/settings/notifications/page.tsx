'use client'

import { useState, useEffect, useCallback } from 'react'
import { NotificationChannelCard } from '@presentation/components/settings/NotificationChannelCard'
import { NotificationPreferenceForm } from '@presentation/components/settings/NotificationPreferenceForm'
import type { NotificationChannelType } from '@domain/entities/NotificationChannel'
import type { AlertType, MinSeverity } from '@domain/value-objects/NotificationPreference'

interface ChannelData {
  id: string
  userId: string
  type: NotificationChannelType
  config: Record<string, string>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface PreferenceData {
  id: string
  userId: string
  alertType: AlertType
  channels: NotificationChannelType[]
  minSeverity: MinSeverity
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const CHANNEL_TYPES: NotificationChannelType[] = ['SLACK', 'KAKAO', 'EMAIL']

export default function NotificationSettingsPage() {
  const [channels, setChannels] = useState<ChannelData[]>([])
  const [preferences, setPreferences] = useState<PreferenceData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [channelsRes, preferencesRes] = await Promise.all([
        fetch('/api/notifications/channels'),
        fetch('/api/notifications/preferences'),
      ])
      if (channelsRes.ok) setChannels(await channelsRes.json())
      if (preferencesRes.ok) setPreferences(await preferencesRes.json())
    } catch (error) {
      console.error('알림 설정 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSaveChannel = async (type: NotificationChannelType, config: unknown) => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/notifications/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, config }),
      })
      if (res.ok) {
        await fetchData()
      } else {
        const data = await res.json()
        alert(data.message || '채널 저장 실패')
      }
    } catch (error) {
      alert('채널 저장 중 오류가 발생했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteChannel = async (id: string) => {
    if (!confirm('이 알림 채널을 삭제하시겠습니까?')) return
    try {
      const res = await fetch(`/api/notifications/channels?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchData()
      }
    } catch (error) {
      alert('채널 삭제 중 오류가 발생했습니다')
    }
  }

  const handleSavePreference = async (
    alertType: AlertType,
    selectedChannels: NotificationChannelType[],
    minSeverity: MinSeverity,
    isActive: boolean,
  ) => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertType, channels: selectedChannels, minSeverity, isActive }),
      })
      if (res.ok) {
        await fetchData()
      } else {
        const data = await res.json()
        alert(data.message || '선호도 저장 실패')
      }
    } catch (error) {
      alert('선호도 저장 중 오류가 발생했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestNotification = async () => {
    setTestResult(null)
    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertType: 'anomaly' }),
      })
      const data = await res.json()
      if (data.sent > 0) {
        setTestResult({ type: 'success', message: `✅ ${data.sent}개 채널로 테스트 알림이 발송되었습니다!` })
      } else {
        setTestResult({
          type: 'error',
          message: data.errors?.length > 0
            ? `❌ 발송 실패: ${data.errors.join(', ')}`
            : '⚠️ 발송된 알림이 없습니다. 채널과 선호도를 확인하세요.',
        })
      }
    } catch (error) {
      setTestResult({ type: 'error', message: '❌ 테스트 알림 발송 중 오류가 발생했습니다' })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  const availableChannels = channels.filter((ch) => ch.isActive).map((ch) => ch.type)

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">알림 설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Slack, 카카오톡, 이메일로 캠페인 알림을 받아보세요
        </p>
      </div>

      {/* 채널 연결 */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">알림 채널</h2>
        <div className="grid gap-4">
          {CHANNEL_TYPES.map((type) => {
            const channel = channels.find((ch) => ch.type === type)
            return (
              <NotificationChannelCard
                key={type}
                type={type}
                channel={channel}
                onSave={handleSaveChannel}
                onDelete={channel ? handleDeleteChannel : undefined}
                isLoading={isSaving}
              />
            )
          })}
        </div>
      </section>

      {/* 선호도 설정 */}
      <section>
        <NotificationPreferenceForm
          preferences={preferences}
          availableChannels={availableChannels}
          onSave={handleSavePreference}
          isLoading={isSaving}
        />
      </section>

      {/* 테스트 알림 */}
      <section className="rounded-xl border border-dashed border-border bg-muted/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-foreground">테스트 알림 발송</h3>
            <p className="text-sm text-muted-foreground">
              설정된 채널로 테스트 알림을 보내 연결을 확인합니다
            </p>
          </div>
          <button
            onClick={handleTestNotification}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition"
          >
            🔔 테스트 발송
          </button>
        </div>
        {testResult && (
          <div
            className={`mt-3 rounded-lg px-4 py-2 text-sm ${
              testResult.type === 'success'
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
            }`}
          >
            {testResult.message}
          </div>
        )}
      </section>
    </div>
  )
}
