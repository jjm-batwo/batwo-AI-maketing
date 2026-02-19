import { cookies } from 'next/headers'
import { UsersFilterBar } from './UsersFilterBar'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  UserCog,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'

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

interface PageProps {
  searchParams: Promise<{
    search?: string
    globalRole?: string
    subscriptionPlan?: string
    subscriptionStatus?: string
    page?: string
  }>
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

async function fetchUsers(params: URLSearchParams): Promise<UsersResponse | null> {
  try {
    const cookieStore = await cookies()
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin/users?${params.toString()}`, {
      headers: { Cookie: cookieStore.toString() },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch (error) {
    console.error('Users fetch error:', error)
    return null
  }
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const limit = 10

  const queryParams = new URLSearchParams()
  queryParams.set('page', page.toString())
  queryParams.set('limit', limit.toString())
  if (params.search) queryParams.set('search', params.search)
  if (params.globalRole && params.globalRole !== 'all') queryParams.set('globalRole', params.globalRole)
  if (params.subscriptionPlan && params.subscriptionPlan !== 'all') queryParams.set('subscriptionPlan', params.subscriptionPlan)
  if (params.subscriptionStatus && params.subscriptionStatus !== 'all') queryParams.set('subscriptionStatus', params.subscriptionStatus)

  const data = await fetchUsers(queryParams)

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">회원 관리</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">데이터를 불러오는데 실패했습니다.</p>
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
          총 {data.total.toLocaleString()}명
        </p>
      </div>

      <UsersFilterBar />

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
              {data.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    검색 결과가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((user) => (
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
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              상세 보기
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              수정
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}`}>
                              <UserCog className="mr-2 h-4 w-4" />
                              역할 변경
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data.totalPages > 1 && (
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
                  asChild={page > 1}
                >
                  {page > 1 ? (
                    <Link href={`/admin/users?${new URLSearchParams({ ...params, page: (page - 1).toString() }).toString()}`}>
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
                <span className="text-sm">
                  {page} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= data.totalPages}
                  asChild={page < data.totalPages}
                >
                  {page < data.totalPages ? (
                    <Link href={`/admin/users?${new URLSearchParams({ ...params, page: (page + 1).toString() }).toString()}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
