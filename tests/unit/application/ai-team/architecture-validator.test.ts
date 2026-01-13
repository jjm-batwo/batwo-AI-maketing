/**
 * @fileoverview 클린 아키텍처 의존성 검사기 테스트
 * TDD RED 단계: 실패하는 테스트 먼저 작성
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ArchitectureValidator } from '@/application/use-cases/ai-team/architecture-validator';

describe('ArchitectureValidator', () => {
  let validator: ArchitectureValidator;

  beforeEach(() => {
    validator = new ArchitectureValidator();
  });

  describe('계층 식별', () => {
    it('domain 계층 파일을 올바르게 식별해야 함', () => {
      expect(validator.identifyLayer('src/domain/entities/Campaign.ts')).toBe('domain');
      expect(validator.identifyLayer('src/domain/value-objects/Money.ts')).toBe('domain');
      expect(validator.identifyLayer('src/domain/repositories/ICampaignRepository.ts')).toBe(
        'domain'
      );
    });

    it('application 계층 파일을 올바르게 식별해야 함', () => {
      expect(validator.identifyLayer('src/application/use-cases/CreateCampaign.ts')).toBe(
        'application'
      );
      expect(validator.identifyLayer('src/application/dto/CampaignDTO.ts')).toBe('application');
      expect(validator.identifyLayer('src/application/ports/IAIService.ts')).toBe('application');
    });

    it('infrastructure 계층 파일을 올바르게 식별해야 함', () => {
      expect(validator.identifyLayer('src/infrastructure/database/PrismaRepository.ts')).toBe(
        'infrastructure'
      );
      expect(validator.identifyLayer('src/infrastructure/external/MetaAdsClient.ts')).toBe(
        'infrastructure'
      );
      expect(validator.identifyLayer('src/infrastructure/auth/NextAuthConfig.ts')).toBe(
        'infrastructure'
      );
    });

    it('presentation 계층 파일을 올바르게 식별해야 함', () => {
      expect(validator.identifyLayer('src/presentation/components/Button.tsx')).toBe(
        'presentation'
      );
      expect(validator.identifyLayer('src/presentation/hooks/useCampaign.ts')).toBe('presentation');
      expect(validator.identifyLayer('src/presentation/stores/campaignStore.ts')).toBe(
        'presentation'
      );
    });

    it('알 수 없는 경로는 unknown을 반환해야 함', () => {
      expect(validator.identifyLayer('src/utils/helper.ts')).toBe('unknown');
      expect(validator.identifyLayer('lib/config.ts')).toBe('unknown');
    });
  });

  describe('의존성 규칙 검증', () => {
    it('domain에서 application import는 위반이어야 함', () => {
      const result = validator.validateImport(
        'src/domain/entities/Campaign.ts',
        '@/application/use-cases/CreateCampaign'
      );

      expect(result.valid).toBe(false);
      expect(result.violation).toBe('domain → application');
    });

    it('domain에서 infrastructure import는 위반이어야 함', () => {
      const result = validator.validateImport(
        'src/domain/entities/Campaign.ts',
        '@prisma/client'
      );

      expect(result.valid).toBe(false);
      expect(result.violation).toBe('domain → external');
    });

    it('domain에서 presentation import는 위반이어야 함', () => {
      const result = validator.validateImport(
        'src/domain/entities/Campaign.ts',
        'react'
      );

      expect(result.valid).toBe(false);
      expect(result.violation).toBe('domain → external');
    });

    it('domain에서 domain import는 허용되어야 함', () => {
      const result = validator.validateImport(
        'src/domain/entities/Campaign.ts',
        '@/domain/value-objects/Money'
      );

      expect(result.valid).toBe(true);
    });

    it('application에서 domain import는 허용되어야 함', () => {
      const result = validator.validateImport(
        'src/application/use-cases/CreateCampaign.ts',
        '@/domain/entities/Campaign'
      );

      expect(result.valid).toBe(true);
    });

    it('application에서 infrastructure import는 위반이어야 함', () => {
      const result = validator.validateImport(
        'src/application/use-cases/CreateCampaign.ts',
        '@/infrastructure/database/PrismaRepository'
      );

      expect(result.valid).toBe(false);
      expect(result.violation).toBe('application → infrastructure');
    });

    it('infrastructure에서 domain import는 허용되어야 함', () => {
      const result = validator.validateImport(
        'src/infrastructure/database/CampaignRepository.ts',
        '@/domain/entities/Campaign'
      );

      expect(result.valid).toBe(true);
    });

    it('infrastructure에서 application import는 허용되어야 함', () => {
      const result = validator.validateImport(
        'src/infrastructure/database/CampaignRepository.ts',
        '@/application/ports/ICampaignRepository'
      );

      expect(result.valid).toBe(true);
    });

    it('presentation에서 모든 계층 import는 허용되어야 함', () => {
      const presenter = 'src/presentation/components/CampaignList.tsx';

      expect(validator.validateImport(presenter, '@/domain/entities/Campaign').valid).toBe(true);
      expect(validator.validateImport(presenter, '@/application/use-cases/CreateCampaign').valid).toBe(true);
      expect(validator.validateImport(presenter, '@/infrastructure/auth/AuthConfig').valid).toBe(true);
    });
  });

  describe('금지된 외부 의존성', () => {
    it('domain에서 Prisma import는 금지되어야 함', () => {
      const result = validator.validateImport(
        'src/domain/entities/Campaign.ts',
        '@prisma/client'
      );

      expect(result.valid).toBe(false);
      expect(result.forbiddenDependency).toBe('@prisma/client');
    });

    it('domain에서 React import는 금지되어야 함', () => {
      const result = validator.validateImport(
        'src/domain/services/CampaignService.ts',
        'react'
      );

      expect(result.valid).toBe(false);
      expect(result.forbiddenDependency).toBe('react');
    });

    it('domain에서 Next.js import는 금지되어야 함', () => {
      const result = validator.validateImport(
        'src/domain/entities/Campaign.ts',
        'next/navigation'
      );

      expect(result.valid).toBe(false);
      expect(result.forbiddenDependency).toBe('next/navigation');
    });

    it('application에서 Prisma import는 금지되어야 함', () => {
      const result = validator.validateImport(
        'src/application/use-cases/CreateCampaign.ts',
        '@prisma/client'
      );

      expect(result.valid).toBe(false);
      expect(result.forbiddenDependency).toBe('@prisma/client');
    });
  });

  describe('파일 분석', () => {
    it('파일 내용에서 import 문을 추출해야 함', () => {
      const content = `
        import { Campaign } from '@/domain/entities/Campaign';
        import { Money } from '@/domain/value-objects/Money';
        import React from 'react';
      `;

      const imports = validator.extractImports(content);

      expect(imports).toContain('@/domain/entities/Campaign');
      expect(imports).toContain('@/domain/value-objects/Money');
      expect(imports).toContain('react');
    });

    it('상대 경로 import도 추출해야 함', () => {
      const content = `
        import { helper } from './helper';
        import { utils } from '../utils/index';
      `;

      const imports = validator.extractImports(content);

      expect(imports).toContain('./helper');
      expect(imports).toContain('../utils/index');
    });
  });

  describe('전체 검증 보고서', () => {
    it('위반 사항이 없으면 통과 보고서를 반환해야 함', () => {
      const files = [
        {
          path: 'src/domain/entities/Campaign.ts',
          imports: ['@/domain/value-objects/Money'],
        },
        {
          path: 'src/application/use-cases/CreateCampaign.ts',
          imports: ['@/domain/entities/Campaign'],
        },
      ];

      const report = validator.validateProject(files);

      expect(report.passed).toBe(true);
      expect(report.violations).toHaveLength(0);
    });

    it('위반 사항이 있으면 실패 보고서를 반환해야 함', () => {
      const files = [
        {
          path: 'src/domain/entities/Campaign.ts',
          imports: ['@prisma/client'], // 위반!
        },
      ];

      const report = validator.validateProject(files);

      expect(report.passed).toBe(false);
      expect(report.violations).toHaveLength(1);
      expect(report.violations[0].file).toBe('src/domain/entities/Campaign.ts');
    });

    it('여러 위반 사항을 모두 보고해야 함', () => {
      const files = [
        {
          path: 'src/domain/entities/Campaign.ts',
          imports: ['@prisma/client', 'react'],
        },
        {
          path: 'src/application/use-cases/CreateCampaign.ts',
          imports: ['@/infrastructure/database/Repo'],
        },
      ];

      const report = validator.validateProject(files);

      expect(report.passed).toBe(false);
      expect(report.violations.length).toBeGreaterThanOrEqual(3);
    });
  });
});
