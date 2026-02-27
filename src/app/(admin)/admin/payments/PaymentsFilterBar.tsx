'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const statusOptions = [
  { value: 'all', label: '전체 상태' },
  { value: 'PENDING', label: '결제 대기' },
  { value: 'PAID', label: '결제 완료' },
  { value: 'FAILED', label: '결제 실패' },
  { value: 'REFUND_REQUESTED', label: '환불 요청' },
  { value: 'REFUNDED', label: '환불 완료' },
  { value: 'PARTIALLY_REFUNDED', label: '부분 환불' },
]

export function PaymentsFilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState(searchParams.get('status') || 'all')
  const [createdAtFrom, setCreatedAtFrom] = useState(searchParams.get('createdAtFrom') || '')
  const [createdAtTo, setCreatedAtTo] = useState(searchParams.get('createdAtTo') || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateUrl()
  }

  const updateUrl = () => {
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    if (createdAtFrom) params.set('createdAtFrom', createdAtFrom)
    if (createdAtTo) params.set('createdAtTo', createdAtTo)
    router.push(`/admin/payments${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const handleReset = () => {
    setStatus('all')
    setCreatedAtFrom('')
    setCreatedAtTo('')
    router.push('/admin/payments')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">검색 및 필터</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={createdAtFrom}
              onChange={(e) => setCreatedAtFrom(e.target.value)}
              className="w-[150px]"
            />
            <span className="text-muted-foreground">~</span>
            <Input
              type="date"
              value={createdAtTo}
              onChange={(e) => setCreatedAtTo(e.target.value)}
              className="w-[150px]"
            />
          </div>
          <Button type="submit">검색</Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            초기화
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
