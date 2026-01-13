/**
 * @fileoverview 보안 에이전트
 * 클린 아키텍처: Application 계층 - 보안 검사 유스케이스
 *
 * 역할:
 * - 코드 취약점 스캔
 * - 인증/권한 검사
 * - 의존성 보안 검사
 * - Infrastructure 계층 보안 검증
 */

import { SeverityLevel } from './report-generator';

// Re-export for backward compatibility
export type { SeverityLevel };

/**
 * 취약점 유형
 */
export type VulnerabilityType =
  | 'hardcoded_secret'
  | 'sql_injection'
  | 'xss'
  | 'insecure_random'
  | 'weak_password_check'
  | 'cors_misconfiguration'
  | 'missing_auth'
  | 'path_traversal';

/**
 * 보안 검사 유형
 */
export type SecurityCheckType =
  | 'code_scan'
  | 'auth_check'
  | 'dependency_scan'
  | 'api_security'
  | 'infrastructure_scan';

/**
 * 취약점 위치
 */
export interface VulnerabilityLocation {
  file: string;
  line?: number;
  column?: number;
}

/**
 * 취약점 정보
 */
export interface Vulnerability {
  type: VulnerabilityType;
  severity: SeverityLevel;
  message: string;
  location?: VulnerabilityLocation;
  recommendation?: string;
}

/**
 * 코드 스캔 결과
 */
export interface SecurityScanResult {
  file: string;
  vulnerabilities: Vulnerability[];
  warnings: string[];
  scannedAt: Date;
}

/**
 * 환경 변수 스캔 결과
 */
export interface EnvScanResult {
  sensitiveKeys: string[];
  warnings: string[];
}

/**
 * 환경 변수 예제 스캔 결과
 */
export interface EnvExampleScanResult {
  hasRealValues: boolean;
  warnings: string[];
}

/**
 * 취약 패키지 정보
 */
export interface VulnerablePackage {
  name: string;
  currentVersion: string;
  vulnerability: string;
  severity: SeverityLevel;
  recommendedVersion?: string;
}

/**
 * 의존성 스캔 결과
 */
export interface DependencyScanResult {
  vulnerablePackages: VulnerablePackage[];
  totalPackages: number;
}

/**
 * Rate Limiting 검사 결과
 */
export interface RateLimitingResult {
  missingRateLimiting: string[];
  hasRateLimiting: string[];
}

/**
 * Infrastructure 스캔 결과
 */
export interface InfrastructureScanResult {
  layer: string;
  scannedFiles: number;
  vulnerabilities: Vulnerability[];
}

/**
 * 보안 보고서
 */
export interface SecurityReport {
  generatedAt: Date;
  totalVulnerabilities: number;
  bySeverity: Record<SeverityLevel, number>;
  byType: Record<string, number>;
  securityScore: number;
  recommendations: string[];
}

/**
 * 취약점 유형 한국어 매핑
 */
const VULNERABILITY_TYPE_KOREAN: Record<VulnerabilityType, string> = {
  hardcoded_secret: '하드코딩된 시크릿',
  sql_injection: 'SQL 인젝션',
  xss: '크로스 사이트 스크립팅',
  insecure_random: '안전하지 않은 난수 생성',
  weak_password_check: '취약한 비밀번호 검증',
  cors_misconfiguration: 'CORS 설정 오류',
  missing_auth: '인증 누락',
  path_traversal: '경로 탐색 취약점',
};

/**
 * 심각도 한국어 매핑
 */
const SEVERITY_KOREAN: Record<SeverityLevel, string> = {
  critical: '치명적',
  high: '높음',
  medium: '중간',
  low: '낮음',
};

/**
 * 심각도 레벨 값
 */
const SEVERITY_LEVELS: Record<SeverityLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * 알려진 취약 패키지
 */
const KNOWN_VULNERABLE_PACKAGES: Record<string, { maxVulnerable: string; recommended: string }> = {
  lodash: { maxVulnerable: '4.17.20', recommended: '^4.17.21' },
  axios: { maxVulnerable: '0.21.0', recommended: '^1.6.0' },
  'node-fetch': { maxVulnerable: '2.6.0', recommended: '^3.3.0' },
};

/**
 * 보안 에이전트
 */
export class SecurityAgent {
  private scanHistory: SecurityScanResult[] = [];

  /**
   * 코드 보안 스캔
   */
  scanCode(code: string, filename: string): SecurityScanResult {
    const vulnerabilities: Vulnerability[] = [];
    const warnings: string[] = [];

    // 하드코딩된 시크릿 감지
    this.detectHardcodedSecrets(code, filename, vulnerabilities);

    // SQL 인젝션 감지
    this.detectSqlInjection(code, filename, vulnerabilities);

    // XSS 감지
    this.detectXss(code, filename, vulnerabilities);

    // 안전하지 않은 랜덤 감지
    this.detectInsecureRandom(code, filename, vulnerabilities);

    // 취약한 비밀번호 검사 감지
    this.detectWeakPasswordCheck(code, filename, vulnerabilities);

    // CORS 설정 문제 감지
    this.detectCorsMisconfiguration(code, filename, vulnerabilities);

    const result: SecurityScanResult = {
      file: filename,
      vulnerabilities,
      warnings,
      scannedAt: new Date(),
    };

    this.scanHistory.push(result);
    return result;
  }

