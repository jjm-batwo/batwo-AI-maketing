import { describe, test, expect } from 'vitest'
import { Permission, Resource, Action } from '@/domain/value-objects/Permission'

describe('Permission Value Object', () => {
  describe('create', () => {
    test('유효한 리소스와 액션으로 Permission 생성', () => {
      const permission = Permission.create('campaign', 'create')

      expect(permission.resource).toBe('campaign')
      expect(permission.action).toBe('create')
    })

    test('모든 리소스 타입으로 Permission 생성 가능', () => {
      const resources: Resource[] = ['team', 'member', 'campaign', 'report', 'settings', 'dashboard']

      resources.forEach(resource => {
        const permission = Permission.create(resource, 'read')
        expect(permission.resource).toBe(resource)
      })
    })

    test('모든 액션 타입으로 Permission 생성 가능', () => {
      const actions: Action[] = ['create', 'read', 'update', 'delete', 'manage']

      actions.forEach(action => {
        const permission = Permission.create('campaign', action)
        expect(permission.action).toBe(action)
      })
    })
  })

  describe('fromString', () => {
    test('문자열 형식에서 Permission 파싱', () => {
      const permission = Permission.fromString('campaign:create')

      expect(permission.resource).toBe('campaign')
      expect(permission.action).toBe('create')
    })

    test('다양한 형식의 문자열 파싱', () => {
      const testCases = [
        { str: 'team:manage', resource: 'team', action: 'manage' },
        { str: 'member:delete', resource: 'member', action: 'delete' },
        { str: 'report:read', resource: 'report', action: 'read' },
      ]

      testCases.forEach(({ str, resource, action }) => {
        const permission = Permission.fromString(str)
        expect(permission.resource).toBe(resource)
        expect(permission.action).toBe(action)
      })
    })

    test('잘못된 형식의 문자열은 에러 발생', () => {
      expect(() => Permission.fromString('invalid')).toThrow('Invalid permission format')
      expect(() => Permission.fromString('campaign')).toThrow('Invalid permission format')
      expect(() => Permission.fromString('campaign:invalid:extra')).toThrow('Invalid permission format')
    })

    test('잘못된 리소스는 에러 발생', () => {
      expect(() => Permission.fromString('invalid:read')).toThrow('Invalid resource')
    })

    test('잘못된 액션은 에러 발생', () => {
      expect(() => Permission.fromString('campaign:invalid')).toThrow('Invalid action')
    })
  })

  describe('toString', () => {
    test('Permission을 문자열로 변환', () => {
      const permission = Permission.create('campaign', 'create')

      expect(permission.toString()).toBe('campaign:create')
    })

    test('toString과 fromString은 양방향 변환 가능', () => {
      const original = Permission.create('report', 'update')
      const str = original.toString()
      const parsed = Permission.fromString(str)

      expect(parsed.equals(original)).toBe(true)
    })
  })

  describe('equals', () => {
    test('동일한 Permission은 같음', () => {
      const p1 = Permission.create('campaign', 'read')
      const p2 = Permission.create('campaign', 'read')

      expect(p1.equals(p2)).toBe(true)
    })

    test('리소스가 다르면 다름', () => {
      const p1 = Permission.create('campaign', 'read')
      const p2 = Permission.create('report', 'read')

      expect(p1.equals(p2)).toBe(false)
    })

    test('액션이 다르면 다름', () => {
      const p1 = Permission.create('campaign', 'read')
      const p2 = Permission.create('campaign', 'write')

      expect(p1.equals(p2)).toBe(false)
    })

    test('리소스와 액션 모두 다르면 다름', () => {
      const p1 = Permission.create('campaign', 'read')
      const p2 = Permission.create('report', 'write')

      expect(p1.equals(p2)).toBe(false)
    })
  })

  describe('immutability', () => {
    test('Permission은 불변 객체', () => {
      const permission = Permission.create('campaign', 'read')

      // @ts-expect-error - Testing immutability
      expect(() => { permission.resource = 'report' }).toThrow()
      // @ts-expect-error - Testing immutability
      expect(() => { permission.action = 'write' }).toThrow()
    })
  })
})
