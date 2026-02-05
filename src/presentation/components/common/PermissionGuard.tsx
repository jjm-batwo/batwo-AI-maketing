/**
 * PermissionGuard Component
 *
 * Conditionally renders children based on user permissions.
 * Shows fallback content when permission is denied.
 */

'use client'

import { ReactNode } from 'react'
import { usePermission } from '@/presentation/hooks/usePermission'
import { Skeleton } from '@/components/ui/skeleton'

interface PermissionGuardProps {
  /**
   * The permission string to check (e.g., "campaign:create")
   */
  permission: string

  /**
   * Team ID to check permission for
   */
  teamId?: string

  /**
   * Content to show when permission is denied
   */
  fallback?: ReactNode

  /**
   * Content to show while loading
   */
  loadingFallback?: ReactNode

  /**
   * Children to render when permission is granted
   */
  children: ReactNode
}

export function PermissionGuard({
  permission,
  teamId,
  fallback = null,
  loadingFallback,
  children,
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = usePermission({ teamId, permission })

  if (isLoading) {
    return <>{loadingFallback ?? <Skeleton className="h-8 w-24" />}</>
  }

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * HOC version for wrapping components
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: string,
  options?: {
    fallback?: ReactNode
    getTeamId?: (props: P) => string | undefined
  }
) {
  return function PermissionWrappedComponent(props: P) {
    const teamId = options?.getTeamId?.(props)

    return (
      <PermissionGuard
        permission={permission}
        teamId={teamId}
        fallback={options?.fallback}
      >
        <WrappedComponent {...props} />
      </PermissionGuard>
    )
  }
}
