# PATCH Validation Learnings

## Changes Made

### 1. Created Validation Schemas
Created Zod validation schemas for all PATCH endpoints:

- **Campaign** (`src/lib/validations/campaign.ts`)
  - `updateCampaignSchema`: Partial update schema (excluding `objective` which cannot be changed)

- **Team** (`src/lib/validations/team.ts`)
  - `updateTeamSchema`: Team name and description validation
  - `updateTeamMemberSchema`: Member role, permissions, and action validation

- **A/B Test** (`src/lib/validations/abtest.ts`)
  - `updateABTestSchema`: Action (start/pause/complete) and variant metrics validation

- **Budget Alert** (`src/lib/validations/budgetAlert.ts`)
  - `createBudgetAlertSchema`: Threshold percent validation (1-100)
  - `updateBudgetAlertSchema`: Partial update for threshold and enabled status

- **Admin User** (`src/lib/validations/admin.ts`)
  - `updateUserSchema`: User name and global role validation

### 2. Updated PATCH Handlers
All PATCH endpoints now use Zod validation via `validateBody()` helper:

1. `/api/campaigns/[id]` - Campaign updates
2. `/api/teams/[id]` - Team details updates
3. `/api/teams/[id]/members/[memberId]` - Team member updates
4. `/api/ab-tests/[id]` - A/B test status and metrics updates
5. `/api/campaigns/[id]/budget-alert` - Budget alert settings updates
6. `/api/admin/users/[id]` - Admin user updates

### 3. Key Patterns

#### Using validateBody Helper
```typescript
const validation = await validateBody(request, updateSchema)
if (!validation.success) return validation.error

const { field1, field2 } = validation.data
```

#### Partial Schema Pattern
```typescript
export const updateSchema = createSchema.partial()
// or
export const updateSchema = z.object({
  field1: z.string().optional(),
  field2: z.number().optional(),
})
```

#### Validation Error Response Format
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "fieldName",
      "message": "Error message"
    }
  ]
}
```

### 4. Benefits

1. **Type Safety**: All request bodies are validated at runtime and compile-time
2. **Consistent Error Handling**: Standardized validation error responses
3. **Better Documentation**: Schema serves as API documentation
4. **Reduced Boilerplate**: No manual validation logic in route handlers
5. **Easier Testing**: Schemas can be tested independently

### 5. Gotchas

- **TeamPermission Format**: Team permissions use `campaign:read` format, not `VIEW_CAMPAIGNS`
- **Partial Updates**: Use `.partial()` or make all fields `.optional()` for PATCH endpoints
- **Omit Fields**: Use `.omit()` to exclude fields that shouldn't be updated (e.g., `objective` in campaigns)
- **Default Values**: Use `.default()` for optional fields with fallback values (e.g., `thresholdPercent` defaults to 80)

### 6. Type Checking Verified

All changes pass TypeScript type checking:
```bash
npm run type-check
# ✓ No errors
```
