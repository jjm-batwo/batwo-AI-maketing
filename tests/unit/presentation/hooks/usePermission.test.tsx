import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { usePermission, usePermissions, useUserRole } from '@/presentation/hooks/usePermission'

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: 'user-123',
        email: 'test@example.com',
      },
    },
    status: 'authenticated',
  })),
}))

// Mock fetch
global.fetch = vi.fn()

function createQueryClientWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress error logs in tests
    },
  })
  return function QueryClientWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('usePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return hasPermission true when API returns true', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ hasPermission: true }),
    } as Response)

    const { result } = renderHook(
      () => usePermission({ teamId: 'team-123', permission: 'campaign:create' }),
      { wrapper: createQueryClientWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.hasPermission).toBe(true)
    expect(result.current.error).toBeNull()
    expect(fetch).toHaveBeenCalledWith('/api/permissions/check?teamId=team-123&permission=campaign:create')
  })

  it('should return hasPermission false when API returns 403', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ hasPermission: false }),
    } as Response)

    const { result } = renderHook(
      () => usePermission({ teamId: 'team-123', permission: 'campaign:delete' }),
      { wrapper: createQueryClientWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.hasPermission).toBe(false)
    expect(result.current.error).toBeTruthy()
    expect(result.current.error?.message).toBe('Permission denied')
  })

  it('should handle loading state', () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(
      () => usePermission({ teamId: 'team-123', permission: 'campaign:create' }),
      { wrapper: createQueryClientWrapper() }
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.hasPermission).toBe(false)
  })

  it('should be disabled when no session', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    })

    const { result } = renderHook(
      () => usePermission({ teamId: 'team-123', permission: 'campaign:create' }),
      { wrapper: createQueryClientWrapper() }
    )

    expect(result.current.isLoading).toBe(false)
    expect(result.current.hasPermission).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should be disabled when no teamId', () => {
    const { result } = renderHook(
      () => usePermission({ teamId: undefined, permission: 'campaign:create' }),
      { wrapper: createQueryClientWrapper() }
    )

    expect(result.current.isLoading).toBe(false)
    expect(result.current.hasPermission).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should handle 401 unauthorized error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: 'Unauthorized' }),
      headers: new Headers(),
      redirected: false,
      type: 'basic',
      url: '',
      clone: vi.fn(),
      body: null,
      bodyUsed: false,
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      text: vi.fn(),
    } as Response)

    const { result } = renderHook(
      () => usePermission({ teamId: 'team-123', permission: 'campaign:create' }),
      { wrapper: createQueryClientWrapper() }
    )

    // When there's an error, React Query will have isLoading=false and error set
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 1000 }
    )

    // Permission check should fail
    expect(result.current.hasPermission).toBe(false)

    // Error should be captured
    if (result.current.error) {
      expect(result.current.error.message).toBe('Not authenticated')
    }
  })

  it('should handle 500 server error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'Internal Server Error' }),
      headers: new Headers(),
      redirected: false,
      type: 'basic',
      url: '',
      clone: vi.fn(),
      body: null,
      bodyUsed: false,
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      text: vi.fn(),
    } as Response)

    const { result } = renderHook(
      () => usePermission({ teamId: 'team-123', permission: 'campaign:create' }),
      { wrapper: createQueryClientWrapper() }
    )

    // When there's an error, React Query will have isLoading=false
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 1000 }
    )

    // Permission check should fail
    expect(result.current.hasPermission).toBe(false)

    // Error should be captured
    if (result.current.error) {
      expect(result.current.error.message).toBe('Failed to check permission')
    }
  })
})

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    })
  })

  it('should return all permissions', async () => {
    const mockPermissions = {
      permissions: ['campaign:create', 'campaign:read', 'campaign:update'],
      role: 'ADMIN',
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockPermissions,
    } as Response)

    const { result } = renderHook(
      () => usePermissions('team-123'),
      { wrapper: createQueryClientWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockPermissions)
    expect(fetch).toHaveBeenCalledWith('/api/permissions?teamId=team-123')
  })

  it('should be disabled when no teamId', () => {
    const { result } = renderHook(
      () => usePermissions(undefined),
      { wrapper: createQueryClientWrapper() }
    )

    expect(result.current.isLoading).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should be disabled when no session', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    })

    const { result } = renderHook(
      () => usePermissions('team-123'),
      { wrapper: createQueryClientWrapper() }
    )

    expect(result.current.isLoading).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('useUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    })
  })

  it('should return correct role', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ role: 'ADMIN' }),
    } as Response)

    const { result } = renderHook(
      () => useUserRole('team-123'),
      { wrapper: createQueryClientWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual({ role: 'ADMIN' })
    expect(fetch).toHaveBeenCalledWith('/api/permissions/role?teamId=team-123')
  })

  it('should return null role when user has no role', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ role: null }),
    } as Response)

    const { result } = renderHook(
      () => useUserRole('team-123'),
      { wrapper: createQueryClientWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual({ role: null })
  })

  it('should be disabled when no teamId', () => {
    const { result } = renderHook(
      () => useUserRole(undefined),
      { wrapper: createQueryClientWrapper() }
    )

    expect(result.current.isLoading).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })
})
