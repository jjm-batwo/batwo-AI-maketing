'use client'

import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

/**
 * API Documentation Page - Swagger UI
 *
 * Only accessible in development/staging environments.
 */
export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">바투 AI 마케팅 API 문서</h1>
          <p className="text-muted-foreground">
            OpenAPI 3.0 스펙 기반 REST API 문서입니다.
          </p>
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>주의:</strong> 이 페이지는 개발/스테이징 환경에서만 접근 가능합니다.
            </p>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-lg overflow-hidden">
          <SwaggerUI
            url="/api/docs"
            docExpansion="list"
            defaultModelsExpandDepth={1}
            displayRequestDuration={true}
            filter={true}
            showExtensions={true}
            showCommonExtensions={true}
            tryItOutEnabled={true}
          />
        </div>
      </div>
    </div>
  )
}
