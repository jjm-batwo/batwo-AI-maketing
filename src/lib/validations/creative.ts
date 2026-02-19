import { z } from 'zod'
import { CreativeFormat } from '@domain/value-objects/CreativeFormat'
import { CTAType } from '@domain/value-objects/CTAType'

export const creativeFormSchema = z.object({
  name: z.string().min(1, '크리에이티브 이름은 필수입니다').max(255),
  format: z.nativeEnum(CreativeFormat),
  primaryText: z.string().min(1, '광고 본문을 입력해주세요').max(2000),
  headline: z.string().min(1, '헤드라인을 입력해주세요').max(255),
  description: z.string().max(500).optional().default(''),
  callToAction: z.nativeEnum(CTAType),
  linkUrl: z.string().url('유효한 URL을 입력해주세요').or(z.literal('')).optional().default(''),
  assetIds: z.array(z.string()).min(1, '최소 1개의 이미지 또는 동영상을 업로드해주세요'),
})

export type CreativeFormInput = z.infer<typeof creativeFormSchema>
