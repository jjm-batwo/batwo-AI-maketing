import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { PermissionGuard, withPermission } from '@/presentation/components/common/PermissionGuard'

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
      },
    },
  })
  return function QueryClientWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('PermissionGuard', () => {
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

  it('should show children when permission is granted', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ hasPermission: true }),
    } as Response)

    render(
      <PermissionGuard permission="campaign:create" teamId="team-123">
        <button>Create Campaign</button>
      </PermissionGuard>,
      { wrapper: createQueryClientWrapper() }
    )

    await waitFor(() => {
      expect(screen.getByText('Create Campaign')).toBeInTheDocument()
    })
  })

  it('should show fallback when permission is denied', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ hasPermission: false }),
    } as Response)

    render(
      <PermissionGuard
        permission="campaign:delete"
        teamId="team-123"
        fallback={<div>No Permission</div>}
      >
        <button>Delete Campaign</button>
      </PermissionGuard>,
      { wrapper: createQueryClientWrapper() }
    )

    await waitFor(() => {
      expect(screen.getByText('No Permission')).toBeInTheDocument()
    })

    expect(screen.queryByText('Delete Campaign')).not.toBeInTheDocument()
  })

  it('should show loading state while checking', () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

    render(
      <PermissionGuard permission="campaign:create" teamId="team-123">
        <button>Create Campaign</button>
      </PermissionGuard>,
      { wrapper: createQueryClientWrapper() }
    )

    // Should show skeleton loader by default
    const skeleton = document.querySelector('.h-8.w-24')
    expect(skeleton).toBeInTheDocument()
  })

  it('should show custom loading fallback', () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

    render(
      <PermissionGuard
        permission="campaign:create"
        teamId="team-123"
        loadingFallback={<div>Checking permissions...</div>}
      >
        <button>Create Campaign</button>
      </PermissionGuard>,
      { wrapper: createQueryClientWrapper() }
    )

    expect(screen.getByText('Checking permissions...')).toBeInTheDocument()
  })

  it('should show nothing when permission denied and no fallback', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ hasPermission: false }),
    } as Response)

    const { container } = render(
      <PermissionGuard permission="campaign:delete" teamId="team-123">
        <button>Delete Campaign</button>
      </PermissionGuard>,
      { wrapper: createQueryClientWrapper() }
    )

    await waitFor(() => {
      expect(screen.queryByText('Delete Campaign')).not.toBeInTheDocument()
    })

    // Container should be empty or only have empty fragment
    expect(container.textContent).toBe('')
  })

  it('should handle missing teamId gracefully', () => {
    render(
      <PermissionGuard permission="campaign:create">
        <button>Create Campaign</button>
      </PermissionGuard>,
      { wrapper: createQueryClientWrapper() }
    )

    expect(fetch).not.toHaveBeenCalled()
    expect(screen.queryByText('Create Campaign')).not.toBeInTheDocument()
  })
})

describe('withPermission HOC', () => {
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

  it('should wrap component with permission check', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ hasPermission: true }),
    } as Response)

    const TestComponent = ({ name }: { name: string }) => <div>Hello, {name}!</div>

    const WrappedComponent = withPermission(
      TestComponent,
      'campaign:create',
      {
        getTeamId: () => 'team-123',
      }
    )

    render(<WrappedComponent name="User" />, {
      wrapper: createQueryClientWrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText('Hello, User!')).toBeInTheDocument()
    })
  })

  it('should show fallback when permission denied', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ hasPermission: false }),
    } as Response)

    const TestComponent = ({ name }: { name: string }) => <div>Hello, {name}!</div>

    const WrappedComponent = withPermission(
      TestComponent,
      'campaign:delete',
      {
        getTeamId: () => 'team-123',
        fallback: <div>Access Denied</div>,
      }
    )

    render(<WrappedComponent name="User" />, {
      wrapper: createQueryClientWrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
    })

    expect(screen.queryByText('Hello, User!')).not.toBeInTheDocument()
  })

  it('should extract teamId from props', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ hasPermission: true }),
    } as Response)

    const TestComponent = ({ teamId, name }: { teamId: string; name: string }) => (
      <div>Team: {teamId}, User: {name}</div>
    )

    const WrappedComponent = withPermission(
      TestComponent,
      'campaign:create',
      {
        getTeamId: (props) => props.teamId,
      }
    )

    render(<WrappedComponent teamId="team-456" name="User" />, {
      wrapper: createQueryClientWrapper(),
    })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/permissions/check?teamId=team-456&permission=campaign:create')
    })

    await waitFor(() => {
      expect(screen.getByText('Team: team-456, User: User')).toBeInTheDocument()
    })
  })
})
