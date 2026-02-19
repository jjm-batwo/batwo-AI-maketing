'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ShieldCheck, MoreHorizontal, UserMinus, Info, AlertCircle, Crown } from 'lucide-react'

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

export function AdminRoleManagement({ initialData }: { initialData: AdminsData }) {
  const router = useRouter()
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; admin: Admin | null; action: 'remove' | null }>({ open: false, admin: null, action: null })
  const [processing, setProcessing] = useState(false)

  const handleAdminAction = async () => {
    if (!confirmDialog.admin || !confirmDialog.action) return

    setProcessing(true)
    try {
      const res = await fetch('/api/admin/settings/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: confirmDialog.admin.id, action: confirmDialog.action }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to update admin')
      }

      setConfirmDialog({ open: false, admin: null, action: null })
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : '역할 변경에 실패했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            관리자 목록
          </CardTitle>
          <CardDescription>시스템 관리자 및 최고 관리자 목록입니다.</CardDescription>
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
              {initialData.admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">관리자가 없습니다.</TableCell>
                </TableRow>
              ) : (
                initialData.admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={admin.image || undefined} />
                          <AvatarFallback>{admin.name?.[0] || admin.email[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{admin.name || '이름 없음'}</span>
                          {admin.isSuperAdmin && <Crown className="h-4 w-4 text-yellow-500" />}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant={admin.isSuperAdmin ? 'default' : 'secondary'}>{admin.isSuperAdmin ? '최고 관리자' : '관리자'}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(admin.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                    <TableCell>
                      {!admin.isSuperAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDialog({ open: true, admin, action: 'remove' })}>
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
            <AlertDescription>새 관리자를 추가하려면 회원 관리 페이지에서 해당 사용자의 역할을 변경하세요.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Dialog open={confirmDialog.open} onOpenChange={(open) => !processing && setConfirmDialog({ open, admin: null, action: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>관리자 역할 변경</DialogTitle>
            <DialogDescription>{confirmDialog.admin?.name || confirmDialog.admin?.email}님의 역할을 변경하시겠습니까?</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">작업: <span className="font-medium">관리자 권한 제거</span></p>
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>이 사용자는 더 이상 관리자 페이지에 접근할 수 없습니다.</AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, admin: null, action: null })} disabled={processing}>취소</Button>
            <Button variant="destructive" onClick={handleAdminAction} disabled={processing}>{processing ? '처리 중...' : '확인'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
