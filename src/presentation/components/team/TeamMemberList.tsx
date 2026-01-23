'use client'

import { useState } from 'react'
import {
  useTeamMembers,
  useUpdateMember,
  useRemoveMember,
  TeamMember,
} from '@/presentation/hooks/useTeams'
import { TeamRole, DEFAULT_ROLE_PERMISSIONS } from '@/domain/entities/Team'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { InviteMemberDialog } from './InviteMemberDialog'
import {
  MoreHorizontal,
  UserPlus,
  Crown,
  Shield,
  User,
  Eye,
  Clock,
  Check,
  UserMinus,
  RefreshCw,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

const ROLE_CONFIG: Record<
  TeamRole,
  { icon: typeof Crown; label: string; color: string }
> = {
  OWNER: {
    icon: Crown,
    label: '소유자',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  ADMIN: {
    icon: Shield,
    label: '관리자',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  MEMBER: {
    icon: User,
    label: '멤버',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  VIEWER: {
    icon: Eye,
    label: '뷰어',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  },
}

const VALID_ROLES: TeamRole[] = ['ADMIN', 'MEMBER', 'VIEWER']

interface TeamMemberListProps {
  teamId: string
  currentUserRole: TeamRole
  currentUserId: string
}

export function TeamMemberList({ teamId, currentUserRole, currentUserId }: TeamMemberListProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null)

  const { data: members, isLoading, error, refetch } = useTeamMembers(teamId)
  const updateMember = useUpdateMember()
  const removeMember = useRemoveMember()

  const canManageTeam = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'
  const canInvite =
    currentUserRole === 'OWNER' ||
    currentUserRole === 'ADMIN' ||
    DEFAULT_ROLE_PERMISSIONS[currentUserRole].includes('team:invite')

  const handleRoleChange = async (member: TeamMember, newRole: TeamRole) => {
    try {
      await updateMember.mutateAsync({
        teamId,
        memberId: member.id,
        role: newRole,
      })
    } catch (error) {
      console.error('Failed to update role:', error)
    }
  }

  const handleRemoveClick = (member: TeamMember) => {
    setMemberToRemove(member)
    setRemoveDialogOpen(true)
  }

  const handleRemoveConfirm = async () => {
    if (!memberToRemove) return
    try {
      await removeMember.mutateAsync({
        teamId,
        memberId: memberToRemove.id,
      })
      setRemoveDialogOpen(false)
      setMemberToRemove(null)
    } catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-destructive mb-4">멤버 목록을 불러오는데 실패했습니다.</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  const activeMembers = members?.filter((m) => m.isActive) || []
  const pendingMembers = members?.filter((m) => m.isPending) || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>팀 멤버</CardTitle>
            <CardDescription>
              {activeMembers.length}명의 활성 멤버
              {pendingMembers.length > 0 && `, ${pendingMembers.length}명의 대기 중인 초대`}
            </CardDescription>
          </div>
          {canInvite && (
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              멤버 초대
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>멤버</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>참여일</TableHead>
                {canManageTeam && <TableHead className="w-[70px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((member) => {
                const roleConfig = ROLE_CONFIG[member.role]
                const RoleIcon = roleConfig.icon
                const isCurrentUser = member.userId === currentUserId
                const canModify = canManageTeam && member.role !== 'OWNER' && !isCurrentUser

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs">
                            {getInitials(member.name, member.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {member.name || member.email}
                            {isCurrentUser && (
                              <span className="text-muted-foreground ml-1">(나)</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={roleConfig.color}>
                        <RoleIcon className="mr-1 h-3 w-3" />
                        {roleConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.isPending ? (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          <Clock className="mr-1 h-3 w-3" />
                          초대 대기
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          <Check className="mr-1 h-3 w-3" />
                          활성
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.joinedAt
                        ? formatDistanceToNow(new Date(member.joinedAt), {
                            addSuffix: true,
                            locale: ko,
                          })
                        : formatDistanceToNow(new Date(member.invitedAt), {
                            addSuffix: true,
                            locale: ko,
                          }) + ' (초대됨)'}
                    </TableCell>
                    {canManageTeam && (
                      <TableCell>
                        {canModify && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>멤버 관리</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <Shield className="mr-2 h-4 w-4" />
                                  역할 변경
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {VALID_ROLES.map((role) => (
                                    <DropdownMenuItem
                                      key={role}
                                      onClick={() => handleRoleChange(member, role)}
                                      disabled={role === member.role}
                                    >
                                      {React.createElement(ROLE_CONFIG[role].icon, {
                                        className: 'mr-2 h-4 w-4',
                                      })}
                                      {ROLE_CONFIG[role].label}
                                      {role === member.role && ' (현재)'}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleRemoveClick(member)}
                              >
                                <UserMinus className="mr-2 h-4 w-4" />
                                멤버 제거
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InviteMemberDialog
        teamId={teamId}
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>멤버를 제거하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{memberToRemove?.name || memberToRemove?.email}&quot;을(를) 팀에서 제거합니다.
              이 멤버는 더 이상 팀 리소스에 접근할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMember.isPending ? '제거 중...' : '제거'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Need to import React for createElement
import React from 'react'
