'use client'

import { useState } from 'react'
import { useInviteMember } from '@/presentation/hooks/useTeams'
import { TeamRole, TeamPermission, DEFAULT_ROLE_PERMISSIONS } from '@/domain/entities/Team'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserPlus, AlertCircle } from 'lucide-react'

const VALID_ROLES: { value: TeamRole; label: string; description: string }[] = [
  { value: 'ADMIN', label: '관리자', description: '팀 설정 및 멤버 관리 가능' },
  { value: 'MEMBER', label: '멤버', description: '캠페인 생성 및 수정 가능' },
  { value: 'VIEWER', label: '뷰어', description: '데이터 조회만 가능' },
]

const PERMISSION_LABELS: Record<TeamPermission, string> = {
  'campaign:read': '캠페인 조회',
  'campaign:write': '캠페인 수정',
  'campaign:delete': '캠페인 삭제',
  'report:read': '리포트 조회',
  'report:write': '리포트 수정',
  'analytics:read': '분석 조회',
  'team:invite': '멤버 초대',
  'team:manage': '팀 관리',
  'settings:read': '설정 조회',
  'settings:write': '설정 수정',
  'billing:read': '결제 조회',
  'billing:manage': '결제 관리',
}

interface InviteMemberDialogProps {
  teamId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteMemberDialog({ teamId, open, onOpenChange }: InviteMemberDialogProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<TeamRole>('MEMBER')
  const [customPermissions, setCustomPermissions] = useState<TeamPermission[]>([])
  const [useCustomPermissions, setUseCustomPermissions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inviteMember = useInviteMember()

  const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[role]
  const effectivePermissions = useCustomPermissions ? customPermissions : defaultPermissions

  const handleRoleChange = (newRole: TeamRole) => {
    setRole(newRole)
    if (useCustomPermissions) {
      // Update custom permissions to match new role's defaults
      setCustomPermissions(DEFAULT_ROLE_PERMISSIONS[newRole])
    }
  }

  const handlePermissionToggle = (permission: TeamPermission) => {
    if (!useCustomPermissions) return

    setCustomPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await inviteMember.mutateAsync({
        teamId,
        email,
        name: name || undefined,
        role,
        permissions: useCustomPermissions ? customPermissions : undefined,
      })
      // Reset form
      setEmail('')
      setName('')
      setRole('MEMBER')
      setCustomPermissions([])
      setUseCustomPermissions(false)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '초대에 실패했습니다.')
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            팀 멤버 초대
          </DialogTitle>
          <DialogDescription>이메일 주소로 새 멤버를 초대하세요.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">이메일 주소 *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">이름 (선택)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">역할</Label>
              <Select value={role} onValueChange={(v) => handleRoleChange(v as TeamRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VALID_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex flex-col">
                        <span>{r.label}</span>
                        <span className="text-xs text-muted-foreground">{r.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customPermissions"
                  checked={useCustomPermissions}
                  onCheckedChange={(checked) => {
                    setUseCustomPermissions(!!checked)
                    if (checked) {
                      setCustomPermissions(DEFAULT_ROLE_PERMISSIONS[role])
                    }
                  }}
                />
                <Label htmlFor="customPermissions" className="text-sm font-normal">
                  권한 커스터마이징
                </Label>
              </div>

              {useCustomPermissions && (
                <div className="grid grid-cols-2 gap-2 pl-6">
                  {(Object.keys(PERMISSION_LABELS) as TeamPermission[]).map((permission) => {
                    const isDefault = defaultPermissions.includes(permission)
                    const isSelected = effectivePermissions.includes(permission)

                    return (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission}
                          checked={isSelected}
                          disabled={!isDefault}
                          onCheckedChange={() => handlePermissionToggle(permission)}
                        />
                        <Label
                          htmlFor={permission}
                          className={`text-xs font-normal ${!isDefault ? 'text-muted-foreground' : ''}`}
                        >
                          {PERMISSION_LABELS[permission]}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={inviteMember.isPending || !email.trim()}>
              {inviteMember.isPending ? '초대 중...' : '초대하기'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
