/**
 * Tests for Permission Middleware
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { withPermission, withAnyPermission } from '@/app/api/middleware/withPermission'

// Mock dependencies
vi.mock('@/infrastructure/auth/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/di/container', () => ({
  container: {
    resolve: vi.fn(),
  },
  DI_TOKENS: {
    PermissionService: Symbol.for('PermissionService'),
  },
}))

import { auth } from '@/infrastructure/auth/auth'
import { container } from '@/lib/di/container'

describe('withPermission', () => {
  const mockHandler = vi.fn()
  const mockCheckPermission = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock implementations
    vi.mocked(container.resolve).mockReturnValue({
      checkPermission: mockCheckPermission,
    })
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const handler = withPermission(mockHandler, {
        permission: 'campaign:create',
      })

      const request = new NextRequest('http://localhost/api/teams/team-123/campaigns')
      const context = { params: Promise.resolve({ teamId: 'team-123' }) }

      const response = await handler(request, context)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: 'Unauthorized',
        message: 'Authentication required',
      })
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should return 401 when session has no user', async () => {
      vi.mocked(auth).mockResolvedValue({ user: null } as any)

      const handler = withPermission(mockHandler, {
        permission: 'campaign:create',
      })

      const request = new NextRequest('http://localhost/api/teams/team-123/campaigns')
      const context = { params: Promise.resolve({ teamId: 'team-123' }) }

      const response = await handler(request, context)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should return 401 when session user has no id', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { email: 'test@example.com' } } as any)

      const handler = withPermission(mockHandler, {
        permission: 'campaign:create',
      })

      const request = new NextRequest('http://localhost/api/teams/team-123/campaigns')
      const context = { params: Promise.resolve({ teamId: 'team-123' }) }

      const response = await handler(request, context)

      expect(response.status).toBe(401)
      expect(mockHandler).not.toHaveBeenCalled()
    })
  })

  describe('TeamId Extraction', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any)
    })

    it('should extract teamId from URL params (default)', async () => {
      mockCheckPermission.mockResolvedValue(true)
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }))

      const handler = withPermission(mockHandler, {
        permission: 'campaign:create',
      })

      const request = new NextRequest('http://localhost/api/teams/team-123/campaigns')
      const context = { params: Promise.resolve({ teamId: 'team-123' }) }

      await handler(request, context)

      expect(mockCheckPermission).toHaveBeenCalledWith(
        'user-123',
        'team-123',
        'campaign:create'
      )
      expect(mockHandler).toHaveBeenCalled()
    })

    it('should extract teamId from URL params with custom param name', async () => {
      mockCheckPermission.mockResolvedValue(true)
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }))

      const handler = withPermission(mockHandler, {
        permission: 'campaign:create',
        teamIdSource: 'param',
        paramName: 'id',
      })

      const request = new NextRequest('http://localhost/api/teams/team-123/settings')
      const context = { params: Promise.resolve({ id: 'team-123' }) }

      await handler(request, context)

      expect(mockCheckPermission).toHaveBeenCalledWith(
        'user-123',
        'team-123',
        'campaign:create'
      )
      expect(mockHandler).toHaveBeenCalled()
    })

    it('should extract teamId from query string', async () => {
      mockCheckPermission.mockResolvedValue(true)
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }))

      const handler = withPermission(mockHandler, {
        permission: 'campaign:read',
        teamIdSource: 'query',
      })

      const request = new NextRequest(
        'http://localhost/api/campaigns?teamId=team-123'
      )
      const context = { params: Promise.resolve({}) }

      await handler(request, context)

      expect(mockCheckPermission).toHaveBeenCalledWith(
        'user-123',
        'team-123',
        'campaign:read'
      )
      expect(mockHandler).toHaveBeenCalled()
    })

    it('should extract teamId from header', async () => {
      mockCheckPermission.mockResolvedValue(true)
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }))

      const handler = withPermission(mockHandler, {
        permission: 'campaign:update',
        teamIdSource: 'header',
      })

      const request = new NextRequest('http://localhost/api/campaigns/camp-123', {
        headers: { 'X-Team-Id': 'team-123' },
      })
      const context = { params: Promise.resolve({}) }

      await handler(request, context)

      expect(mockCheckPermission).toHaveBeenCalledWith(
        'user-123',
        'team-123',
        'campaign:update'
      )
      expect(mockHandler).toHaveBeenCalled()
    })

    it('should return 400 when teamId is missing from params', async () => {
      const handler = withPermission(mockHandler, {
        permission: 'campaign:create',
        teamIdSource: 'param',
      })

      const request = new NextRequest('http://localhost/api/teams/campaigns')
      const context = { params: Promise.resolve({}) }

      const response = await handler(request, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Bad Request',
        message: 'Team ID is required',
      })
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should return 400 when teamId is missing from query', async () => {
      const handler = withPermission(mockHandler, {
        permission: 'campaign:read',
        teamIdSource: 'query',
      })

      const request = new NextRequest('http://localhost/api/campaigns')
      const context = { params: Promise.resolve({}) }

      const response = await handler(request, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe('Team ID is required')
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should return 400 when teamId is missing from header', async () => {
      const handler = withPermission(mockHandler, {
        permission: 'campaign:read',
        teamIdSource: 'header',
      })

      const request = new NextRequest('http://localhost/api/campaigns')
      const context = { params: Promise.resolve({}) }

      const response = await handler(request, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe('Team ID is required')
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should return 400 when params extraction throws error', async () => {
      const handler = withPermission(mockHandler, {
        permission: 'campaign:create',
      })

      const request = new NextRequest('http://localhost/api/teams/team-123/campaigns')
      const context = { params: Promise.reject(new Error('Invalid params')) }

      const response = await handler(request, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Bad Request',
        message: 'Invalid request parameters',
      })
      expect(mockHandler).not.toHaveBeenCalled()
    })
  })

  describe('Permission Check', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any)
    })

    it('should return 403 when user lacks permission', async () => {
      mockCheckPermission.mockResolvedValue(false)

      const handler = withPermission(mockHandler, {
        permission: 'campaign:delete',
      })

      const request = new NextRequest('http://localhost/api/teams/team-123/campaigns')
      const context = { params: Promise.resolve({ teamId: 'team-123' }) }

      const response = await handler(request, context)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toEqual({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      })
      expect(mockCheckPermission).toHaveBeenCalledWith(
        'user-123',
        'team-123',
        'campaign:delete'
      )
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should call handler when user has permission', async () => {
      mockCheckPermission.mockResolvedValue(true)
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }))

      const handler = withPermission(mockHandler, {
        permission: 'campaign:create',
      })

      const request = new NextRequest('http://localhost/api/teams/team-123/campaigns')
      const context = { params: Promise.resolve({ teamId: 'team-123' }) }

      const response = await handler(request, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
      expect(mockCheckPermission).toHaveBeenCalledWith(
        'user-123',
        'team-123',
        'campaign:create'
      )
      expect(mockHandler).toHaveBeenCalledWith(request, context)
    })

    it('should return 500 when permission check throws error', async () => {
      mockCheckPermission.mockRejectedValue(new Error('Database error'))

      const handler = withPermission(mockHandler, {
        permission: 'campaign:read',
      })

      const request = new NextRequest('http://localhost/api/teams/team-123/campaigns')
      const context = { params: Promise.resolve({ teamId: 'team-123' }) }

      const response = await handler(request, context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Internal Server Error',
        message: 'Permission check failed',
      })
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should return 500 when container.resolve throws error', async () => {
      vi.mocked(container.resolve).mockImplementation(() => {
        throw new Error('Container error')
      })

      const handler = withPermission(mockHandler, {
        permission: 'campaign:read',
      })

      const request = new NextRequest('http://localhost/api/teams/team-123/campaigns')
      const context = { params: Promise.resolve({ teamId: 'team-123' }) }

      const response = await handler(request, context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
      expect(mockHandler).not.toHaveBeenCalled()
    })
  })
})

describe('withAnyPermission', () => {
  const mockHandler = vi.fn()
  const mockCheckPermission = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(container.resolve).mockReturnValue({
      checkPermission: mockCheckPermission,
    })
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const handler = withAnyPermission(mockHandler, {
        permissions: ['campaign:read', 'campaign:manage'],
      })

      const request = new NextRequest('http://localhost/api/teams/team-123/campaigns')
      const context = { params: Promise.resolve({ teamId: 'team-123' }) }

      const response = await handler(request, context)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(mockHandler).not.toHaveBeenCalled()
    })
  })

  describe('OR Logic Permission Check', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any)
    })

    it('should call handler when user has first permission', async () => {
      mockCheckPermission
        .mockResolvedValueOnce(true) // campaign:read = true
        .mockResolvedValueOnce(false) // campaign:manage = false

      mockHandler.mockResolvedValue(NextResponse.json({ data: [] }))

      const handler = withAnyPermission(mockHandler, {
        permissions: ['campaign:read', 'campaign:manage'],
      })

      const request = new NextRequest('http://localhost/api/teams/team-123/campaigns')
      const context = { params: Promise.resolve({ teamId: 'team-123' }) }

      const response = await handler(request, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ data: [] })
      expect(mockCheckPermission).toHaveBeenCalledTimes(2)
      expect(mockCheckPermission).toHaveBeenCalledWith(
        'user-123',
        'team-123',
        'campaign:read'
      )
      expect(mockCheckPermission).toHaveBeenCalledWith(
        'user-123',
        'team-123',
        'campaign:manage'
      )
      expect(mockHandler).toHaveBeenCalled()
    })

    it('should call handler when user has second permission', async () => {
      mockCheckPermission
        .mockResolvedValueOnce(false) // campaign:read = false
        .mockResolvedValueOnce(true) // campaign:manage = true

      mockHandler.mockResolvedValue(NextResponse.json({ data: [] }))

      const handler = withAnyPermission(mockHandler, {
        permissions: ['campaign:read', 'campaign:manage'],
      })

      const request = new NextRequest('http://localhost/api/teams/team-123/campaigns')
      const context = { params: Promise.resolve({ teamId: 'team-123' }) }

      const response = await handler(request, context)

      expect(response.status).toBe(200)
      expect(mockHandler).toHaveBeenCalled()
    })

    it('should call handler when user has all permissions', async () => {
      mockCheckPermission.mockResolvedValue(true)
      mockHandler.mockResolvedValue(NextResponse.json({ data: [] }))

      const handler = withAnyPermission(mockHandler, {
        permissions: ['campaign:read', 'campaign:update', 'campaign:delete'],
      })

      const request = new NextRequest('http://localhost/api/teams/team-123/campaigns')
      const context = { params: Promise.resolve({ teamId: 'team-123' }) }

      const response = await handler(request, context)

      expect(response.status).toBe(200)
      expect(mockCheckPermission).toHaveBeenCalledTimes(3)
      expect(mockHandler).toHaveBeenCalled()
    })

    it('should return 403 when user has none of the permissions', async () => {
      mockCheckPermission.mockResolvedValue(false)

      const handler = withAnyPermission(mockHandler, {
        permissions: ['campaign:read', 'campaign:manage'],
      })

      const request = new NextRequest('http://localhost/api/teams/team-123/campaigns')
      const context = { params: Promise.resolve({ teamId: 'team-123' }) }

      const response = await handler(request, context)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toEqual({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      })
      expect(mockCheckPermission).toHaveBeenCalledTimes(2)
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should return 500 when permission check throws error', async () => {
      mockCheckPermission.mockRejectedValue(new Error('Database error'))

      const handler = withAnyPermission(mockHandler, {
        permissions: ['campaign:read', 'campaign:manage'],
      })

      const request = new NextRequest('http://localhost/api/teams/team-123/campaigns')
      const context = { params: Promise.resolve({ teamId: 'team-123' }) }

      const response = await handler(request, context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
      expect(mockHandler).not.toHaveBeenCalled()
    })
  })

  describe('TeamId Extraction', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any)
    })

    it('should support query string extraction', async () => {
      mockCheckPermission.mockResolvedValue(true)
      mockHandler.mockResolvedValue(NextResponse.json({ data: [] }))

      const handler = withAnyPermission(mockHandler, {
        permissions: ['campaign:read'],
        teamIdSource: 'query',
      })

      const request = new NextRequest(
        'http://localhost/api/campaigns?teamId=team-456'
      )
      const context = { params: Promise.resolve({}) }

      await handler(request, context)

      expect(mockCheckPermission).toHaveBeenCalledWith(
        'user-123',
        'team-456',
        'campaign:read'
      )
      expect(mockHandler).toHaveBeenCalled()
    })

    it('should support header extraction', async () => {
      mockCheckPermission.mockResolvedValue(true)
      mockHandler.mockResolvedValue(NextResponse.json({ data: [] }))

      const handler = withAnyPermission(mockHandler, {
        permissions: ['campaign:read'],
        teamIdSource: 'header',
      })

      const request = new NextRequest('http://localhost/api/campaigns', {
        headers: { 'X-Team-Id': 'team-789' },
      })
      const context = { params: Promise.resolve({}) }

      await handler(request, context)

      expect(mockCheckPermission).toHaveBeenCalledWith(
        'user-123',
        'team-789',
        'campaign:read'
      )
      expect(mockHandler).toHaveBeenCalled()
    })

    it('should return 400 when teamId is missing', async () => {
      const handler = withAnyPermission(mockHandler, {
        permissions: ['campaign:read'],
        teamIdSource: 'query',
      })

      const request = new NextRequest('http://localhost/api/campaigns')
      const context = { params: Promise.resolve({}) }

      const response = await handler(request, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe('Team ID is required')
      expect(mockHandler).not.toHaveBeenCalled()
    })
  })
})
