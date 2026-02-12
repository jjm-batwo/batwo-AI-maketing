 
/**
 * Example Usage: Permission Middleware
 *
 * This file demonstrates how to use withPermission and withAnyPermission
 * middleware in API route handlers.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withPermission, withAnyPermission } from './withPermission'

// ============================================================================
// Example 1: Team-scoped Campaign Creation
// ============================================================================
// Route: POST /api/teams/[teamId]/campaigns
// Permission: campaign:create
// TeamId Source: URL params

export const POST_CreateCampaign = withPermission(
  async (request: NextRequest, { params }) => {
    const { teamId } = await params
    const body = await request.json()

    // Your campaign creation logic here
    // User is guaranteed to have campaign:create permission in this team

    return NextResponse.json({
      id: 'campaign-123',
      teamId,
      name: body.name,
    }, { status: 201 })
  },
  {
    permission: 'campaign:create',
    teamIdSource: 'param', // Extract from URL params (default)
  }
)

// ============================================================================
// Example 2: Campaign Update with Custom Param Name
// ============================================================================
// Route: PATCH /api/teams/[id]/campaigns/[campaignId]
// Permission: campaign:update
// TeamId Source: URL params with custom param name

export const PATCH_UpdateCampaign = withPermission(
  async (request: NextRequest, { params }) => {
    const { id: teamId, campaignId } = await params
    const body = await request.json()

    // Your campaign update logic here
    return NextResponse.json({
      id: campaignId,
      teamId,
      ...body,
    })
  },
  {
    permission: 'campaign:update',
    teamIdSource: 'param',
    paramName: 'id', // Use 'id' param instead of default 'teamId'
  }
)

// ============================================================================
// Example 3: Query String TeamId
// ============================================================================
// Route: GET /api/campaigns?teamId=team-123
// Permission: campaign:read
// TeamId Source: Query string

export const GET_ListCampaigns = withPermission(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    // Your campaign listing logic here
    return NextResponse.json({
      campaigns: [],
      teamId,
    })
  },
  {
    permission: 'campaign:read',
    teamIdSource: 'query', // Extract from query string
  }
)

// ============================================================================
// Example 4: Header-based TeamId
// ============================================================================
// Route: POST /api/campaigns
// Permission: campaign:create
// TeamId Source: X-Team-Id header

export const POST_CreateCampaignWithHeader = withPermission(
  async (request: NextRequest) => {
    const teamId = request.headers.get('X-Team-Id')
    const body = await request.json()

    // Your campaign creation logic here
    return NextResponse.json({
      id: 'campaign-456',
      teamId,
      name: body.name,
    }, { status: 201 })
  },
  {
    permission: 'campaign:create',
    teamIdSource: 'header', // Extract from X-Team-Id header
  }
)

// ============================================================================
// Example 5: Multiple Permissions (OR Logic)
// ============================================================================
// Route: GET /api/teams/[teamId]/campaigns
// Permissions: campaign:read OR campaign:manage
// User needs at least one of these permissions

export const GET_ViewCampaigns = withAnyPermission(
  async (request: NextRequest, { params }) => {
    const { teamId } = await params

    // User has either campaign:read or campaign:manage permission
    return NextResponse.json({
      campaigns: [],
      teamId,
    })
  },
  {
    permissions: ['campaign:read', 'campaign:manage'],
    teamIdSource: 'param',
  }
)

// ============================================================================
// Example 6: Admin Operations (Multiple Permissions)
// ============================================================================
// Route: DELETE /api/teams/[teamId]/members/[memberId]
// Permissions: member:delete OR member:manage
// Typically used when either specific or broader permission works

export const DELETE_RemoveTeamMember = withAnyPermission(
  async (request: NextRequest, { params }) => {
    const { teamId: _teamId, memberId: _memberId } = await params

    // Remove team member logic here
    return new NextResponse(null, { status: 204 })
  },
  {
    permissions: ['member:delete', 'member:manage'],
    teamIdSource: 'param',
  }
)

// ============================================================================
// Example 7: Settings Management
// ============================================================================
// Route: PATCH /api/teams/[teamId]/settings
// Permission: settings:update

export const PATCH_UpdateSettings = withPermission(
  async (request: NextRequest, { params }) => {
    const { teamId } = await params
    const body = await request.json()

    // Update settings logic here
    return NextResponse.json({
      teamId,
      settings: body,
    })
  },
  {
    permission: 'settings:update',
    teamIdSource: 'param',
  }
)

// ============================================================================
// Example 8: Report Generation (Read-only Operations)
// ============================================================================
// Route: GET /api/teams/[teamId]/reports
// Permission: report:read

export const GET_ListReports = withPermission(
  async (request: NextRequest, { params }) => {
    const { teamId } = await params

    // List reports logic here
    return NextResponse.json({
      reports: [],
      teamId,
    })
  },
  {
    permission: 'report:read',
    teamIdSource: 'param',
  }
)

// ============================================================================
// Example 9: Dashboard Access (Multiple Read Permissions)
// ============================================================================
// Route: GET /api/teams/[teamId]/dashboard
// Permissions: dashboard:read OR dashboard:manage

export const GET_Dashboard = withAnyPermission(
  async (request: NextRequest, { params }) => {
    const { teamId } = await params

    // Dashboard data logic here
    return NextResponse.json({
      kpis: {},
      charts: [],
      teamId,
    })
  },
  {
    permissions: ['dashboard:read', 'dashboard:manage'],
    teamIdSource: 'param',
  }
)

// ============================================================================
// Example 10: Team Deletion (Highest Permission)
// ============================================================================
// Route: DELETE /api/teams/[teamId]
// Permission: team:delete
// Only owners have this permission

export const DELETE_Team = withPermission(
  async (request: NextRequest, { params }) => {
    const { teamId: _teamId } = await params

    // Team deletion logic here
    // Only owners can perform this action
    return new NextResponse(null, { status: 204 })
  },
  {
    permission: 'team:delete',
    teamIdSource: 'param',
  }
)

// ============================================================================
// Permission Matrix Reference
// ============================================================================
/*
Available Permissions:
- team:read, team:update, team:delete, team:manage
- campaign:create, campaign:read, campaign:update, campaign:delete, campaign:manage
- member:invite, member:update, member:delete, member:manage
- settings:read, settings:update
- report:read, report:generate
- dashboard:read, dashboard:manage

Permission Hierarchy:
- Owner: All permissions
- Admin: All except team:delete
- Manager: campaign:*, member:*, settings:read, report:*, dashboard:read
- Editor: campaign:create, campaign:read, campaign:update, report:read, dashboard:read
- Viewer: campaign:read, report:read, dashboard:read
*/
