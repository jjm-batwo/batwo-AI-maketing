import { z } from 'zod'
import { GlobalRole } from '@domain/value-objects/GlobalRole'

/**
 * Admin user PATCH body validation
 */
export const updateUserSchema = z.object({
  name: z.string().min(1, '이름은 필수입니다').optional(),
  globalRole: z.nativeEnum(GlobalRole).optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>
