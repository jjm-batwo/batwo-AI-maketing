'use client'

import { useState } from 'react'
import { useTeams, useCreateTeam, useDeleteTeam, Team } from '@/presentation/hooks/useTeams'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Plus, Users, MoreVertical, Settings, Trash2, Crown, Shield, User, Eye } from 'lucide-react'
import Link from 'next/link'

const ROLE_ICONS = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
  VIEWER: Eye,
}

const ROLE_LABELS = {
  OWNER: '소유자',
  ADMIN: '관리자',
  MEMBER: '멤버',
  VIEWER: '뷰어',
}

const ROLE_COLORS = {
  OWNER: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  MEMBER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  VIEWER: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

interface CreateTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CreateTeamDialog({ open, onOpenChange }: CreateTeamDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const createTeam = useCreateTeam()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createTeam.mutateAsync({
        name,
        description: description || undefined,
      })
      setName('')
      setDescription('')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create team:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 팀 만들기</DialogTitle>
          <DialogDescription>팀을 만들어 멤버들과 함께 캠페인을 관리하세요.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">팀 이름</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="마케팅 팀"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명 (선택)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="팀에 대한 설명을 입력하세요"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={createTeam.isPending || !name.trim()}>
              {createTeam.isPending ? '생성 중...' : '팀 만들기'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface TeamCardProps {
  team: Team
  onDelete: (team: Team) => void
}

function TeamCard({ team, onDelete }: TeamCardProps) {
  const RoleIcon = ROLE_ICONS[team.role]

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg">{team.name}</CardTitle>
          {team.description && (
            <CardDescription className="line-clamp-2">{team.description}</CardDescription>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/settings/teams/${team.id}`}>
                <Settings className="mr-2 h-4 w-4" />
                팀 설정
              </Link>
            </DropdownMenuItem>
            {team.isOwner && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(team)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                팀 삭제
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {team.memberCount} / {team.maxMembers} 멤버
            </span>
          </div>
          <Badge variant="secondary" className={ROLE_COLORS[team.role]}>
            <RoleIcon className="mr-1 h-3 w-3" />
            {ROLE_LABELS[team.role]}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export function TeamList() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null)

  const { data: teams, isLoading, error } = useTeams()
  const deleteTeam = useDeleteTeam()

  const handleDeleteClick = (team: Team) => {
    setTeamToDelete(team)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!teamToDelete) return
    try {
      await deleteTeam.mutateAsync(teamToDelete.id)
      setDeleteDialogOpen(false)
      setTeamToDelete(null)
    } catch (error) {
      console.error('Failed to delete team:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-10 w-28 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-destructive mb-4">팀 목록을 불러오는데 실패했습니다.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">내 팀</h2>
          <p className="text-muted-foreground">
            팀을 만들어 멤버들과 함께 캠페인을 관리하세요.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          새 팀 만들기
        </Button>
      </div>

      {teams && teams.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} onDelete={handleDeleteClick} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">아직 팀이 없습니다</h3>
            <p className="text-muted-foreground text-center mb-4">
              새 팀을 만들어 멤버들과 함께 캠페인을 관리해보세요.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              첫 번째 팀 만들기
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateTeamDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>팀을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{teamToDelete?.name}&quot; 팀을 삭제하면 모든 팀 데이터가 영구적으로 삭제됩니다.
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTeam.isPending ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
