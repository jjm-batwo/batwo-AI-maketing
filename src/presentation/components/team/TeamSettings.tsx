'use client'

import { useState } from 'react'
import { useTeam, useUpdateTeam, useDeleteTeam } from '@/presentation/hooks/useTeams'
import { TeamMemberList } from './TeamMemberList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Settings, Users, AlertTriangle, Loader2, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TeamSettingsProps {
  teamId: string
  userId: string
}

export function TeamSettings({ teamId, userId }: TeamSettingsProps) {
  const router = useRouter()
  const { data, isLoading, error } = useTeam(teamId)
  const updateTeam = useUpdateTeam()
  const deleteTeam = useDeleteTeam()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  // Initialize form with team data
  const initializeForm = () => {
    if (data?.team) {
      setName(data.team.name)
      setDescription(data.team.description || '')
      setHasChanges(false)
    }
  }

  // Effect to initialize form when data loads
  if (data?.team && !name && !hasChanges) {
    initializeForm()
  }

  const handleNameChange = (value: string) => {
    setName(value)
    setHasChanges(true)
    setUpdateSuccess(false)
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    setHasChanges(true)
    setUpdateSuccess(false)
  }

  const handleSave = async () => {
    setUpdateError(null)
    try {
      await updateTeam.mutateAsync({
        teamId,
        name: name.trim(),
        description: description.trim() || undefined,
      })
      setHasChanges(false)
      setUpdateSuccess(true)
      setTimeout(() => setUpdateSuccess(false), 3000)
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : '저장에 실패했습니다.')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTeam.mutateAsync(teamId)
      router.push('/settings/teams')
    } catch (err) {
      console.error('Failed to delete team:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive mb-4">팀 정보를 불러오는데 실패했습니다.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { team, currentUserRole, currentUserPermissions } = data
  const isOwner = currentUserRole === 'OWNER'
  const canManageTeam = isOwner || currentUserRole === 'ADMIN'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings/teams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
          <p className="text-muted-foreground">팀 설정 및 멤버 관리</p>
        </div>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            멤버
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            설정
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <TeamMemberList
            teamId={teamId}
            currentUserRole={currentUserRole}
            currentUserId={userId}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>팀의 기본 정보를 수정합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {updateError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              )}

              {updateSuccess && (
                <Alert>
                  <AlertDescription className="text-green-600">
                    변경사항이 저장되었습니다.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">팀 이름</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  disabled={!canManageTeam}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  disabled={!canManageTeam}
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">{description.length}/500</p>
              </div>

              {canManageTeam && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={initializeForm}
                    disabled={!hasChanges || updateTeam.isPending}
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!hasChanges || !name.trim() || updateTeam.isPending}
                  >
                    {updateTeam.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      '저장'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>팀 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">팀 ID</span>
                <span className="font-mono">{team.id}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">멤버 수</span>
                <span>
                  {team.memberCount} / {team.maxMembers}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">생성일</span>
                <span>{new Date(team.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">내 역할</span>
                <span>{currentUserRole}</span>
              </div>
            </CardContent>
          </Card>

          {isOwner && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">위험 영역</CardTitle>
                <CardDescription>
                  팀을 삭제하면 모든 팀 데이터가 영구적으로 삭제됩니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  팀 삭제
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>팀을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{team.name}&quot; 팀을 삭제하면 모든 팀 데이터가 영구적으로 삭제됩니다.
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
