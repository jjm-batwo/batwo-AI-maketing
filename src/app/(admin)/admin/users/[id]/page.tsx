import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { UserRoleDialog } from './UserRoleDialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  User,
  CreditCard,
  Megaphone,
  Users,
  Activity,
  Mail,
  Calendar,
  Clock,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'

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

interface PageProps {
  params: Promise<{ id: string }>
}

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

async function fetchUser(id: string): Promise<UserDetail | null> {
  try {
    const cookieStore = await cookies()
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin/users/${id}`, {
      headers: { Cookie: cookieStore.toString() },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch (error) {
    console.error('User fetch error:', error)
    return null
  }
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await fetchUser(id)

  if (!user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            뒤로
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">사용자를 찾을 수 없습니다.</p>
            <Button asChild className="mt-4">
              <Link href="/admin/users">회원 목록으로</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || ''}
                width={64}
                height={64}
                className="rounded-full object-cover"
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
        <UserRoleDialog
          userId={user.id}
          userName={user.name}
          userEmail={user.email}
          currentRole={user.globalRole}
        />
      </div>

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

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
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
    </div>
  )
}
