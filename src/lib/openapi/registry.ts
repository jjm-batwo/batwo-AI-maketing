/**
 * OpenAPI Registry - Zod 스키마를 OpenAPI로 변환
 */

import { extendZodWithOpenApi, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { ReportType } from '@domain/entities/Report'

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z)

// Import OpenAPI-extended validation schemas
import {
  campaignQuerySchema,
  createCampaignSchema,
  updateCampaignSchema,
  reportQuerySchema,
  createReportSchema,
} from './schemas'

// Create registry
export const registry = new OpenAPIRegistry()

// ============================================================
// Shared Components
// ============================================================

// Error Response
const ErrorResponseSchema = registry.register(
  'ErrorResponse',
  z.object({
    error: z.string().openapi({ example: 'Validation failed' }),
    details: z
      .array(
        z.object({
          field: z.string(),
          message: z.string(),
        })
      )
      .optional(),
  })
)

const UnauthorizedResponseSchema = registry.register(
  'UnauthorizedResponse',
  z.object({
    message: z.string().openapi({ example: 'Unauthorized' }),
  })
)

// ============================================================
// Campaign Schemas
// ============================================================

const CampaignSchema = registry.register(
  'Campaign',
  z.object({
    id: z.string().uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    userId: z.string().uuid(),
    name: z.string().openapi({ example: 'Summer Sale Campaign' }),
    objective: z.nativeEnum(CampaignObjective).openapi({ example: CampaignObjective.CONVERSIONS }),
    status: z.nativeEnum(CampaignStatus).openapi({ example: CampaignStatus.ACTIVE }),
    dailyBudget: z.number().openapi({ example: 50000 }),
    currency: z.enum(['KRW', 'USD', 'EUR', 'JPY']).openapi({ example: 'KRW' }),
    startDate: z.string().datetime().openapi({ example: '2026-01-25T00:00:00Z' }),
    endDate: z.string().datetime().optional().openapi({ example: '2026-02-25T23:59:59Z' }),
    targetAudience: z.record(z.string(), z.unknown()).optional(),
    metaAdId: z.string().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
)

const CampaignListResponseSchema = registry.register(
  'CampaignListResponse',
  z.object({
    campaigns: z.array(CampaignSchema),
    total: z.number().openapi({ example: 42 }),
    page: z.number().openapi({ example: 1 }),
    pageSize: z.number().openapi({ example: 10 }),
  })
)

// ============================================================
// KPI Schemas
// ============================================================

const KPISummarySchema = registry.register(
  'KPISummary',
  z.object({
    totalSpend: z.number().openapi({ example: 150000 }),
    totalRevenue: z.number().openapi({ example: 450000 }),
    totalImpressions: z.number().openapi({ example: 50000 }),
    totalClicks: z.number().openapi({ example: 2500 }),
    totalConversions: z.number().openapi({ example: 125 }),
    averageRoas: z.number().openapi({ example: 3.0 }),
    averageCtr: z.number().openapi({ example: 5.0 }),
    averageCpa: z.number().openapi({ example: 1200 }),
    cvr: z.number().openapi({ example: 5.0 }),
    activeCampaigns: z.number().openapi({ example: 5 }),
    changes: z
      .object({
        spend: z.number(),
        revenue: z.number(),
        roas: z.number(),
        ctr: z.number(),
        conversions: z.number(),
      })
      .optional(),
  })
)

const CampaignBreakdownItemSchema = z.object({
  campaignId: z.string().uuid(),
  campaignName: z.string(),
  spend: z.number(),
  revenue: z.number(),
  roas: z.number(),
  impressions: z.number(),
  clicks: z.number(),
  conversions: z.number(),
  ctr: z.number(),
  cpa: z.number(),
})

const ChartDataPointSchema = z.object({
  date: z.string().openapi({ example: '2026-01-25' }),
  spend: z.number(),
  revenue: z.number(),
  roas: z.number(),
})

const KPIDashboardResponseSchema = registry.register(
  'KPIDashboardResponse',
  z.object({
    summary: KPISummarySchema,
    campaignBreakdown: z.array(CampaignBreakdownItemSchema).optional(),
    chartData: z.array(ChartDataPointSchema),
  })
)

// ============================================================
// Report Schemas
// ============================================================

const ReportSchema = registry.register(
  'Report',
  z.object({
    id: z.string().uuid().openapi({ example: '660e8400-e29b-41d4-a716-446655440000' }),
    type: z.nativeEnum(ReportType).openapi({ example: ReportType.WEEKLY }),
    status: z.enum(['GENERATING', 'COMPLETED', 'FAILED']).openapi({ example: 'COMPLETED' }),
    dateRange: z.object({
      startDate: z.string().openapi({ example: '2026-01-18' }),
      endDate: z.string().openapi({ example: '2026-01-25' }),
    }),
    generatedAt: z.string().datetime().optional().openapi({ example: '2026-01-25T10:30:00Z' }),
    campaignCount: z.number().openapi({ example: 3 }),
  })
)

const ReportListResponseSchema = registry.register(
  'ReportListResponse',
  z.object({
    reports: z.array(ReportSchema),
    total: z.number().openapi({ example: 15 }),
    page: z.number().openapi({ example: 1 }),
    pageSize: z.number().openapi({ example: 10 }),
  })
)

// ============================================================
// Register API Operations
// ============================================================

// Extend request schemas with OpenAPI metadata
const campaignQuerySchemaExtended = campaignQuerySchema.openapi({
  description: '캠페인 목록 조회 쿼리 파라미터',
})

const createCampaignSchemaExtended = createCampaignSchema.openapi({
  description: '캠페인 생성 요청 바디',
})

const updateCampaignSchemaExtended = updateCampaignSchema.openapi({
  description: '캠페인 수정 요청 바디',
})

const reportQuerySchemaExtended = reportQuerySchema.openapi({
  description: '리포트 목록 조회 쿼리 파라미터',
})

const createReportSchemaExtended = createReportSchema.openapi({
  description: '리포트 생성 요청 바디',
})

// GET /api/campaigns
registry.registerPath({
  method: 'get',
  path: '/campaigns',
  tags: ['Campaigns'],
  summary: '캠페인 목록 조회',
  description: '사용자의 캠페인 목록을 페이지네이션과 함께 조회합니다.',
  security: [{ bearerAuth: [] }],
  request: {
    query: campaignQuerySchemaExtended,
  },
  responses: {
    200: {
      description: 'Successful response',
      content: {
        'application/json': {
          schema: CampaignListResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: UnauthorizedResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
})

// POST /api/campaigns
registry.registerPath({
  method: 'post',
  path: '/campaigns',
  tags: ['Campaigns'],
  summary: '캠페인 생성',
  description: '새로운 마케팅 캠페인을 생성합니다. Rate limit: 5회/주',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createCampaignSchemaExtended,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Campaign created successfully',
      content: {
        'application/json': {
          schema: CampaignSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: UnauthorizedResponseSchema,
        },
      },
    },
    409: {
      description: 'Duplicate campaign name',
      content: {
        'application/json': {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    429: {
      description: 'Rate limit exceeded',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            retryAfter: z.number(),
          }),
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
})

// GET /api/campaigns/{id}
registry.registerPath({
  method: 'get',
  path: '/campaigns/{id}',
  tags: ['Campaigns'],
  summary: '캠페인 상세 조회',
  description: '특정 캠페인의 상세 정보를 조회합니다.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    }),
  },
  responses: {
    200: {
      description: 'Successful response',
      content: {
        'application/json': {
          schema: CampaignSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: UnauthorizedResponseSchema,
        },
      },
    },
    404: {
      description: 'Campaign not found',
      content: {
        'application/json': {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
})

// PATCH /api/campaigns/{id}
registry.registerPath({
  method: 'patch',
  path: '/campaigns/{id}',
  tags: ['Campaigns'],
  summary: '캠페인 수정',
  description: '기존 캠페인의 정보를 수정합니다.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateCampaignSchemaExtended,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Campaign updated successfully',
      content: {
        'application/json': {
          schema: CampaignSchema,
        },
      },
    },
    400: {
      description: 'Validation error or cannot update completed campaign',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: UnauthorizedResponseSchema,
        },
      },
    },
    404: {
      description: 'Campaign not found',
      content: {
        'application/json': {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
})

// DELETE /api/campaigns/{id}
registry.registerPath({
  method: 'delete',
  path: '/campaigns/{id}',
  tags: ['Campaigns'],
  summary: '캠페인 삭제',
  description: '캠페인을 삭제합니다.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    }),
  },
  responses: {
    204: {
      description: 'Campaign deleted successfully',
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: UnauthorizedResponseSchema,
        },
      },
    },
    404: {
      description: 'Campaign not found',
      content: {
        'application/json': {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
})

// GET /api/dashboard/kpi
registry.registerPath({
  method: 'get',
  path: '/dashboard/kpi',
  tags: ['Dashboard'],
  summary: 'KPI 대시보드 조회',
  description: '지정된 기간의 KPI 데이터를 조회합니다. 캐시 TTL: 5분',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      period: z.enum(['today', 'yesterday', '7d', '30d']).default('7d').openapi({
        example: '7d',
        description: '조회 기간',
      }),
      comparison: z.enum(['true', 'false']).optional().openapi({
        example: 'true',
        description: '이전 기간과 비교 데이터 포함 여부',
      }),
      breakdown: z.enum(['true', 'false']).optional().openapi({
        example: 'true',
        description: '캠페인별 상세 데이터 포함 여부',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Successful response',
      content: {
        'application/json': {
          schema: KPIDashboardResponseSchema,
        },
      },
      headers: {
        'Cache-Control': {
          description: 'Cache control header',
          schema: { type: 'string', example: 'private, max-age=300' },
        },
        'X-Cache': {
          description: 'Cache hit/miss indicator',
          schema: { type: 'string', enum: ['HIT', 'MISS'] },
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: UnauthorizedResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
})

// GET /api/reports
registry.registerPath({
  method: 'get',
  path: '/reports',
  tags: ['Reports'],
  summary: '리포트 목록 조회',
  description: '사용자의 리포트 목록을 조회합니다.',
  security: [{ bearerAuth: [] }],
  request: {
    query: reportQuerySchemaExtended,
  },
  responses: {
    200: {
      description: 'Successful response',
      content: {
        'application/json': {
          schema: ReportListResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: UnauthorizedResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
})

// POST /api/reports
registry.registerPath({
  method: 'post',
  path: '/reports',
  tags: ['Reports'],
  summary: '리포트 생성',
  description: '주간 리포트를 생성합니다.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createReportSchemaExtended,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Report created successfully',
      content: {
        'application/json': {
          schema: ReportSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: UnauthorizedResponseSchema,
        },
      },
    },
    403: {
      description: 'Unauthorized campaign access',
      content: {
        'application/json': {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
})
