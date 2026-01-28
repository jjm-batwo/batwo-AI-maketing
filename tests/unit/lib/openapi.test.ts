/**
 * OpenAPI Spec Tests
 */

import { describe, it, expect } from 'vitest'
import { openApiSpec, getOpenApiSpec } from '@/lib/openapi'

describe('OpenAPI Specification', () => {
  describe('openApiSpec', () => {
    it('should generate valid OpenAPI 3.0.3 spec', () => {
      expect(openApiSpec).toBeDefined()
      expect(openApiSpec.openapi).toBe('3.0.3')
    })

    it('should have correct API info', () => {
      expect(openApiSpec.info.title).toBe('바투 AI 마케팅 API')
      expect(openApiSpec.info.version).toBe('1.0.0')
      expect(openApiSpec.info.description).toContain('커머스 사업자')
    })

    it('should have servers configured', () => {
      expect(openApiSpec.servers).toBeDefined()
      expect(openApiSpec.servers?.length).toBeGreaterThan(0)
      expect(openApiSpec.servers?.[0].url).toBe('/api')
    })

    it('should have security schemes', () => {
      expect(openApiSpec.components?.securitySchemes).toBeDefined()
      expect(openApiSpec.components?.securitySchemes?.bearerAuth).toBeDefined()
    })

    it('should have tags', () => {
      expect(openApiSpec.tags).toBeDefined()
      const tagNames = openApiSpec.tags?.map((tag) => tag.name)
      expect(tagNames).toContain('Campaigns')
      expect(tagNames).toContain('Dashboard')
      expect(tagNames).toContain('Reports')
    })

    it('should have paths registered', () => {
      expect(openApiSpec.paths).toBeDefined()
      expect(Object.keys(openApiSpec.paths || {}).length).toBeGreaterThan(0)
    })
  })

  describe('Campaign endpoints', () => {
    it('should register GET /campaigns', () => {
      expect(openApiSpec.paths?.['/campaigns']?.get).toBeDefined()
      expect(openApiSpec.paths?.['/campaigns']?.get?.tags).toContain('Campaigns')
    })

    it('should register POST /campaigns', () => {
      expect(openApiSpec.paths?.['/campaigns']?.post).toBeDefined()
      expect(openApiSpec.paths?.['/campaigns']?.post?.tags).toContain('Campaigns')
    })

    it('should register GET /campaigns/{id}', () => {
      expect(openApiSpec.paths?.['/campaigns/{id}']?.get).toBeDefined()
    })

    it('should register PATCH /campaigns/{id}', () => {
      expect(openApiSpec.paths?.['/campaigns/{id}']?.patch).toBeDefined()
    })

    it('should register DELETE /campaigns/{id}', () => {
      expect(openApiSpec.paths?.['/campaigns/{id}']?.delete).toBeDefined()
    })
  })

  describe('Dashboard endpoints', () => {
    it('should register GET /dashboard/kpi', () => {
      expect(openApiSpec.paths?.['/dashboard/kpi']?.get).toBeDefined()
      expect(openApiSpec.paths?.['/dashboard/kpi']?.get?.tags).toContain('Dashboard')
    })
  })

  describe('Report endpoints', () => {
    it('should register GET /reports', () => {
      expect(openApiSpec.paths?.['/reports']?.get).toBeDefined()
      expect(openApiSpec.paths?.['/reports']?.get?.tags).toContain('Reports')
    })

    it('should register POST /reports', () => {
      expect(openApiSpec.paths?.['/reports']?.post).toBeDefined()
      expect(openApiSpec.paths?.['/reports']?.post?.tags).toContain('Reports')
    })
  })

  describe('Security', () => {
    it('should require authentication for all endpoints', () => {
      const paths = openApiSpec.paths || {}

      for (const [_path, methods] of Object.entries(paths)) {
        for (const [_method, spec] of Object.entries(methods || {})) {
          if (typeof spec === 'object' && 'security' in spec) {
            expect(spec.security).toBeDefined()
            expect(spec.security).toEqual([{ bearerAuth: [] }])
          }
        }
      }
    })
  })

  describe('Response schemas', () => {
    it('should have error response schemas', () => {
      expect(openApiSpec.components?.schemas?.ErrorResponse).toBeDefined()
      expect(openApiSpec.components?.schemas?.UnauthorizedResponse).toBeDefined()
    })

    it('should have campaign schemas', () => {
      expect(openApiSpec.components?.schemas?.Campaign).toBeDefined()
      expect(openApiSpec.components?.schemas?.CampaignListResponse).toBeDefined()
    })

    it('should have KPI schemas', () => {
      expect(openApiSpec.components?.schemas?.KPISummary).toBeDefined()
      expect(openApiSpec.components?.schemas?.KPIDashboardResponse).toBeDefined()
    })

    it('should have report schemas', () => {
      expect(openApiSpec.components?.schemas?.Report).toBeDefined()
      expect(openApiSpec.components?.schemas?.ReportListResponse).toBeDefined()
    })
  })

  describe('getOpenApiSpec()', () => {
    it('should return spec in non-production environments', () => {
      const originalEnv = process.env.NODE_ENV
      const originalVercelEnv = process.env.VERCEL_ENV

      process.env.NODE_ENV = 'development'
      const spec = getOpenApiSpec()
      expect(spec).toBeDefined()
      expect(spec?.openapi).toBe('3.0.3')

      process.env.NODE_ENV = originalEnv
      process.env.VERCEL_ENV = originalVercelEnv
    })

    it('should return null in production environment', () => {
      const originalEnv = process.env.NODE_ENV
      const originalVercelEnv = process.env.VERCEL_ENV

      process.env.NODE_ENV = 'production'
      process.env.VERCEL_ENV = 'production'

      const spec = getOpenApiSpec()
      expect(spec).toBeNull()

      process.env.NODE_ENV = originalEnv
      process.env.VERCEL_ENV = originalVercelEnv
    })
  })
})