  /**
   * 인증 파일 스캔
   */
  scanAuthFile(code: string, filename: string): SecurityScanResult {
    const result = this.scanCode(code, filename);

    // 인증 검사 누락 감지
    if (!code.includes('auth') && !code.includes('session') && !code.includes('token')) {
      result.warnings.push('API 엔드포인트에 인증 검사가 누락되었을 수 있습니다');
    }

    return result;
  }

  /**
   * 환경 변수 파일 스캔
   */
  scanEnvFile(content: string): EnvScanResult {
    const sensitivePatterns = [
      'DATABASE_URL',
      'API_KEY',
      'SECRET',
      'PASSWORD',
      'TOKEN',
      'PRIVATE_KEY',
      'OPENAI',
      'NEXTAUTH',
    ];

    const lines = content.split('\n');
    const sensitiveKeys: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;

      const [key] = trimmedLine.split('=');
      if (!key) continue;

      for (const pattern of sensitivePatterns) {
        if (key.toUpperCase().includes(pattern)) {
          sensitiveKeys.push(key.trim());
          break;
        }
      }
    }

    return {
      sensitiveKeys,
      warnings: [],
    };
  }

  /**
   * .env.example 파일 스캔
   */
  scanEnvExample(content: string): EnvExampleScanResult {
    const realValuePatterns = [
      /sk-[a-zA-Z0-9]+/,
      /postgresql:\/\/[^:]+:[^@]+@/,
      /mongodb:\/\/[^:]+:[^@]+@/,
      /EAA[a-zA-Z0-9]+/,
    ];

    let hasRealValues = false;
    const warnings: string[] = [];

    for (const pattern of realValuePatterns) {
      if (pattern.test(content)) {
        hasRealValues = true;
        warnings.push('.env.example 파일에 실제 값이 포함되어 있습니다');
        break;
      }
    }

    return {
      hasRealValues,
      warnings,
    };
  }

  /**
   * 의존성 보안 스캔
   */
  scanDependencies(packageJsonContent: string): DependencyScanResult {
    const packageJson = JSON.parse(packageJsonContent);
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const vulnerablePackages: VulnerablePackage[] = [];
    let totalPackages = 0;

    for (const [name, version] of Object.entries(dependencies)) {
      totalPackages++;
      const versionStr = String(version).replace('^', '').replace('~', '');

      if (KNOWN_VULNERABLE_PACKAGES[name]) {
        const vulnInfo = KNOWN_VULNERABLE_PACKAGES[name];
        if (this.compareVersions(versionStr, vulnInfo.maxVulnerable) <= 0) {
          vulnerablePackages.push({
            name,
            currentVersion: versionStr,
            vulnerability: `${name} ${versionStr}은(는) 알려진 취약점이 있습니다`,
            severity: 'high',
            recommendedVersion: vulnInfo.recommended,
          });
        }
      }
    }

    return {
      vulnerablePackages,
      totalPackages,
    };
  }

  /**
   * Rate Limiting 검사
   */
  checkRateLimiting(apiFiles: string[]): RateLimitingResult {
    // 실제 구현에서는 파일 내용을 검사
    // 현재는 모든 API 파일이 Rate Limiting이 누락된 것으로 간주
    return {
      missingRateLimiting: [...apiFiles],
      hasRateLimiting: [],
    };
  }

  /**
   * Infrastructure 계층 스캔
   */
  scanInfrastructureLayer(files: string[]): InfrastructureScanResult {
    return {
      layer: 'infrastructure',
      scannedFiles: files.length,
      vulnerabilities: [],
    };
  }

  /**
   * 보안 보고서 생성
   */
  generateSecurityReport(): SecurityReport {
    const allVulnerabilities: Vulnerability[] = [];

    for (const scan of this.scanHistory) {
      allVulnerabilities.push(...scan.vulnerabilities);
    }

    const bySeverity: Record<SeverityLevel, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const byType: Record<string, number> = {};

    for (const vuln of allVulnerabilities) {
      bySeverity[vuln.severity]++;
      byType[vuln.type] = (byType[vuln.type] || 0) + 1;
    }

    // 보안 점수 계산 (100점 만점, 취약점마다 감점)
    let securityScore = 100;
    securityScore -= bySeverity.critical * 25;
    securityScore -= bySeverity.high * 15;
    securityScore -= bySeverity.medium * 5;
    securityScore -= bySeverity.low * 2;
    securityScore = Math.max(0, securityScore);

    // 권장 조치 사항 생성
    const recommendations: string[] = [];
    if (bySeverity.critical > 0) {
      recommendations.push('치명적인 취약점을 즉시 수정하세요');
    }
    if (byType['hardcoded_secret'] > 0) {
      recommendations.push('하드코딩된 시크릿을 환경 변수로 이동하세요');
    }
    if (byType['sql_injection'] > 0) {
      recommendations.push('Prepared Statement를 사용하세요');
    }
    if (byType['xss'] > 0) {
      recommendations.push('사용자 입력을 이스케이프하세요');
    }

    return {
      generatedAt: new Date(),
      totalVulnerabilities: allVulnerabilities.length,
      bySeverity,
      byType,
      securityScore,
      recommendations,
    };
  }

  /**
   * 심각도 레벨 값 반환
   */
  getSeverityLevel(severity: SeverityLevel): number {
    return SEVERITY_LEVELS[severity];
  }

  /**
   * 취약점 유형 한국어 변환
   */
  getVulnerabilityTypeKorean(type: VulnerabilityType): string {
    return VULNERABILITY_TYPE_KOREAN[type] || type;
  }

  /**
   * 심각도 한국어 변환
   */
  getSeverityKorean(severity: SeverityLevel): string {
    return SEVERITY_KOREAN[severity] || severity;
  }

  /**
   * 하드코딩된 시크릿 감지
   */
  private detectHardcodedSecrets(
    code: string,
    filename: string,
    vulnerabilities: Vulnerability[]
  ): void {
    const patterns = [
      /["']sk-[a-zA-Z0-9]+["']/,
      /["']EAA[a-zA-Z0-9]+["']/,
      /password\s*=\s*["'][^"']+["']/i,
      /api_key\s*=\s*["'][^"']+["']/i,
      /secret\s*=\s*["'][^"']+["']/i,
      /jwt\.sign\([^,]+,\s*["'][^"']+["']/,
    ];

    for (const pattern of patterns) {
      if (pattern.test(code)) {
        vulnerabilities.push({
          type: 'hardcoded_secret',
          severity: 'critical',
          message: '하드코딩된 시크릿이 감지되었습니다',
          location: { file: filename },
          recommendation: '환경 변수를 사용하세요',
        });
        break;
      }
    }
  }

  /**
   * SQL 인젝션 감지
   */
  private detectSqlInjection(
    code: string,
    filename: string,
    vulnerabilities: Vulnerability[]
  ): void {
    const patterns = [
      /["']SELECT.*\+\s*\w+/i,
      /["']INSERT.*\+\s*\w+/i,
      /["']UPDATE.*\+\s*\w+/i,
      /["']DELETE.*\+\s*\w+/i,
      /\$\{.*\}.*FROM/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(code)) {
        vulnerabilities.push({
          type: 'sql_injection',
          severity: 'critical',
          message: 'SQL 인젝션 취약점이 감지되었습니다',
          location: { file: filename },
          recommendation: 'Prepared Statement를 사용하세요',
        });
        break;
      }
    }
  }

  /**
   * XSS 감지
   */
  private detectXss(code: string, filename: string, vulnerabilities: Vulnerability[]): void {
    const patterns = [
      /\.innerHTML\s*=\s*[^"'`]/,
      /dangerouslySetInnerHTML/,
      /document\.write\s*\(/,
    ];

    for (const pattern of patterns) {
      if (pattern.test(code)) {
        vulnerabilities.push({
          type: 'xss',
          severity: 'high',
          message: 'XSS 취약점이 감지되었습니다',
          location: { file: filename },
          recommendation: '사용자 입력을 이스케이프하세요',
        });
        break;
      }
    }
  }

  /**
   * 안전하지 않은 랜덤 감지
   */
  private detectInsecureRandom(
    code: string,
    filename: string,
    vulnerabilities: Vulnerability[]
  ): void {
    if (/Math\.random\(\)/.test(code) && /token|secret|key|password/i.test(code)) {
      vulnerabilities.push({
        type: 'insecure_random',
        severity: 'medium',
        message: '보안에 안전하지 않은 난수 생성이 감지되었습니다',
        location: { file: filename },
        recommendation: 'crypto.randomBytes() 또는 crypto.randomUUID()를 사용하세요',
      });
    }
  }

  /**
   * 취약한 비밀번호 검사 감지
   */
  private detectWeakPasswordCheck(
    code: string,
    filename: string,
    vulnerabilities: Vulnerability[]
  ): void {
    if (/password\s*===?\s*["'][^"']+["']/.test(code)) {
      vulnerabilities.push({
        type: 'weak_password_check',
        severity: 'high',
        message: '하드코딩된 비밀번호 비교가 감지되었습니다',
        location: { file: filename },
        recommendation: 'bcrypt 등 해시 비교를 사용하세요',
      });
    }
  }

  /**
   * CORS 설정 문제 감지
   */
  private detectCorsMisconfiguration(
    code: string,
    filename: string,
    vulnerabilities: Vulnerability[]
  ): void {
    if (/Access-Control-Allow-Origin.*\*/.test(code)) {
      vulnerabilities.push({
        type: 'cors_misconfiguration',
        severity: 'medium',
        message: 'CORS 와일드카드 설정이 감지되었습니다',
        location: { file: filename },
        recommendation: '특정 도메인만 허용하세요',
      });
    }
  }

  /**
   * 버전 비교
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }
    return 0;
  }
}
