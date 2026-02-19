'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'

const globalRoleOptions = [
  { value: 'all', label: '전체 역할' },
  { value: 'USER', label: '일반 사용자' },
  { value: 'ADMIN', label: '관리자' },
  { value: 'SUPER_ADMIN', label: '최고 관리자' },
]

const subscriptionPlanOptions = [
  { value: 'all', label: '전체 플랜' },
  { value: 'FREE', label: 'Free' },
  { value: 'STARTER', label: 'Starter' },
  { value: 'PRO', label: 'Pro' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
]

const subscriptionStatusOptions = [
  { value: 'all', label: '전체 상태' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'CANCELLED', label: '취소됨' },
  { value: 'PAST_DUE', label: '연체' },
  { value: 'TRIALING', label: '체험' },
]

export function UsersFilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [globalRole, setGlobalRole] = useState(searchParams.get('globalRole') || 'all')
  const [subscriptionPlan, setSubscriptionPlan] = useState(searchParams.get('subscriptionPlan') || 'all')
  const [subscriptionStatus, setSubscriptionStatus] = useState(searchParams.get('subscriptionStatus') || 'all')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateUrl()
  }

  const updateUrl = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (globalRole !== 'all') params.set('globalRole', globalRole)
    if (subscriptionPlan !== 'all') params.set('subscriptionPlan', subscriptionPlan)
    if (subscriptionStatus !== 'all') params.set('subscriptionStatus', subscriptionStatus)

    router.push(`/admin/users${params.toString() ? `?${params.toString()}` : ''}`)
  }

  useEffect(() => {
    updateUrl()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalRole, subscriptionPlan, subscriptionStatus])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">검색 및 필터</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex flex-1 items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="이름 또는 이메일로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-[200px]"
            />
          </div>
          <Select value={globalRole} onValueChange={setGlobalRole}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="역할" />
            </SelectTrigger>
            <SelectContent>
              {globalRoleOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={subscriptionPlan} onValueChange={setSubscriptionPlan}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="플랜" />
            </SelectTrigger>
            <SelectContent>
              {subscriptionPlanOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="구독 상태" />
            </SelectTrigger>
            <SelectContent>
              {subscriptionStatusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit">검색</Button>
        </form>
      </CardContent>
    </Card>
  )
}
