/**
 * OpenAPI Specification Generator
 */

import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { registry } from './registry'

// Generate OpenAPI spec
const generator = new OpenApiGeneratorV3(registry.definitions)

export const openApiSpec = generator.generateDocument({
  openapi: '3.0.3',
  info: {
    title: '바투 AI 마케팅 API',
    version: '1.0.0',
    description: `
      커머스 사업자를 위한 AI 마케팅 대행 솔루션 API

      ## 주요 기능
      - 캠페인 관리 (생성, 조회, 수정, 삭제)
      - KPI 대시보드 (실시간 성과 지표)
      - 리포트 생성 (주간/월간 리포트)

      ## 인증
      모든 API 엔드포인트는 NextAuth.js 세션 인증이 필요합니다.

      ## Rate Limiting
      - 캠페인 생성: 5회/주
      - AI 카피 생성: 20회/일
      - AI 분석: 5회/주
    `,
    contact: {
      name: 'Batwo Support',
      email: 'support@batwo.ai',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API Server',
    },
  ],
  tags: [
    {
      name: 'Campaigns',
      description: '캠페인 관리 API',
    },
    {
      name: 'Dashboard',
      description: 'KPI 대시보드 API',
    },
    {
      name: 'Reports',
      description: '리포트 관리 API',
    },
  ],
})

// Add security schemes to generated spec
openApiSpec.components = openApiSpec.components || {}
openApiSpec.components.securitySchemes = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    description: 'NextAuth.js 세션 토큰',
  },
}

/**
 * Get OpenAPI spec with environment-specific filtering
 */
export function getOpenApiSpec() {
  // Only expose in development/staging
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
    return null
  }

  return openApiSpec
}
