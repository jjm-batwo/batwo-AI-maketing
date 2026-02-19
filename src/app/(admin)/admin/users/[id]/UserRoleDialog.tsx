'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Shield } from 'lucide-react'

const globalRoleOptions = [
  { value: 'USER', label: '일반 사용자' },
  { value: 'ADMIN', label: '관리자' },
  { value: 'SUPER_ADMIN', label: '최고 관리자' },
]

interface UserRoleDialogProps {
  userId: string
  userName: string | null
  userEmail: string
  currentRole: string
}

export function UserRoleDialog({ userId, userName, userEmail, currentRole }: UserRoleDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState(currentRole)
  const [saving, setSaving] = useState(false)

  const handleRoleChange = async () => {
    if (selectedRole === currentRole) {
      setOpen(false)
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ globalRole: selectedRole }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update role')
      }

      setOpen(false)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : '역할 변경에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Shield className="mr-2 h-4 w-4" />
        역할 변경
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>역할 변경</DialogTitle>
            <DialogDescription>
              {userName || userEmail}님의 역할을 변경합니다.
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
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              취소
            </Button>
            <Button onClick={handleRoleChange} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
