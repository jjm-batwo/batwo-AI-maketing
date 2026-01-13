/**
 * @fileoverview 클린 아키텍처 의존성 검사기
 * 클린 아키텍처: Application 계층 - 아키텍처 규칙 검증
 *
 * 의존성 규칙:
 * - domain: 외부 의존성 없음 (순수 비즈니스 로직)
 * - application: domain만 의존 가능
 * - infrastructure: domain, application 의존 가능
 * - presentation: 모든 계층 의존 가능
 */

/**
 * 계층 유형
 */
export type ArchitectureLayer =
  | 'domain'
  | 'application'
  | 'infrastructure'
  | 'presentation'
  | 'unknown';

/**
 * Import 검증 결과
 */
export interface ImportValidationResult {
  valid: boolean;
  violation?: string;
  forbiddenDependency?: string;
}

/**
 * 파일 정보
 */
export interface FileInfo {
  path: string;
  imports: string[];
}

/**
 * 위반 정보
 */
export interface Violation {
  file: string;
  import: string;
  violation: string;
  forbiddenDependency?: string;
}

/**
 * 검증 보고서
 */
export interface ValidationReport {
  passed: boolean;
  violations: Violation[];
  summary: {
    totalFiles: number;
    violationCount: number;
    byLayer: Record<ArchitectureLayer, number>;
  };
}

/**
 * 계층별 금지된 외부 의존성
 */
const FORBIDDEN_DEPENDENCIES: Record<ArchitectureLayer, string[]> = {
  domain: [
    '@prisma/client',
    'prisma',
    'react',
    'next',
    'next/navigation',
    'next/router',
    'next/image',
    'next/link',
    'next-auth',
    '@tanstack/react-query',
    'zustand',
    'axios',
  ],
  application: [
    '@prisma/client',
    'prisma',
    'react',
    'next',
    'next/navigation',
    'next/router',
    'next/image',
    'next/link',
    '@tanstack/react-query',
    'zustand',
  ],
  infrastructure: [],
  presentation: [],
  unknown: [],
};

/**
 * 계층 우선순위 (낮을수록 내부 계층)
 */
const LAYER_PRIORITY: Record<ArchitectureLayer, number> = {
  domain: 0,
  application: 1,
  infrastructure: 2,
  presentation: 3,
  unknown: 99,
};

/**
 * 클린 아키텍처 의존성 검사기
 */
export class ArchitectureValidator {
  /**
   * 파일 경로에서 계층 식별
   */
  identifyLayer(filePath: string): ArchitectureLayer {
    if (filePath.includes('/domain/') || filePath.startsWith('src/domain/')) {
      return 'domain';
    }
    if (filePath.includes('/application/') || filePath.startsWith('src/application/')) {
      return 'application';
    }
    if (filePath.includes('/infrastructure/') || filePath.startsWith('src/infrastructure/')) {
      return 'infrastructure';
    }
    if (filePath.includes('/presentation/') || filePath.startsWith('src/presentation/')) {
      return 'presentation';
    }
    return 'unknown';
  }

  /**
   * import 경로에서 대상 계층 식별
   */
  private identifyImportLayer(importPath: string): ArchitectureLayer | 'external' {
    // 프로젝트 내부 import
    if (importPath.startsWith('@/domain/') || importPath.startsWith('./domain/')) {
      return 'domain';
    }
    if (importPath.startsWith('@/application/') || importPath.startsWith('./application/')) {
      return 'application';
    }
    if (importPath.startsWith('@/infrastructure/') || importPath.startsWith('./infrastructure/')) {
      return 'infrastructure';
    }
    if (importPath.startsWith('@/presentation/') || importPath.startsWith('./presentation/')) {
      return 'presentation';
    }

    // 상대 경로는 같은 계층으로 간주
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      return 'unknown';
    }

    // 외부 패키지
    return 'external';
  }

  /**
   * import 검증
   */
  validateImport(sourceFile: string, importPath: string): ImportValidationResult {
    const sourceLayer = this.identifyLayer(sourceFile);
    const targetLayer = this.identifyImportLayer(importPath);

    // 금지된 외부 의존성 검사
    const forbidden = FORBIDDEN_DEPENDENCIES[sourceLayer];
    if (forbidden.some((dep) => importPath === dep || importPath.startsWith(`${dep}/`))) {
      return {
        valid: false,
        violation: `${sourceLayer} → external`,
        forbiddenDependency: importPath,
      };
    }

    // 외부 패키지는 금지 목록에 없으면 허용
    if (targetLayer === 'external') {
      return { valid: true };
    }

    // 같은 계층이거나 unknown은 허용
    if (targetLayer === 'unknown' || sourceLayer === 'unknown') {
      return { valid: true };
    }

    // 계층 규칙 검사
    const sourcePriority = LAYER_PRIORITY[sourceLayer];
    const targetPriority = LAYER_PRIORITY[targetLayer as ArchitectureLayer];

    // 내부 계층에서 외부 계층으로의 의존성은 위반
    if (sourcePriority < targetPriority) {
      return {
        valid: false,
        violation: `${sourceLayer} → ${targetLayer}`,
      };
    }

    return { valid: true };
  }

  /**
   * 파일 내용에서 import 문 추출
   */
  extractImports(content: string): string[] {
    const imports: string[] = [];

    // ES6 import 문 패턴
    const importRegex = /import\s+(?:(?:\{[^}]*\}|[^{}\s]+)\s+from\s+)?['"]([^'"]+)['"]/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // require 문 패턴
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * 프로젝트 전체 검증
   */
  validateProject(files: FileInfo[]): ValidationReport {
    const violations: Violation[] = [];
    const byLayer: Record<ArchitectureLayer, number> = {
      domain: 0,
      application: 0,
      infrastructure: 0,
      presentation: 0,
      unknown: 0,
    };

    for (const file of files) {
      const sourceLayer = this.identifyLayer(file.path);

      for (const importPath of file.imports) {
        const result = this.validateImport(file.path, importPath);

        if (!result.valid) {
          violations.push({
            file: file.path,
            import: importPath,
            violation: result.violation || 'unknown violation',
            forbiddenDependency: result.forbiddenDependency,
          });
          byLayer[sourceLayer]++;
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      summary: {
        totalFiles: files.length,
        violationCount: violations.length,
        byLayer,
      },
    };
  }
}
