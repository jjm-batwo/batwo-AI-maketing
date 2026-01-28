import { z } from 'zod'
import { PixelSetupMethod } from '@domain/entities/MetaPixel'

/**
 * Pixel GET query parameters validation
 */
export const pixelQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  setupMethod: z.nativeEnum(PixelSetupMethod).optional(),
})

/**
 * Pixel POST body validation
 */
export const createPixelSchema = z.object({
  metaPixelId: z
    .string()
    .regex(/^\d{15,16}$/, 'Meta Pixel ID는 15-16자리 숫자여야 합니다'),
  name: z.string().min(1, '픽셀 이름은 필수입니다').max(255),
  setupMethod: z.nativeEnum(PixelSetupMethod).default(PixelSetupMethod.MANUAL),
})

export type PixelQueryParams = z.infer<typeof pixelQuerySchema>
export type CreatePixelInput = z.infer<typeof createPixelSchema>
