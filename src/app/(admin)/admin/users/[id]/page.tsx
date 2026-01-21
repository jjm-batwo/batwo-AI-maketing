'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  User,
  CreditCard,
  Megaphone,
  Users,
  Activity,
  Shield,
  Mail,
  Calendar,
  Clock,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface UserDetail {
  id: string
  name: string | null
  email: string
  emailVerified: string | null
  image: string | null
  globalRole: string
  createdAt: string
  updatedAt: string
  lastActiveAt: string | null
  subscription: {
    id: string
    plan: string
    status: string
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelledAt: string | null
    createdAt: string
  } | null
  teams: Array<{
    id: string
    name: string
    role: string
    joinedAt: string
  }>
  campaigns: Array<{
    id: string
    name: string
    status: string
    createdAt: string
  }>
  invoices: Array<{
    id: string
    amount: number
    currency: string
    status: string
    paidAt: string | null
    createdAt: string
  }>
}

const globalRoleOptions = [
  { value: 'USER', label: '일반 사용자' },
  { value: 'ADMIN', label: '관리자' },
  { value: 'SUPER_ADMIN', label: '최고 관리자' },
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
    case 'PAID':
      return 'default'
    case 'TRIALING':
    case 'PENDING':
      return 'secondary'
    case 'PAST_DUE':
    case 'FAILED':
      return 'destructive'
    case 'CANCELLED':
    case 'REFUNDED':
      return 'outline'
    default:
      return 'secondary'
  }
}

function formatCurrency(amount: number, currency: string = 'KRW') {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
  }).format(amount)
}

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('')

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/admin/users/${id}`)
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('사용자를 찾을 수 없습니다.')
          }
          throw new Error('Failed to fetch user')
        }
        const data = await res.json()
        setUser(data)
        setSelectedRole(data.globalRole)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [id])

  const handleRoleChange = async () => {
    if (!user || selectedRole === user.globalRole) {
      setShowRoleDialog(false)
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ globalRole: selectedRole }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update role')
      }

      const updated = await res.json()
      setUser(updated)
      setShowRoleDialog(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : '역할 변경에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error || '사용자를 찾을 수 없습니다.'}</p>
            <Button onClick={() => router.push('/admin/users')} className="mt-4">
              회원 목록으로
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name || ''}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.name || '이름 없음'}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <Badge variant={getRoleBadgeVariant(user.globalRole)} className="ml-2">
            {user.globalRole === 'SUPER_ADMIN' ? '최고 관리자' :
             user.globalRole === 'ADMIN' ? '관리자' : '사용자'}
          </Badge>
        </div>
        <Button onClick={() => setShowRoleDialog(true)}>
          <Shield className="mr-2 h-4 w-4" />
          역할 변경
        </Button>
      </div>

      {/* 탭 */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <User className="mr-2 h-4 w-4" />
            개요
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-2 h-4 w-4" />
            활동
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="mr-2 h-4 w-4" />
            결제
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Megaphone className="mr-2 h-4 w-4" />
            캠페인
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Users className="mr-2 h-4 w-4" />
            팀
          </TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">이메일</p>
                    <p className="font-medium">{user.email}</p>
                    {user.emailVerified && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        인증됨
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">가입일</p>
                    <p className="font-medium">
                      {format(new Date(user.createdAt), 'PPP', { locale: ko })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">최근 활동</p>
                    <p className="font-medium">
                      {user.lastActiveAt
                        ? formatDistanceToNow(new Date(user.lastActiveAt), {
                            addSuffix: true,
                            locale: ko,
                          })
                        : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 구독 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">구독 정보</CardTitle>
              </CardHeader>
              <CardContent>
                {user.subscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">플랜</span>
                      <Badge variant="outline">{user.subscription.plan}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">상태</span>
                      <Badge variant={getStatusBadgeVariant(user.subscription.status)}>
                        {user.subscription.status === 'ACTIVE' ? '활성' :
                         user.subscription.status === 'TRIALING' ? '체험' :
                         user.subscription.status === 'PAST_DUE' ? '연체' :
                         user.subscription.status === 'CANCELLED' ? '취소됨' :
                         user.subscription.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">현재 기간</span>
                      <span className="text-sm">
                        {format(new Date(user.subscription.currentPeriodStart), 'MM/dd')} ~{' '}
                        {format(new Date(user.subscription.currentPeriodEnd), 'MM/dd')}
                      </span>
                    </div>
                    {user.subscription.cancelledAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">취소일</span>
                        <span className="text-sm text-destructive">
                          {format(new Date(user.subscription.cancelledAt), 'PPP', { locale: ko })}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">구독 정보가 없습니다.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 활동 탭 */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">최근 활동</CardTitle>
              <CardDescription>사용자의 최근 활동 기록입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">활동 기록이 없습니다.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 결제 탭 */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">결제 내역</CardTitle>
              <CardDescription>사용자의 결제 기록입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {user.invoices && user.invoices.length > 0 ? (
                <div className="space-y-4">
                  {user.invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.paidAt
                            ? format(new Date(invoice.paidAt), 'PPP', { locale: ko })
                            : format(new Date(invoice.createdAt), 'PPP', { locale: ko })}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>
                        {invoice.status === 'PAID' ? '결제완료' :
                         invoice.status === 'PENDING' ? '대기' :
                         invoice.status === 'FAILED' ? '실패' :
                         invoice.status === 'REFUNDED' ? '환불' :
                         invoice.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">결제 내역이 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 캠페인 탭 */}
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">캠페인</CardTitle>
              <CardDescription>사용자가 생성한 캠페인 목록입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {user.campaigns && user.campaigns.length > 0 ? (
                <div className="space-y-4">
                  {user.campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(campaign.createdAt), 'PPP', { locale: ko })}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(campaign.status)}>
                        {campaign.status === 'ACTIVE' ? '활성' :
                         campaign.status === 'PAUSED' ? '일시정지' :
                         campaign.status === 'COMPLETED' ? '종료' :
                         campaign.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">캠페인이 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 팀 탭 */}
        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">소속 팀</CardTitle>
              <CardDescription>사용자가 소속된 팀 목록입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {user.teams && user.teams.length > 0 ? (
                <div className="space-y-4">
                  {user.teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(team.joinedAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                          에 가입
                        </p>
                      </div>
                      <Badge variant="secondary">{team.role}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">소속된 팀이 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 역할 변경 다이얼로그 */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>역할 변경</DialogTitle>
            <DialogDescription>
              {user.name || user.email}님의 역할을 변경합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="역할 선택" />
              </SelectTrigger>
              <SelectContent>
                {globalRoleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              취소
            </Button>
            <Button onClick={handleRoleChange} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
