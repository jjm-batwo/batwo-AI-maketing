'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  RefreshCw,
  Settings,
  Shield,
  ShieldCheck,
  Users,
  Zap,
  MoreHorizontal,
  UserMinus,
  AlertCircle,
  CheckCircle2,
  Info,
  Crown,
} from 'lucide-react'

interface QuotaLimit {
  count: number
  period: string
  label: string
}

interface PlanConfig {
  plan: string
  label: string
  price: number
  campaignsPerWeek: number
  aiCopyPerDay: number
  aiAnalysisPerWeek: number
  description: string
}

interface SystemSettings {
  maintenanceMode: boolean
  trialDays: number
  maxTeamMembers: number
}

interface SettingsData {
  quotaLimits: Record<string, QuotaLimit>
  planConfigs: PlanConfig[]
  systemSettings: SystemSettings
}

interface Admin {
  id: string
  name: string | null
  email: string
  globalRole: string
  createdAt: string
  image: string | null
  isSuperAdmin: boolean
}

interface AdminsData {
  admins: Admin[]
  total: number
}

interface Notification {
  type: 'success' | 'error'
  message: string
}

function formatCurrency(amount: number): string {
  if (amount === -1) return '맞춤'
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatLimit(value: number): string {
  return value === -1 ? '무제한' : `${value}`
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [admins, setAdmins] = useState<AdminsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<Notification | null>(null)

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    admin: Admin | null
    action: 'promote' | 'demote' | 'remove' | null
  }>({ open: false, admin: null, action: null })
  const [processing, setProcessing] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Super Admin 권한이 필요합니다')
        }
        throw new Error('Failed to fetch settings')
      }
      const json = await res.json()
      setSettings(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings/admins')
      if (!res.ok) {
        if (res.status === 403) {
          return // 권한 없음 - 조용히 처리
        }
        throw new Error('Failed to fetch admins')
      }
      const json = await res.json()
      setAdmins(json)
    } catch (err) {
      console.error('Failed to fetch admins:', err)
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    await Promise.all([fetchSettings(), fetchAdmins()])
    setLoading(false)
  }, [fetchSettings, fetchAdmins])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 알림 자동 해제
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleAdminAction = async () => {
    if (!confirmDialog.admin || !confirmDialog.action) return

    setProcessing(true)
    try {
      const res = await fetch('/api/admin/settings/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: confirmDialog.admin.id,
          action: confirmDialog.action,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to update admin')
      }

      setNotification({
        type: 'success',
        message: json.message || '관리자 역할이 변경되었습니다.',
      })

      // 목록 새로고침
      await fetchAdmins()
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : '역할 변경에 실패했습니다.',
      })
    } finally {
      setProcessing(false)
      setConfirmDialog({ open: false, admin: null, action: null })
    }
  }

  const getActionText = (action: string | null) => {
    switch (action) {
      case 'promote':
        return '관리자로 승격'
      case 'demote':
      case 'remove':
        return '관리자 권한 제거'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">관리자 설정</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">관리자 설정</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
            <Button onClick={fetchData} className="mt-4">
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
        <div>
          <h1 className="text-2xl font-bold">관리자 설정</h1>
          <p className="text-sm text-muted-foreground">
            시스템 설정 및 관리자 권한을 관리합니다. (Super Admin 전용)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          새로고침
        </Button>
      </div>

      {/* 알림 메시지 */}
      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      {settings && (
        <>
          {/* 시스템 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                시스템 설정
              </CardTitle>
              <CardDescription>
                서비스 운영에 관련된 기본 설정입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    점검 모드
                  </div>
                  <div className="mt-2">
                    <Badge variant={settings.systemSettings.maintenanceMode ? 'destructive' : 'secondary'}>
                      {settings.systemSettings.maintenanceMode ? '활성화' : '비활성화'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    환경 변수로 관리됩니다.
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    체험 기간
                  </div>
                  <div className="mt-2 text-2xl font-bold">
                    {settings.systemSettings.trialDays}일
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    신규 가입자 체험 기간
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    팀 최대 인원
                  </div>
                  <div className="mt-2 text-2xl font-bold">
                    {settings.systemSettings.maxTeamMembers}명
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    팀당 최대 멤버 수
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MVP 사용량 제한 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                MVP 사용량 제한
              </CardTitle>
              <CardDescription>
                무료 플랜 사용자에게 적용되는 기본 제한입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(settings.quotaLimits).map(([key, limit]) => (
                  <div key={key} className="rounded-lg border p-4">
                    <div className="text-sm font-medium">{limit.label}</div>
                    <div className="mt-2 text-2xl font-bold">
                      {limit.count}회/{limit.period === 'day' ? '일' : '주'}
                    </div>
                  </div>
                ))}
              </div>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  사용량 제한은 코드에서 관리됩니다. 변경이 필요한 경우 개발팀에 문의하세요.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* 플랜별 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>플랜별 설정</CardTitle>
              <CardDescription>
                각 구독 플랜의 설정 및 제한 사항입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>플랜</TableHead>
                    <TableHead>가격</TableHead>
                    <TableHead>캠페인/주</TableHead>
                    <TableHead>AI 카피/일</TableHead>
                    <TableHead>AI 분석/주</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.planConfigs.map((plan) => (
                    <TableRow key={plan.plan}>
                      <TableCell className="font-medium">
                        <Badge variant={plan.plan === 'FREE' ? 'secondary' : 'default'}>
                          {plan.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(plan.price)}</TableCell>
                      <TableCell>{formatLimit(plan.campaignsPerWeek)}</TableCell>
                      <TableCell>{formatLimit(plan.aiCopyPerDay)}</TableCell>
                      <TableCell>{formatLimit(plan.aiAnalysisPerWeek)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 관리자 목록 */}
          {admins && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  관리자 목록
                </CardTitle>
                <CardDescription>
                  시스템 관리자 및 최고 관리자 목록입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>관리자</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>역할</TableHead>
                      <TableHead>등록일</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.admins.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          관리자가 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      admins.admins.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={admin.image || undefined} />
                                <AvatarFallback>
                                  {admin.name?.[0] || admin.email[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {admin.name || '이름 없음'}
                                </span>
                                {admin.isSuperAdmin && (
                                  <Crown className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {admin.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant={admin.isSuperAdmin ? 'default' : 'secondary'}>
                              {admin.isSuperAdmin ? '최고 관리자' : '관리자'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(admin.createdAt).toLocaleDateString('ko-KR')}
                          </TableCell>
                          <TableCell>
                            {!admin.isSuperAdmin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() =>
                                      setConfirmDialog({
                                        open: true,
                                        admin,
                                        action: 'remove',
                                      })
                                    }
                                  >
                                    <UserMinus className="mr-2 h-4 w-4" />
                                    관리자 권한 제거
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    새 관리자를 추가하려면 회원 관리 페이지에서 해당 사용자의 역할을 변경하세요.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* 확인 다이얼로그 */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          !processing && setConfirmDialog({ open, admin: null, action: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>관리자 역할 변경</DialogTitle>
            <DialogDescription>
              {confirmDialog.admin?.name || confirmDialog.admin?.email}님의 역할을 변경하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              작업: <span className="font-medium">{getActionText(confirmDialog.action)}</span>
            </p>
            {confirmDialog.action === 'remove' && (
              <Alert className="mt-4" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  이 사용자는 더 이상 관리자 페이지에 접근할 수 없습니다.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, admin: null, action: null })}
              disabled={processing}
            >
              취소
            </Button>
            <Button
              variant={confirmDialog.action === 'remove' ? 'destructive' : 'default'}
              onClick={handleAdminAction}
              disabled={processing}
            >
              {processing ? '처리 중...' : '확인'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
