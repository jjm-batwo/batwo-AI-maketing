# P0-3 Permission System - Application Layer Implementation

## Overview
Application layer implementation for the team permission system, providing permission checking and role management services.

## Implementation Status: ✅ COMPLETE

All tests passing (11/11) and type check successful.

## Files Implemented

### 1. Port Interface
**File:** `src/application/ports/IPermissionService.ts`
- `checkPermission(userId, teamId, permission)` - Check if user has specific permission
- `getUserRole(userId, teamId)` - Get user's role in team
- `getUserPermissions(userId, teamId)` - Get all permissions for user
- `canManageRole(userId, teamId, targetRole)` - Check if user can manage target role

### 2. Service Implementation
**File:** `src/application/services/PermissionService.ts`
- Implements `IPermissionService` interface
- Uses Prisma to fetch TeamMember records
- Maps database roles (OWNER, ADMIN, MEMBER, VIEWER) to domain roles
- Creates appropriate TeamRoleEntity based on role
- Uses Permission value object for permission checking

**Key Features:**
- Role mapping: MEMBER → editor (domain layer)
- Lazy role entity creation (factory pattern)
- Permission string parsing with error handling
- Returns string array for permissions (for API responses)

### 3. Dependency Injection
**File:** `src/lib/di/types.ts`
- ✅ PermissionService token already added (line 39)

**File:** `src/lib/di/container.ts`
- ✅ PermissionService registered as singleton (line 283-285)
- ✅ getPermissionService() helper function (line 667-669)

### 4. Tests
**File:** `tests/unit/application/services/PermissionService.test.ts`
- 11 test cases covering all methods
- Mocked Prisma client
- Tests for all roles (OWNER, ADMIN, MEMBER, VIEWER)
- Edge cases (non-member, invalid format)

## Test Results

```
✓ checkPermission - should return true for valid permission
✓ checkPermission - should return false for invalid permission
✓ checkPermission - should return false for non-member
✓ checkPermission - should return false for invalid permission format
✓ checkPermission - should handle MEMBER role as editor
✓ getUserPermissions - should return all permissions for role
✓ getUserPermissions - should return empty array for non-member
✓ getUserPermissions - should return all owner permissions
✓ getUserRole - should return correct role name in lowercase
✓ getUserRole - should return null for non-member
✓ getUserRole - should map MEMBER to editor

Test Files: 1 passed (1)
Tests: 11 passed (11)
```

## Type Check
✅ `npm run type-check` passes with no errors

## Architecture Alignment

### Clean Architecture Layers
- **Domain**: Permission value object, TeamRoleEntity (already implemented)
- **Application**: ✅ IPermissionService port, PermissionService implementation
- **Infrastructure**: Prisma client (dependency injection)
- **Presentation**: Hooks and components (separate implementation)

### Dependency Flow
```
Presentation → Application (IPermissionService)
                    ↓
            PermissionService (uses Prisma)
                    ↓
            Domain (Permission, TeamRoleEntity)
```

## Role Mapping

| Database (Prisma) | Domain (TeamRoleName) | Permissions Count |
|-------------------|----------------------|-------------------|
| OWNER             | owner                | 21                |
| ADMIN             | admin                | 17                |
| MEMBER            | editor               | 9                 |
| VIEWER            | viewer               | 3                 |

## Usage Example

```typescript
import { getPermissionService } from '@/lib/di/container'

const permissionService = getPermissionService()

// Check permission
const canCreate = await permissionService.checkPermission(
  userId, 
  teamId, 
  'campaign:create'
)

// Get all permissions
const permissions = await permissionService.getUserPermissions(userId, teamId)
// Returns: ['campaign:create', 'campaign:read', ...]

// Get role
const role = await permissionService.getUserRole(userId, teamId)
// Returns: 'owner' | 'admin' | 'editor' | 'viewer' | null

// Check role management
const canManage = await permissionService.canManageRole(userId, teamId, 'editor')
// Returns: true if user can assign/change editor role
```

## Next Steps

The application layer is complete. Next implementations:
1. ✅ Domain Layer (already complete)
2. ✅ Application Layer (this implementation)
3. ⏭️ API Middleware (withPermission wrapper)
4. ⏭️ UI Components (PermissionGuard, usePermission hook)

## TDD Process

✅ RED → GREEN → REFACTOR cycle completed:
1. **RED**: Tests written first
2. **GREEN**: Implementation makes tests pass
3. **REFACTOR**: Code is clean and follows project patterns

