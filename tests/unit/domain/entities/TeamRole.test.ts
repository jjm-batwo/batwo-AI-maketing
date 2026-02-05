import { describe, test, expect } from 'vitest'
import { TeamRoleEntity, TeamRoleName } from '@/domain/entities/TeamRole'
import { Permission } from '@/domain/value-objects/Permission'

describe('TeamRoleEntity', () => {
  describe('create', () => {
    test('사용자 정의 역할 생성', () => {
      const permissions = [
        Permission.create('campaign', 'read'),
        Permission.create('campaign', 'create'),
      ]

      const role = TeamRoleEntity.create({
        name: 'editor',
        permissions,
      })

      expect(role.id).toBeDefined()
      expect(role.name).toBe('editor')
      expect(role.permissions).toHaveLength(2)
      expect(role.createdAt).toBeInstanceOf(Date)
    })

    test('권한 없이 역할 생성', () => {
      const role = TeamRoleEntity.create({
        name: 'viewer',
        permissions: [],
      })

      expect(role.permissions).toHaveLength(0)
    })
  })

  describe('createOwner', () => {
    test('Owner 역할은 모든 권한 보유', () => {
      const role = TeamRoleEntity.createOwner()

      expect(role.name).toBe('owner')
      expect(role.permissions.length).toBeGreaterThan(0)

      // Owner는 모든 리소스에 대한 모든 권한 보유
      expect(role.hasPermission(Permission.create('team', 'manage'))).toBe(true)
      expect(role.hasPermission(Permission.create('member', 'manage'))).toBe(true)
      expect(role.hasPermission(Permission.create('campaign', 'delete'))).toBe(true)
      expect(role.hasPermission(Permission.create('settings', 'update'))).toBe(true)
    })
  })

  describe('createAdmin', () => {
    test('Admin 역할은 멤버 관리 및 설정 권한 보유', () => {
      const role = TeamRoleEntity.createAdmin()

      expect(role.name).toBe('admin')

      // Admin 권한 확인
      expect(role.hasPermission(Permission.create('member', 'manage'))).toBe(true)
      expect(role.hasPermission(Permission.create('settings', 'update'))).toBe(true)
      expect(role.hasPermission(Permission.create('campaign', 'create'))).toBe(true)
      expect(role.hasPermission(Permission.create('campaign', 'update'))).toBe(true)
      expect(role.hasPermission(Permission.create('campaign', 'delete'))).toBe(true)

      // Admin은 팀 삭제 권한 없음
      expect(role.hasPermission(Permission.create('team', 'delete'))).toBe(false)
    })
  })

  describe('createEditor', () => {
    test('Editor 역할은 캠페인 및 보고서 CRUD 권한 보유', () => {
      const role = TeamRoleEntity.createEditor()

      expect(role.name).toBe('editor')

      // Editor 권한 확인
      expect(role.hasPermission(Permission.create('campaign', 'create'))).toBe(true)
      expect(role.hasPermission(Permission.create('campaign', 'read'))).toBe(true)
      expect(role.hasPermission(Permission.create('campaign', 'update'))).toBe(true)
      expect(role.hasPermission(Permission.create('campaign', 'delete'))).toBe(true)
      expect(role.hasPermission(Permission.create('report', 'create'))).toBe(true)
      expect(role.hasPermission(Permission.create('report', 'read'))).toBe(true)

      // Editor는 멤버 관리 권한 없음
      expect(role.hasPermission(Permission.create('member', 'manage'))).toBe(false)
      expect(role.hasPermission(Permission.create('settings', 'update'))).toBe(false)
    })
  })

  describe('createViewer', () => {
    test('Viewer 역할은 읽기 전용 권한만 보유', () => {
      const role = TeamRoleEntity.createViewer()

      expect(role.name).toBe('viewer')

      // Viewer 권한 확인
      expect(role.hasPermission(Permission.create('dashboard', 'read'))).toBe(true)
      expect(role.hasPermission(Permission.create('campaign', 'read'))).toBe(true)
      expect(role.hasPermission(Permission.create('report', 'read'))).toBe(true)

      // Viewer는 쓰기 권한 없음
      expect(role.hasPermission(Permission.create('campaign', 'create'))).toBe(false)
      expect(role.hasPermission(Permission.create('campaign', 'update'))).toBe(false)
      expect(role.hasPermission(Permission.create('campaign', 'delete'))).toBe(false)
      expect(role.hasPermission(Permission.create('member', 'manage'))).toBe(false)
    })
  })

  describe('hasPermission', () => {
    test('역할이 특정 권한을 가지고 있는지 확인', () => {
      const permissions = [
        Permission.create('campaign', 'read'),
        Permission.create('campaign', 'create'),
      ]
      const role = TeamRoleEntity.create({ name: 'editor', permissions })

      expect(role.hasPermission(Permission.create('campaign', 'read'))).toBe(true)
      expect(role.hasPermission(Permission.create('campaign', 'create'))).toBe(true)
      expect(role.hasPermission(Permission.create('campaign', 'delete'))).toBe(false)
      expect(role.hasPermission(Permission.create('report', 'read'))).toBe(false)
    })
  })

  describe('canManageRole', () => {
    test('Owner는 Owner를 제외한 모든 역할 관리 가능', () => {
      const owner = TeamRoleEntity.createOwner()
      const admin = TeamRoleEntity.createAdmin()
      const editor = TeamRoleEntity.createEditor()
      const viewer = TeamRoleEntity.createViewer()

      expect(owner.canManageRole(owner)).toBe(false) // 자기 자신 불가
      expect(owner.canManageRole(admin)).toBe(true)
      expect(owner.canManageRole(editor)).toBe(true)
      expect(owner.canManageRole(viewer)).toBe(true)
    })

    test('Admin은 Editor와 Viewer만 관리 가능', () => {
      const owner = TeamRoleEntity.createOwner()
      const admin = TeamRoleEntity.createAdmin()
      const editor = TeamRoleEntity.createEditor()
      const viewer = TeamRoleEntity.createViewer()

      expect(admin.canManageRole(owner)).toBe(false)
      expect(admin.canManageRole(admin)).toBe(false) // 자기 자신 불가
      expect(admin.canManageRole(editor)).toBe(true)
      expect(admin.canManageRole(viewer)).toBe(true)
    })

    test('Editor는 아무도 관리 불가', () => {
      const owner = TeamRoleEntity.createOwner()
      const admin = TeamRoleEntity.createAdmin()
      const editor = TeamRoleEntity.createEditor()
      const viewer = TeamRoleEntity.createViewer()

      expect(editor.canManageRole(owner)).toBe(false)
      expect(editor.canManageRole(admin)).toBe(false)
      expect(editor.canManageRole(editor)).toBe(false)
      expect(editor.canManageRole(viewer)).toBe(false)
    })

    test('Viewer는 아무도 관리 불가', () => {
      const owner = TeamRoleEntity.createOwner()
      const viewer = TeamRoleEntity.createViewer()

      expect(viewer.canManageRole(owner)).toBe(false)
      expect(viewer.canManageRole(viewer)).toBe(false)
    })
  })

  describe('immutability', () => {
    test('TeamRoleEntity는 불변 객체', () => {
      const role = TeamRoleEntity.createEditor()

      // @ts-expect-error - Testing immutability
      expect(() => { role.name = 'admin' }).toThrow()
      // @ts-expect-error - Testing immutability
      expect(() => { role.permissions = [] }).toThrow()
    })

    test('permissions 배열은 복사본 반환', () => {
      const role = TeamRoleEntity.createEditor()
      const permissions1 = role.permissions
      const permissions2 = role.permissions

      expect(permissions1).not.toBe(permissions2) // 다른 인스턴스
      expect(permissions1).toEqual(permissions2) // 같은 내용
    })
  })

  describe('role hierarchy', () => {
    test('역할 계층 구조 확인', () => {
      const owner = TeamRoleEntity.createOwner()
      const admin = TeamRoleEntity.createAdmin()
      const editor = TeamRoleEntity.createEditor()
      const viewer = TeamRoleEntity.createViewer()

      // Owner > Admin > Editor > Viewer 순서로 권한이 많음
      expect(owner.permissions.length).toBeGreaterThan(admin.permissions.length)
      expect(admin.permissions.length).toBeGreaterThan(editor.permissions.length)
      expect(editor.permissions.length).toBeGreaterThan(viewer.permissions.length)
    })
  })
})
