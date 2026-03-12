'use client'

import { useState } from 'react'
import { Calendar, Trash2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface ReportScheduleFormProps {
  onScheduleCreated?: () => void
  disabled?: boolean
}

export function ReportScheduleForm({ onScheduleCreated, disabled }: ReportScheduleFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [frequency, setFrequency] = useState('WEEKLY')
  const [emailInput, setEmailInput] = useState('')
  const [recipients, setRecipients] = useState<string[]>([])

  const handleAddEmail = () => {
    const trimmed = emailInput.trim()
    if (!trimmed) return
    if (!trimmed.includes('@')) {
      alert('유효한 이메일 주소를 입력해주세요.')
      return
    }
    if (recipients.includes(trimmed)) {
      alert('이미 추가된 이메일입니다.')
      return
    }
    setRecipients([...recipients, trimmed])
    setEmailInput('')
  }

  const handleRemoveEmail = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email))
  }

  const handleSubmit = async () => {
    if (recipients.length === 0) {
      alert('최소 1명 이상의 수신자를 등록해야 합니다.')
      return
    }

    try {
      setIsLoading(true)
      const res = await fetch('/api/reports/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequency, recipients }),
      })
      if (!res.ok) throw new Error('Failed to create schedule')
      alert('보고서 자동 발송 일정이 등록되었습니다.')
      onScheduleCreated?.()
      setIsOpen(false)
      // Reset form
      setFrequency('WEEKLY')
      setRecipients([])
    } catch (error) {
      console.error(error)
      alert('일정 등록에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Calendar className="mr-2 h-4 w-4" />
          발송 일정 예약
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>자동 발송 예약</DialogTitle>
          <DialogDescription>
            지정한 주기마다 등록된 이메일로 광고 성과 보고서가 자동 발송됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">발송 주기</label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue placeholder="발송 주기 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">일간 (매일 오전 9시)</SelectItem>
                <SelectItem value="WEEKLY">주간 (매주 월요일 오전 9시)</SelectItem>
                <SelectItem value="MONTHLY">월간 (매월 1일 오전 9시)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">수신자 이메일</label>
            <div className="flex space-x-2">
              <Input
                placeholder="email@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddEmail()
                  }
                }}
              />
              <Button type="button" onClick={handleAddEmail}>
                추가
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {recipients.map((email) => (
                <Badge
                  key={email}
                  variant="secondary"
                  className="flex items-center gap-1 py-1 px-2"
                >
                  <Mail className="h-3 w-3" />
                  {email}
                  <button
                    onClick={() => handleRemoveEmail(email)}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || recipients.length === 0}>
            {isLoading ? '등록 중...' : '일정 등록'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
