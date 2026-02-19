import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { AdminRoleManagement } from './AdminRoleManagement'

export const metadata: Metadata = {
  title: '관리자 설정 | 바투',
  description: '서비스 설정을 관리하세요',
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Settings, Shield, Zap, Users, Info } from 'lucide-react'

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

function formatCurrency(amount: number): string {
  if (amount === -1) return '맞춤'
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount)
}

function formatLimit(value: number): string {
  return value === -1 ? '무제한' : `${value}`
}

async function fetchData(baseUrl: string, cookieHeader: string) {
  const [settingsRes, adminsRes] = await Promise.all([
    fetch(`${baseUrl}/api/admin/settings`, { headers: { Cookie: cookieHeader }, cache: 'no-store' }),
    fetch(`${baseUrl}/api/admin/settings/admins`, { headers: { Cookie: cookieHeader }, cache: 'no-store' }),
  ])
  
  return {
    settings: settingsRes.ok ? await settingsRes.json() : null,
    admins: adminsRes.ok ? await adminsRes.json() : null,
  }
}

export default async function AdminSettingsPage() {
  const cookieStore = await cookies()
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const { settings, admins } = await fetchData(baseUrl, cookieStore.toString())

  if (!settings) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">관리자 설정</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">데이터를 불러오는데 실패했습니다. Super Admin 권한이 필요합니다.</p>
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
          <p className="text-sm text-muted-foreground">시스템 설정 및 관리자 권한을 관리합니다. (Super Admin 전용)</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            시스템 설정
          </CardTitle>
          <CardDescription>서비스 운영에 관련된 기본 설정입니다.</CardDescription>
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
              <p className="mt-2 text-xs text-muted-foreground">환경 변수로 관리됩니다.</p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Zap className="h-4 w-4 text-muted-foreground" />
                체험 기간
              </div>
              <div className="mt-2 text-2xl font-bold">{settings.systemSettings.trialDays}일</div>
              <p className="mt-2 text-xs text-muted-foreground">신규 가입자 체험 기간</p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-muted-foreground" />
                팀 최대 인원
              </div>
              <div className="mt-2 text-2xl font-bold">{settings.systemSettings.maxTeamMembers}명</div>
              <p className="mt-2 text-xs text-muted-foreground">팀당 최대 멤버 수</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            MVP 사용량 제한
          </CardTitle>
          <CardDescription>무료 플랜 사용자에게 적용되는 기본 제한입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(settings.quotaLimits).map(([key, limit]) => {
              const typedLimit = limit as QuotaLimit
              return (
                <div key={key} className="rounded-lg border p-4">
                  <div className="text-sm font-medium">{typedLimit.label}</div>
                  <div className="mt-2 text-2xl font-bold">
                    {typedLimit.count}회/{typedLimit.period === 'day' ? '일' : '주'}
                  </div>
                </div>
              )
            })}
          </div>

          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>사용량 제한은 코드에서 관리됩니다. 변경이 필요한 경우 개발팀에 문의하세요.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>플랜별 설정</CardTitle>
          <CardDescription>각 구독 플랜의 설정 및 제한 사항입니다.</CardDescription>
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
              {settings.planConfigs.map((plan: PlanConfig) => (
                <TableRow key={plan.plan}>
                  <TableCell className="font-medium">
                    <Badge variant={plan.plan === 'FREE' ? 'secondary' : 'default'}>{plan.label}</Badge>
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

      {admins && <AdminRoleManagement initialData={admins} />}
    </div>
  )
}
