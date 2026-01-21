// create-admin.ts
// 이 파일 대신 Prisma db execute로 직접 SQL 실행

const adminSQL = `
-- 1. Admin User 생성 (없으면)
INSERT INTO "User" (id, email, name, "globalRole", "createdAt", "updatedAt")
VALUES ('admin-super-001', 'admin@batwo.ai', 'Super Admin', 'SUPER_ADMIN', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET "globalRole" = 'SUPER_ADMIN';

-- 2. Credentials Account 생성 (비밀번호: admin123)
-- bcrypt hash of 'admin123' = $2a$10$Hx8V8jHWuPcQiLPzYRF8Yu7xJ1nqYb7kGjKxV8jFMi8dYRsD5.nXK
INSERT INTO "Account" (id, "userId", type, provider, "providerAccountId", access_token)
SELECT 'admin-account-001', id, 'credentials', 'credentials', 'admin@batwo.ai', '$2a$10$Hx8V8jHWuPcQiLPzYRF8Yu7xJ1nqYb7kGjKxV8jFMi8dYRsD5.nXK'
FROM "User" WHERE email = 'admin@batwo.ai'
ON CONFLICT (provider, "providerAccountId") DO UPDATE SET access_token = '$2a$10$Hx8V8jHWuPcQiLPzYRF8Yu7xJ1nqYb7kGjKxV8jFMi8dYRsD5.nXK';
`;

console.log('Run this SQL via: npx prisma db execute');
console.log(adminSQL);
