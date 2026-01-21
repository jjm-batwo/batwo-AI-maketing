'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  UserCog,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface User {
  id: string
  name: string | null
  email: string
  globalRole: string
  createdAt: string
  lastActiveAt: string | null
  subscription: {
    plan: string
    status: string
  } | null
}

interface UsersResponse {
  data: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

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

function getRoleBadgeVariant(role: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'destructive'
    case 'ADMIN':
      return 'default'
    default:
      return 'secondary'
  }
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ACTIVE':
      return 'default'
    case 'TRIALING':
      return 'secondary'
    case 'PAST_DUE':
      return 'destructive'
    case 'CANCELLED':
      return 'outline'
    default:
      return 'secondary'
  }
}

export default function AdminUsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<UsersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 필터 상태
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [globalRole, setGlobalRole] = useState(searchParams.get('globalRole') || 'all')
  const [subscriptionPlan, setSubscriptionPlan] = useState(searchParams.get('subscriptionPlan') || 'all')
  const [subscriptionStatus, setSubscriptionStatus] = useState(searchParams.get('subscriptionStatus') || 'all')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))
  const [limit] = useState(10)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      if (search) params.set('search', search)
      if (globalRole !== 'all') params.set('globalRole', globalRole)
      if (subscriptionPlan !== 'all') params.set('subscriptionPlan', subscriptionPlan)
      if (subscriptionStatus !== 'all') params.set('subscriptionStatus', subscriptionStatus)

      const res = await fetch(`/api/admin/users?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to fetch users')
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, globalRole, subscriptionPlan, subscriptionStatus])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // URL 업데이트
  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (search) params.set('search', search)
    if (globalRole !== 'all') params.set('globalRole', globalRole)
    if (subscriptionPlan !== 'all') params.set('subscriptionPlan', subscriptionPlan)
    if (subscriptionStatus !== 'all') params.set('subscriptionStatus', subscriptionStatus)

    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.replace(`/admin/users${newUrl}`, { scroll: false })
  }, [page, search, globalRole, subscriptionPlan, subscriptionStatus, router])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const handleViewUser = (userId: string) => {
    router.push(`/admin/users/${userId}`)
  }

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">회원 관리</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">회원 관리</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchUsers} className="mt-4">
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">회원 관리</h1>
        <p className="text-sm text-muted-foreground">
          총 {data?.total.toLocaleString() || 0}명
        </p>
      </div>

      {/* 검색 및 필터 */}
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
            <Select value={globalRole} onValueChange={(v) => { setGlobalRole(v); setPage(1) }}>
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
            <Select value={subscriptionPlan} onValueChange={(v) => { setSubscriptionPlan(v); setPage(1) }}>
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
            <Select value={subscriptionStatus} onValueChange={(v) => { setSubscriptionStatus(v); setPage(1) }}>
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

      {/* 회원 테이블 */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>회원</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>구독</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead>최근 활동</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    검색 결과가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name || '이름 없음'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.globalRole)}>
                        {user.globalRole === 'SUPER_ADMIN' ? '최고 관리자' :
                         user.globalRole === 'ADMIN' ? '관리자' : '사용자'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.subscription ? (
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline">{user.subscription.plan}</Badge>
                          <Badge variant={getStatusBadgeVariant(user.subscription.status)} className="text-xs">
                            {user.subscription.status === 'ACTIVE' ? '활성' :
                             user.subscription.status === 'TRIALING' ? '체험' :
                             user.subscription.status === 'PAST_DUE' ? '연체' :
                             user.subscription.status === 'CANCELLED' ? '취소됨' :
                             user.subscription.status}
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="outline">FREE</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {formatDistanceToNow(new Date(user.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground">
                        {user.lastActiveAt
                          ? formatDistanceToNow(new Date(user.lastActiveAt), {
                              addSuffix: true,
                              locale: ko,
                            })
                          : '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewUser(user.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            상세 보기
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewUser(user.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewUser(user.id)}>
                            <UserCog className="mr-2 h-4 w-4" />
                            역할 변경
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* 페이지네이션 */}
          {data && data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {data.total}개 중 {(page - 1) * limit + 1}-
                {Math.min(page * limit, data.total)}개 표시
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {page} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
