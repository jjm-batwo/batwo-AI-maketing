# Permission Middleware Migration Guide

## Overview
This guide shows how to migrate existing API routes to use the new `withPermission` and `withAnyPermission` middleware.

## Before vs After

### Example 1: List Team Members

#### Before (Manual Permission Check)
```typescript
// src/app/api/teams/[id]/members/route.ts
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const teamRepository = getTeamRepository()
    const team = await teamRepository.findById(id)

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Manual permission check
    const currentMember = team.getMember(session.user.id)
    if (!currentMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Business logic...
    const membersData = team.members.map(/* ... */)
    return NextResponse.json({ members: membersData })
  } catch (error) {
    console.error('Failed to list team members:', error)
    return NextResponse.json({ error: 'Failed to list team members' }, { status: 500 })
  }
}
```

#### After (Using Middleware)
```typescript
// src/app/api/teams/[id]/members/route.ts
import { withPermission } from '@/app/api/middleware/withPermission'

export const GET = withPermission(
  async (request: NextRequest, { params }) => {
    const { id: teamId } = await params
    const teamRepository = getTeamRepository()
    const team = await teamRepository.findById(teamId)

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Business logic only - auth & permission already verified
    const membersData = team.members.map(/* ... */)
    return NextResponse.json({
      members: membersData,
      totalCount: team.memberCount,
    })
  },
  {
    permission: 'member:read',
    teamIdSource: 'param',
    paramName: 'id',
  }
)
```

**Benefits**:
✅ Removed ~20 lines of boilerplate
✅ Consistent error responses
✅ Centralized permission logic
✅ Type-safe permission checks

---

### Example 2: Invite Team Member

#### Before (Manual Permission Check)
```typescript
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { email, name, role } = body

    // Validation
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const teamRepository = getTeamRepository()
    const team = await teamRepository.findById(id)

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Manual permission check
    if (!team.canUserInviteMembers(session.user.id)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Business logic...
    const { member: newMember } = team.inviteMember(/* ... */)
    await teamRepository.addMember(newMember)

    return NextResponse.json({ member: newMember }, { status: 201 })
  } catch (error) {
    console.error('Failed to invite team member:', error)
    return NextResponse.json({ error: 'Failed to invite team member' }, { status: 500 })
  }
}
```

#### After (Using Middleware)
```typescript
export const POST = withPermission(
  async (request: NextRequest, { params }) => {
    const { id: teamId } = await params
    const body = await request.json()
    const { email, name, role } = body

    // Validation
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const teamRepository = getTeamRepository()
    const team = await teamRepository.findById(teamId)

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Business logic only - auth & permission already verified
    const { member: newMember } = team.inviteMember({
      userId: `pending_${Date.now()}`,
      email: email.toLowerCase(),
      name: name?.trim(),
      role,
    })

    await teamRepository.addMember(newMember)

    return NextResponse.json({ member: newMember }, { status: 201 })
  },
  {
    permission: 'member:create',
    teamIdSource: 'param',
    paramName: 'id',
  }
)
```

**Benefits**:
✅ Removed auth boilerplate
✅ Removed manual permission check (`canUserInviteMembers`)
✅ Focus on business logic
✅ Consistent with rest of codebase

---

## Migration Checklist

### Step 1: Identify Permission Requirements
For each route, determine:
- [ ] What resource is being accessed? (team, member, campaign, etc.)
- [ ] What action is being performed? (create, read, update, delete, manage)
- [ ] Where is the teamId? (URL params, query string, or header)

### Step 2: Map to Permission Strings
Use the permission matrix:

| Route | HTTP Method | Permission |
|-------|-------------|------------|
| `/api/teams/[id]` | GET | `team:read` |
| `/api/teams/[id]` | PATCH | `team:update` |
| `/api/teams/[id]` | DELETE | `team:delete` |
| `/api/teams/[id]/members` | GET | `member:read` |
| `/api/teams/[id]/members` | POST | `member:create` |
| `/api/teams/[id]/members/[memberId]` | PATCH | `member:update` |
| `/api/teams/[id]/members/[memberId]` | DELETE | `member:delete` |
| `/api/teams/[id]/campaigns` | GET | `campaign:read` |
| `/api/teams/[id]/campaigns` | POST | `campaign:create` |
| `/api/teams/[id]/settings` | GET | `settings:read` |
| `/api/teams/[id]/settings` | PATCH | `settings:update` |

