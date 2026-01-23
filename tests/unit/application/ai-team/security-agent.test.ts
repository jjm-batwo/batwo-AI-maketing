/**
 * @fileoverview 보안 에이전트 테스트
 * TDD RED 단계: 실패하는 테스트 먼저 작성
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SecurityAgent,
} from '@/application/use-cases/ai-team/security-agent';

describe('SecurityAgent', () => {
  let agent: SecurityAgent;

  beforeEach(() => {
    agent = new SecurityAgent();
  });

  describe('코드 보안 검사', () => {
    it('하드코딩된 시크릿을 감지해야 함', () => {
      const code = `
        const API_KEY = "sk-1234567890abcdef";
        const password = "mypassword123";
      `;

      const result = agent.scanCode(code, 'config.ts');

      expect(result.vulnerabilities.length).toBeGreaterThan(0);
      expect(result.vulnerabilities.some((v) => v.type === 'hardcoded_secret')).toBe(true);
    });

    it('SQL 인젝션 취약점을 감지해야 함', () => {
      const code = `
        const query = "SELECT * FROM users WHERE id = " + userId;
      `;

      const result = agent.scanCode(code, 'database.ts');

      expect(result.vulnerabilities.some((v) => v.type === 'sql_injection')).toBe(true);
    });

    it('XSS 취약점을 감지해야 함', () => {
      const code = `
        element.innerHTML = userInput;
      `;

      const result = agent.scanCode(code, 'component.tsx');

      expect(result.vulnerabilities.some((v) => v.type === 'xss')).toBe(true);
    });

    it('안전하지 않은 랜덤 함수를 감지해야 함', () => {
      const code = `
        const token = Math.random().toString(36);
      `;

      const result = agent.scanCode(code, 'auth.ts');

      expect(result.vulnerabilities.some((v) => v.type === 'insecure_random')).toBe(true);
    });

    it('취약점 심각도를 분류해야 함', () => {
      const code = `
        const API_KEY = "sk-1234567890abcdef";
      `;

      const result = agent.scanCode(code, 'config.ts');
      const vulnerability = result.vulnerabilities.find((v) => v.type === 'hardcoded_secret');

      expect(vulnerability?.severity).toBe('critical');
    });

    it('취약점 위치 정보를 제공해야 함', () => {
      const code = `const API_KEY = "sk-1234567890abcdef";`;

      const result = agent.scanCode(code, 'config.ts');
      const vulnerability = result.vulnerabilities.find((v) => v.type === 'hardcoded_secret');

      expect(vulnerability?.location).toBeDefined();
      expect(vulnerability?.location?.file).toBe('config.ts');
    });
  });

  describe('인증 관련 검사', () => {
    it('안전하지 않은 비밀번호 검증을 감지해야 함', () => {
      const code = `
        if (password === "admin") {
          return true;
        }
      `;

      const result = agent.scanCode(code, 'auth.ts');

      expect(result.vulnerabilities.some((v) => v.type === 'weak_password_check')).toBe(true);
    });

    it('누락된 인증 검사를 감지해야 함', () => {
      const code = `
        export async function POST(request: Request) {
          // No protection check
          const data = await request.json();
          await db.users.delete({ where: { id: data.id } });
        }
      `;

      const result = agent.scanAuthFile(code, 'api/users/route.ts');

      expect(result.warnings.some((w) => w.includes('인증'))).toBe(true);
    });

    it('JWT 시크릿 하드코딩을 감지해야 함', () => {
      const code = `
        const token = jwt.sign(payload, "my-secret-key");
      `;

      const result = agent.scanCode(code, 'auth.ts');

      expect(result.vulnerabilities.some((v) => v.type === 'hardcoded_secret')).toBe(true);
    });
  });

  describe('환경 변수 검사', () => {
    it('.env 파일의 민감한 정보를 감지해야 함', () => {
      const envContent = `
        DATABASE_URL=postgresql://user:password@localhost:5432/db
        OPENAI_API_KEY=sk-12345
        NEXTAUTH_SECRET=my-secret
      `;

      const result = agent.scanEnvFile(envContent);

      expect(result.sensitiveKeys.length).toBe(3);
      expect(result.sensitiveKeys).toContain('DATABASE_URL');
      expect(result.sensitiveKeys).toContain('OPENAI_API_KEY');
      expect(result.sensitiveKeys).toContain('NEXTAUTH_SECRET');
    });

    it('.env.example에 실제 값이 있는지 감지해야 함', () => {
      const envExampleContent = `
        DATABASE_URL=postgresql://user:password@localhost:5432/db
        OPENAI_API_KEY=sk-12345
      `;

      const result = agent.scanEnvExample(envExampleContent);

      expect(result.hasRealValues).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('의존성 보안 검사', () => {
    it('알려진 취약 패키지를 감지해야 함', () => {
      const packageJson = JSON.stringify({
        dependencies: {
          lodash: '4.17.11', // 취약한 버전
          axios: '0.21.0', // 취약한 버전
        },
      });

      const result = agent.scanDependencies(packageJson);

      expect(result.vulnerablePackages.length).toBeGreaterThan(0);
    });

    it('취약 패키지 업데이트 권장 버전을 제공해야 함', () => {
      const packageJson = JSON.stringify({
        dependencies: {
          lodash: '4.17.11',
        },
      });

      const result = agent.scanDependencies(packageJson);
      const lodashVuln = result.vulnerablePackages.find((p) => p.name === 'lodash');

      expect(lodashVuln?.recommendedVersion).toBeDefined();
    });
  });

  describe('API 보안 검사', () => {
    it('CORS 설정 문제를 감지해야 함', () => {
      const code = `
        headers.set('Access-Control-Allow-Origin', '*');
      `;

      const result = agent.scanCode(code, 'middleware.ts');

      expect(result.vulnerabilities.some((v) => v.type === 'cors_misconfiguration')).toBe(true);
    });

    it('Rate Limiting 미적용을 감지해야 함', () => {
      const apiFiles = ['src/app/api/auth/login/route.ts'];

      const result = agent.checkRateLimiting(apiFiles);

      expect(result.missingRateLimiting.length).toBeGreaterThan(0);
    });
  });

  describe('Infrastructure 계층 보안', () => {
    it('infrastructure 계층 파일을 검사해야 함', () => {
      const files = [
        'src/infrastructure/auth/auth.ts',
        'src/infrastructure/database/prisma-client.ts',
        'src/infrastructure/external/meta-ads/client.ts',
      ];

      const result = agent.scanInfrastructureLayer(files);

      expect(result.scannedFiles).toBe(3);
      expect(result.layer).toBe('infrastructure');
    });

    it('외부 API 키 노출을 감지해야 함', () => {
      const code = `
        const client = new MetaAdsClient({
          accessToken: "EAAxxxxxxxxxxxxxxx",
        });
      `;

      const result = agent.scanCode(code, 'src/infrastructure/external/meta-ads/client.ts');

      expect(result.vulnerabilities.some((v) => v.type === 'hardcoded_secret')).toBe(true);
    });
  });

  describe('보안 보고서 생성', () => {
    it('종합 보안 보고서를 생성해야 함', () => {
      agent.scanCode('const key = "secret";', 'config.ts');
      agent.scanCode('element.innerHTML = input;', 'component.tsx');

      const report = agent.generateSecurityReport();

      expect(report.totalVulnerabilities).toBeGreaterThan(0);
      expect(report.bySeverity).toBeDefined();
      expect(report.byType).toBeDefined();
    });

    it('보안 점수를 계산해야 함', () => {
      // 깨끗한 코드
      agent.scanCode('const x = 1;', 'clean.ts');

      const report = agent.generateSecurityReport();

      expect(report.securityScore).toBeDefined();
      expect(report.securityScore).toBeGreaterThanOrEqual(0);
      expect(report.securityScore).toBeLessThanOrEqual(100);
    });

    it('권장 조치 사항을 제공해야 함', () => {
      agent.scanCode('const API_KEY = "sk-123";', 'config.ts');

      const report = agent.generateSecurityReport();

      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('취약점 심각도', () => {
    it('심각도 순서대로 정렬해야 함', () => {
      const severity1 = agent.getSeverityLevel('critical');
      const severity2 = agent.getSeverityLevel('high');
      const severity3 = agent.getSeverityLevel('medium');
      const severity4 = agent.getSeverityLevel('low');

      expect(severity1).toBeGreaterThan(severity2);
      expect(severity2).toBeGreaterThan(severity3);
      expect(severity3).toBeGreaterThan(severity4);
    });
  });

  describe('취약점 유형 한국어 변환', () => {
    it('취약점 유형을 한국어로 변환해야 함', () => {
      expect(agent.getVulnerabilityTypeKorean('hardcoded_secret')).toBe('하드코딩된 시크릿');
      expect(agent.getVulnerabilityTypeKorean('sql_injection')).toBe('SQL 인젝션');
      expect(agent.getVulnerabilityTypeKorean('xss')).toBe('크로스 사이트 스크립팅');
      expect(agent.getVulnerabilityTypeKorean('insecure_random')).toBe('안전하지 않은 난수 생성');
    });
  });

  describe('심각도 한국어 변환', () => {
    it('심각도를 한국어로 변환해야 함', () => {
      expect(agent.getSeverityKorean('critical')).toBe('치명적');
      expect(agent.getSeverityKorean('high')).toBe('높음');
      expect(agent.getSeverityKorean('medium')).toBe('중간');
      expect(agent.getSeverityKorean('low')).toBe('낮음');
    });
  });
});
