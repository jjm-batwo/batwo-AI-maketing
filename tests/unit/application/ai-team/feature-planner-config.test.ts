/**
 * @fileoverview Feature Planner 설정 테스트
 * TDD RED 단계: 실패하는 테스트 먼저 작성
 *
 * 바투 AI 마케팅 솔루션에 특화된 Feature Planner 설정
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  FeaturePlannerConfig,
  FeaturePlan,
  FeatureLayer,
  TDDStep,
  ComplexityLevel,
} from '@/application/use-cases/ai-team/feature-planner-config';

describe('FeaturePlannerConfig', () => {
  let planner: FeaturePlannerConfig;

  beforeEach(() => {
    planner = new FeaturePlannerConfig();
  });

  describe('기능 계획 생성', () => {
    it('기능 설명으로 계획을 생성해야 함', () => {
      const plan = planner.createPlan('캠페인 날짜별 필터링 기능');

      expect(plan.title).toBe('캠페인 날짜별 필터링 기능');
      expect(plan.id).toBeDefined();
      expect(plan.createdAt).toBeInstanceOf(Date);
    });

    it('클린 아키텍처 계층별 작업을 분해해야 함', () => {
      const plan = planner.createPlan('새 KPI 지표 추가');

      expect(plan.layers).toBeDefined();
      expect(plan.layers.domain).toBeDefined();
      expect(plan.layers.application).toBeDefined();
      expect(plan.layers.infrastructure).toBeDefined();
      expect(plan.layers.presentation).toBeDefined();
    });

    it('TDD 단계별 계획을 포함해야 함', () => {
      const plan = planner.createPlan('AI 카피 생성 개선');

      expect(plan.tddSteps).toBeDefined();
      expect(plan.tddSteps.length).toBeGreaterThanOrEqual(3);
      expect(plan.tddSteps[0].stage).toBe('RED');
      expect(plan.tddSteps[1].stage).toBe('GREEN');
      expect(plan.tddSteps[2].stage).toBe('REFACTOR');
    });
  });

  describe('복잡도 분석', () => {
    it('간단한 기능의 복잡도를 low로 분석해야 함', () => {
      const complexity = planner.analyzeComplexity('버튼 텍스트 변경');

      expect(complexity.level).toBe('low');
      expect(complexity.estimatedHours).toBeLessThanOrEqual(2);
    });

    it('중간 기능의 복잡도를 medium으로 분석해야 함', () => {
      const complexity = planner.analyzeComplexity('캠페인 목록 정렬 기능 추가');

      expect(complexity.level).toBe('medium');
      expect(complexity.estimatedHours).toBeGreaterThan(2);
      expect(complexity.estimatedHours).toBeLessThanOrEqual(8);
    });

    it('복잡한 기능의 복잡도를 high로 분석해야 함', () => {
      const complexity = planner.analyzeComplexity(
        'Meta Ads API 연동 새 광고 유형 지원 추가 데이터베이스 스키마 변경 포함'
      );

      expect(complexity.level).toBe('high');
      expect(complexity.estimatedHours).toBeGreaterThan(8);
    });

    it('복잡도에 따라 영향받는 계층을 분석해야 함', () => {
      const complexity = planner.analyzeComplexity('데이터베이스 마이그레이션이 필요한 기능');

      expect(complexity.affectedLayers).toContain('infrastructure');
    });
  });

  describe('계층별 파일 경로 생성', () => {
    it('Domain 계층 파일 경로를 생성해야 함', () => {
      const paths = planner.generateFilePaths('Campaign', 'domain');

      expect(paths.entity).toBe('src/domain/entities/campaign.ts');
      expect(paths.test).toBe('tests/unit/domain/entities/campaign.test.ts');
    });

    it('Application 계층 파일 경로를 생성해야 함', () => {
      const paths = planner.generateFilePaths('CreateCampaign', 'application');

      expect(paths.useCase).toBe('src/application/use-cases/create-campaign.ts');
      expect(paths.test).toBe('tests/unit/application/use-cases/create-campaign.test.ts');
    });

    it('Infrastructure 계층 파일 경로를 생성해야 함', () => {
      const paths = planner.generateFilePaths('CampaignRepository', 'infrastructure');

      expect(paths.repository).toBe('src/infrastructure/database/campaign-repository.ts');
      expect(paths.test).toBe('tests/integration/database/campaign-repository.test.ts');
    });

    it('Presentation 계층 파일 경로를 생성해야 함', () => {
      const paths = planner.generateFilePaths('CampaignList', 'presentation');

      expect(paths.component).toBe('src/presentation/components/campaign-list.tsx');
      expect(paths.test).toBe('tests/unit/presentation/components/campaign-list.test.tsx');
    });
  });

  describe('TDD 단계 상세 생성', () => {
    it('RED 단계 상세 정보를 생성해야 함', () => {
      const redStep = planner.generateTDDStep('RED', 'FilterCampaigns');

      expect(redStep.stage).toBe('RED');
      expect(redStep.description).toContain('실패하는 테스트');
      expect(redStep.files).toBeDefined();
      expect(redStep.commands).toContain('npm test');
      expect(redStep.expectedOutcome).toContain('실패');
    });

    it('GREEN 단계 상세 정보를 생성해야 함', () => {
      const greenStep = planner.generateTDDStep('GREEN', 'FilterCampaigns');

      expect(greenStep.stage).toBe('GREEN');
      expect(greenStep.description).toContain('최소 구현');
      expect(greenStep.expectedOutcome).toContain('통과');
    });

    it('REFACTOR 단계 상세 정보를 생성해야 함', () => {
      const refactorStep = planner.generateTDDStep('REFACTOR', 'FilterCampaigns');

      expect(refactorStep.stage).toBe('REFACTOR');
      expect(refactorStep.description).toContain('정리');
      expect(refactorStep.expectedOutcome).toContain('유지');
    });
  });

  describe('프로젝트 특화 템플릿', () => {
    it('캠페인 관련 기능 템플릿을 제공해야 함', () => {
      const template = planner.getTemplate('campaign');

      expect(template.domainEntities).toContain('Campaign');
      expect(template.useCases).toBeDefined();
      expect(template.apiEndpoints).toBeDefined();
    });

    it('보고서 관련 기능 템플릿을 제공해야 함', () => {
      const template = planner.getTemplate('report');

      expect(template.domainEntities).toContain('Report');
      expect(template.useCases).toBeDefined();
    });

    it('KPI 관련 기능 템플릿을 제공해야 함', () => {
      const template = planner.getTemplate('kpi');

      expect(template.domainEntities).toContain('KPI');
      expect(template.useCases).toBeDefined();
    });

    it('Meta Ads 연동 템플릿을 제공해야 함', () => {
      const template = planner.getTemplate('meta-ads');

      expect(template.infrastructureComponents).toContain('MetaAdsClient');
      expect(template.externalApis).toBeDefined();
    });
  });

  describe('계획 검증', () => {
    it('계획이 클린 아키텍처 규칙을 준수하는지 검증해야 함', () => {
      const plan = planner.createPlan('새 기능');

      const validation = planner.validatePlan(plan);

      expect(validation.isValid).toBe(true);
      expect(validation.architectureCompliant).toBe(true);
    });

    it('TDD 단계가 완전한지 검증해야 함', () => {
      const plan = planner.createPlan('새 기능');

      const validation = planner.validatePlan(plan);

      expect(validation.tddComplete).toBe(true);
    });

    it('모든 계층이 정의되었는지 검증해야 함', () => {
      const plan = planner.createPlan('새 기능');

      const validation = planner.validatePlan(plan);

      expect(validation.allLayersDefined).toBe(true);
    });
  });

  describe('계획서 마크다운 생성', () => {
    it('계획서를 마크다운 형식으로 생성해야 함', () => {
      const plan = planner.createPlan('캠페인 필터링 기능');

      const markdown = planner.generateMarkdown(plan);

      expect(markdown).toContain('# 📋 기능:');
      expect(markdown).toContain('캠페인 필터링 기능');
      expect(markdown).toContain('## 🏗️ 클린 아키텍처 분석');
      expect(markdown).toContain('## 🔴🟢🔵 TDD 계획');
    });

    it('마크다운에 예상 작업 시간을 포함해야 함', () => {
      const plan = planner.createPlan('새 기능');

      const markdown = planner.generateMarkdown(plan);

      expect(markdown).toContain('예상 작업');
    });

    it('마크다운에 파일 경로를 포함해야 함', () => {
      const plan = planner.createPlan('새 기능');

      const markdown = planner.generateMarkdown(plan);

      expect(markdown).toContain('src/');
      expect(markdown).toContain('tests/');
    });
  });

  describe('계획 파일 저장 경로', () => {
    it('계획 파일 저장 경로를 생성해야 함', () => {
      const plan = planner.createPlan('캠페인 날짜 필터');

      const savePath = planner.getPlanSavePath(plan);

      expect(savePath).toContain('docs/plans/');
      expect(savePath).toContain('PLAN_');
      expect(savePath).toContain('.md');
    });

    it('파일명에 kebab-case를 사용해야 함', () => {
      const plan = planner.createPlan('캠페인 날짜 필터');

      const savePath = planner.getPlanSavePath(plan);

      expect(savePath).toMatch(/PLAN_[a-z0-9-]+\.md$/);
    });
  });

  describe('승인 필요 여부 판단', () => {
    it('데이터베이스 변경이 포함된 경우 승인이 필요함', () => {
      const plan = planner.createPlan('데이터베이스 스키마 변경 마이그레이션');

      expect(plan.requiresApproval).toBe(true);
      expect(plan.approvalReasons).toContain('database_schema');
    });

    it('API 변경이 포함된 경우 승인이 필요함', () => {
      const plan = planner.createPlan('API 엔드포인트 변경 작업');

      expect(plan.requiresApproval).toBe(true);
      expect(plan.approvalReasons).toContain('api_change');
    });

    it('보안 관련 변경인 경우 승인이 필요함', () => {
      const plan = planner.createPlan('인증 로직 보안 강화');

      expect(plan.requiresApproval).toBe(true);
      expect(plan.approvalReasons).toContain('security');
    });

    it('단순 UI 변경은 승인이 필요없음', () => {
      const plan = planner.createPlan('버튼 스타일 변경');

      expect(plan.requiresApproval).toBe(false);
    });
  });

  describe('복잡도 한국어 변환', () => {
    it('복잡도를 한국어로 변환해야 함', () => {
      expect(planner.getComplexityKorean('low')).toBe('간단');
      expect(planner.getComplexityKorean('medium')).toBe('중간');
      expect(planner.getComplexityKorean('high')).toBe('복잡');
    });
  });

  describe('계층 한국어 변환', () => {
    it('계층을 한국어로 변환해야 함', () => {
      expect(planner.getLayerKorean('domain')).toBe('도메인');
      expect(planner.getLayerKorean('application')).toBe('애플리케이션');
      expect(planner.getLayerKorean('infrastructure')).toBe('인프라스트럭처');
      expect(planner.getLayerKorean('presentation')).toBe('프레젠테이션');
    });
  });
});
