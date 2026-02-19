// =============================================================================
// Prisma Configuration (Prisma 7.x)
// =============================================================================
// 데이터소스 URL 설정을 관리합니다.
// - DATABASE_URL: Connection Pooler (PgBouncer) - 일반 쿼리용
// - DIRECT_URL: Direct Connection - 마이그레이션용
// =============================================================================

import "dotenv/config";
import { defineConfig } from "prisma/config";

// 환경별 데이터베이스 URL 결정
const isTestEnv = process.env["NODE_ENV"] === "test";

// 일반 쿼리용 URL (Connection Pooler)
const databaseUrl = isTestEnv
  ? (process.env["DATABASE_URL_TEST"] || process.env["DATABASE_URL"])
  : process.env["DATABASE_URL"];

// 마이그레이션용 Direct URL
const directUrl = isTestEnv
  ? (process.env["DIRECT_URL_TEST"] || process.env["DIRECT_URL"])
  : process.env["DIRECT_URL"];

// Shadow Database URL (prisma migrate dev에서 사용)
const shadowDatabaseUrl = process.env["SHADOW_DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Connection Pooler URL (Supabase Transaction Mode: port 6543)
    url: databaseUrl,
    // Direct URL for migrations (Supabase: port 5432)
    // Note: directUrl is supported by Prisma 7.x runtime but types may lag behind
    directUrl: directUrl,
    // Shadow DB for prisma migrate dev (스키마 diff 계산용)
    shadowDatabaseUrl: shadowDatabaseUrl,
  } as { url?: string; directUrl?: string; shadowDatabaseUrl?: string },
});
