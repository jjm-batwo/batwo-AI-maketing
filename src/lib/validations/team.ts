import { z } from 'zod'

/**
 * Team PATCH body validation
 */
export const updateTeamSchema = z.object({
  name: z.string().min(1, '팀 이름은 필수입니다').max(100, '팀 이름은 100자 이하여야 합니다').optional(),
  description: z.string().max(500, '설명은 500자 이하여야 합니다').optional(),
})

/**
 * Team member PATCH body validation
 */
export const updateTeamMemberSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER'] as const).optional(),
  permissions: z.array(z.enum([
    'campaign:read',
    'campaign:write',
    'campaign:delete',
    'report:read',
    'report:write',
    'analytics:read',
    'team:invite',
    'team:manage',
    'settings:read',
    'settings:write',
    'billing:read',
    'billing:manage',
  ] as const)).optional(),
  action: z.enum(['accept']).optional(),
})

export type UpdateTeamInput = z.infer<typeof updateTeamSchema>
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>
