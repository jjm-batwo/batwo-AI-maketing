'use client'

import { useState } from 'react'
import { Share2, Link, Copy, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface ShareReportButtonProps {
  reportId: string
  existingShareUrl?: string
  existingShareExpiresAt?: string
  onShareCreated?: (url: string, expiresAt: string) => void
  onShareRevoked?: () => void
}

export function ShareReportButton({
  reportId,
  existingShareUrl,
  existingShareExpiresAt,
  onShareCreated,
  onShareRevoked,
}: ShareReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerateLink = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/reports/${reportId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays: 7 }),
      })
      if (!res.ok) throw new Error('Failed to generate link')
      const data = await res.json()
      onShareCreated?.(data.shareUrl, data.shareExpiresAt)
    } catch (error) {
      console.error(error)
      alert('공유 링크 생성에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeLink = async () => {
    if (!confirm('정말로 공유 링크를 취소하시겠습니까? 기존 링크는 더 이상 작동하지 않습니다.'))
      return

    try {
      setIsLoading(true)
      const res = await fetch(`/api/reports/${reportId}/share`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to revoke link')
      onShareRevoked?.()
    } catch (error) {
      console.error(error)
      alert('공유 링크 취소에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    if (existingShareUrl) {
      navigator.clipboard.writeText(existingShareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          공유
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>보고서 공유</DialogTitle>
          <DialogDescription>
            7일간 유효한 읽기 전용 퍼블릭 링크를 생성하여 외부에 공유할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          {existingShareUrl ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input id="link" defaultValue={existingShareUrl} readOnly className="w-full" />
                <Button size="sm" className="px-3" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                만료일: {new Date(existingShareExpiresAt!).toLocaleString()}
              </p>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleRevokeLink}
                disabled={isLoading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                링크 취소
              </Button>
            </div>
          ) : (
            <Button onClick={handleGenerateLink} disabled={isLoading}>
              <Link className="mr-2 h-4 w-4" />
              {isLoading ? '생성 중...' : '퍼블릭 공유 링크 생성'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
