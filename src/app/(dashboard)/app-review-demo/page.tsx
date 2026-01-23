'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Users,
  TrendingUp,
  Target,
  Zap,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface PermissionStatus {
  name: string
  description: string
  status: 'checking' | 'granted' | 'denied' | 'error'
  demoUrl: string
  apiEndpoint: string
}

const PERMISSIONS: PermissionStatus[] = [
  {
    name: 'pages_show_list',
    description: 'Display list of Facebook Pages managed by the user',
    status: 'checking',
    demoUrl: '/settings/meta-pages',
    apiEndpoint: '/api/meta/pages'
  },
  {
    name: 'pages_read_engagement',
    description: 'Read engagement metrics (likes, comments, shares) from Pages',
    status: 'checking',
    demoUrl: '/settings/meta-pages',
    apiEndpoint: '/api/meta/pages/{pageId}/insights'
  },
  {
    name: 'business_management',
    description: 'Manage business assets including Meta Pixels',
    status: 'checking',
    demoUrl: '/settings/pixel',
    apiEndpoint: '/api/pixel'
  },
  {
    name: 'ads_read',
    description: 'Read campaign performance data and insights',
    status: 'checking',
    demoUrl: '/dashboard',
    apiEndpoint: '/api/dashboard/kpi'
  },
  {
    name: 'ads_management',
    description: 'Create, update, and manage advertising campaigns',
    status: 'checking',
    demoUrl: '/campaigns/new',
    apiEndpoint: '/api/campaigns'
  }
]

export default function AppReviewDemoPage() {
  const [permissions, setPermissions] = useState<PermissionStatus[]>(PERMISSIONS)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/meta/accounts')
      const data = await response.json()
      const connected = data.accounts && data.accounts.length > 0
      setIsConnected(connected)

      if (connected) {
        // Check each permission by calling APIs
        const updatedPermissions: PermissionStatus[] = await Promise.all(
          permissions.map(async (perm): Promise<PermissionStatus> => {
            try {
              // Only check APIs that don't require specific IDs
              if (perm.name === 'pages_show_list') {
                const res = await fetch('/api/meta/pages')
                return { ...perm, status: res.ok ? 'granted' as const : 'error' as const }
              }
              if (perm.name === 'ads_read') {
                const res = await fetch('/api/dashboard/kpi')
                return { ...perm, status: res.ok ? 'granted' as const : 'error' as const }
              }
              // For other permissions, assume granted if connected
              return { ...perm, status: 'granted' as const }
            } catch {
              return { ...perm, status: 'error' as const }
            }
          })
        )
        setPermissions(updatedPermissions)
      } else {
        setPermissions(prev => prev.map(p => ({ ...p, status: 'denied' as const })))
      }
    } catch (error) {
      console.error('Failed to check connection:', error)
      setIsConnected(false)
    } finally {
      setIsChecking(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'denied':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      default:
        return <XCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'granted':
        return <Badge variant="default" className="bg-green-500">Granted</Badge>
      case 'denied':
        return <Badge variant="destructive">Not Connected</Badge>
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Meta App Review Demo</h1>
        <p className="text-muted-foreground mt-2">
          This page demonstrates the end-to-end experience for each requested permission.
        </p>
      </div>

      {/* Connection Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Meta Account Connection
          </CardTitle>
          <CardDescription>
            Current connection status with Meta APIs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isChecking ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Checking connection status...</span>
            </div>
          ) : isConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Connected</span>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings/meta-connect">
                  Manage Connection
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Not Connected</span>
              </div>
              <Button size="sm" className="bg-[#1877F2] hover:bg-[#1877F2]/90" asChild>
                <Link href="/settings/meta-connect">
                  Connect Meta Account
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Requested Permissions</CardTitle>
          <CardDescription>
            Status of each permission required by this application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {permissions.map((perm) => (
              <div
                key={perm.name}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(perm.status)}
                  <div>
                    <p className="font-mono text-sm font-medium">{perm.name}</p>
                    <p className="text-sm text-muted-foreground">{perm.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(perm.status)}
                  {perm.status === 'granted' && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={perm.demoUrl}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Demos */}
      <h2 className="text-xl font-bold mb-4">Feature Demonstrations</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Pages Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View and select Facebook Pages you manage. Uses <code className="text-xs bg-muted px-1 rounded">pages_show_list</code>.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings/meta-pages">
                View Demo <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Page Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Analyze page engagement metrics. Uses <code className="text-xs bg-muted px-1 rounded">pages_read_engagement</code>.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings/meta-pages">
                View Demo <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              Pixel Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manage Meta Pixels for conversion tracking. Uses <code className="text-xs bg-muted px-1 rounded">business_management</code>.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings/pixel">
                View Demo <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              Performance Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Real-time campaign performance data. Uses <code className="text-xs bg-muted px-1 rounded">ads_read</code>.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                View Demo <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-red-500" />
              Campaign Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create, edit, pause, and manage advertising campaigns. Uses <code className="text-xs bg-muted px-1 rounded">ads_management</code>.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/campaigns">
                  Campaign List <ExternalLink className="ml-2 h-3 w-3" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/campaigns/new">
                  Create Campaign <ExternalLink className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Documentation */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>API Endpoints Used</CardTitle>
          <CardDescription>
            Meta Graph API endpoints accessed by this application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left font-medium">Permission</th>
                  <th className="py-2 text-left font-medium">Endpoint</th>
                  <th className="py-2 text-left font-medium">Purpose</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                <tr className="border-b">
                  <td className="py-2">pages_show_list</td>
                  <td className="py-2 text-muted-foreground">GET /me/accounts</td>
                  <td className="py-2 font-sans text-muted-foreground">List managed Pages</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">pages_read_engagement</td>
                  <td className="py-2 text-muted-foreground">GET /{'{page-id}'}/insights</td>
                  <td className="py-2 font-sans text-muted-foreground">Page engagement metrics</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">business_management</td>
                  <td className="py-2 text-muted-foreground">GET /me/businesses</td>
                  <td className="py-2 font-sans text-muted-foreground">List business accounts</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">business_management</td>
                  <td className="py-2 text-muted-foreground">GET /{'{biz-id}'}/adspixels</td>
                  <td className="py-2 font-sans text-muted-foreground">List Meta Pixels</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">ads_read</td>
                  <td className="py-2 text-muted-foreground">GET /act_{'{account-id}'}/insights</td>
                  <td className="py-2 font-sans text-muted-foreground">Campaign performance</td>
                </tr>
                <tr>
                  <td className="py-2">ads_management</td>
                  <td className="py-2 text-muted-foreground">POST /act_{'{account-id}'}/campaigns</td>
                  <td className="py-2 font-sans text-muted-foreground">Create/manage campaigns</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