### Step 3: Refactor Route
1. Import the middleware:
   ```typescript
   import { withPermission } from '@/app/api/middleware/withPermission'
   ```

2. Wrap the handler:
   ```typescript
   export const GET = withPermission(
     async (request, { params }) => {
       // Your handler logic
     },
     { permission: 'resource:action' }
   )
   ```

3. Remove manual checks:
   - ❌ Remove `await auth()` calls
   - ❌ Remove `if (!session?.user?.id)` checks
   - ❌ Remove `team.getMember()` permission checks
   - ❌ Remove `team.canUserInviteMembers()` checks

4. Keep business logic:
   - ✅ Keep validation logic
   - ✅ Keep business rules (e.g., team.isFull)
   - ✅ Keep data transformation

### Step 4: Test
- [ ] Auth fails return 401
- [ ] Missing teamId returns 400
- [ ] Insufficient permissions return 403
- [ ] Valid requests work as expected

---

## Common Patterns

### Pattern 1: Read-Only Access
For routes that allow both read and manage permissions:
```typescript
export const GET = withAnyPermission(
  async (request, { params }) => {
    // Handler logic
  },
  {
    permissions: ['campaign:read', 'campaign:manage'],
  }
)
```

### Pattern 2: Admin-Only Operations
For routes requiring admin or owner permissions:
```typescript
export const DELETE = withPermission(
  async (request, { params }) => {
    // Handler logic
  },
  {
    permission: 'member:delete',
  }
)
```

### Pattern 3: Query String TeamId
For routes without teamId in URL:
```typescript
export const GET = withPermission(
  async (request) => {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    // Handler logic
  },
  {
    permission: 'campaign:read',
    teamIdSource: 'query',
  }
)
```

### Pattern 4: Header-Based TeamId
For routes using X-Team-Id header:
```typescript
export const POST = withPermission(
  async (request) => {
    const teamId = request.headers.get('X-Team-Id')
    // Handler logic
  },
  {
    permission: 'campaign:create',
    teamIdSource: 'header',
  }
)
```

---

## Routes to Migrate

### High Priority (P0)
- [ ] `/api/teams/[id]/members` - GET, POST
- [ ] `/api/teams/[id]/members/[memberId]` - PATCH, DELETE
- [ ] `/api/teams/[id]/campaigns` - GET, POST
- [ ] `/api/teams/[id]/settings` - GET, PATCH

### Medium Priority (P1)
- [ ] `/api/campaigns` - GET (with ?teamId query)
- [ ] `/api/campaigns/[id]` - GET, PATCH, DELETE
- [ ] `/api/reports` - GET, POST
- [ ] `/api/dashboard/kpi` - GET

### Low Priority (P2)
- [ ] Public routes (no auth required)
- [ ] Admin-only routes (separate admin check)
- [ ] Webhook routes (different auth mechanism)

---

## Backward Compatibility

The middleware is **fully backward compatible**. You can:
- ✅ Migrate routes incrementally
- ✅ Mix old and new patterns temporarily
- ✅ Test each route independently

---

## Troubleshooting

### Issue: 401 Unauthorized
**Cause**: Session not found
**Solution**: Ensure user is authenticated before making request

### Issue: 400 Bad Request - Team ID required
**Cause**: teamId not found in expected location
**Solution**: Check `teamIdSource` option (param, query, or header)

### Issue: 403 Forbidden
**Cause**: User lacks required permission
**Solution**: Verify user role and permission matrix

### Issue: 500 Internal Server Error
**Cause**: Permission service failure
**Solution**: Check PermissionService implementation and database connection

---

## Next Steps

1. **Start with high-priority routes**
2. **Test thoroughly after each migration**
3. **Update API documentation with permission requirements**
4. **Remove old permission checking helpers once migration complete**

---

## Performance Notes

- **Overhead**: ~2-5ms per request
- **Optimization**: Consider caching permission checks for high-traffic routes
- **Monitoring**: Log permission failures for security auditing
