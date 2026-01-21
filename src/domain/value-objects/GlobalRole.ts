/**
 * 전역 사용자 역할
 * USER: 일반 사용자
 * ADMIN: 관리자 (회원 관리, 결제/환불 처리)
 * SUPER_ADMIN: 최고 관리자 (모든 권한)
 */
export enum GlobalRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

/**
 * 역할별 권한 정의
 */
export interface GlobalRolePermissions {
  canAccessAdminPanel: boolean
  canManageUsers: boolean
  canManageAdmins: boolean
  canProcessRefunds: boolean
  canViewPayments: boolean
  canViewAnalytics: boolean
  canManageSettings: boolean
}

/**
 * 역할 계층 (숫자가 클수록 상위 권한)
 */
export const ROLE_HIERARCHY: Record<GlobalRole, number> = {
  [GlobalRole.USER]: 0,
  [GlobalRole.ADMIN]: 1,
  [GlobalRole.SUPER_ADMIN]: 2,
}

/**
 * 역할별 권한 매핑
 */
export const GLOBAL_ROLE_PERMISSIONS: Record<GlobalRole, GlobalRolePermissions> = {
  [GlobalRole.USER]: {
    canAccessAdminPanel: false,
    canManageUsers: false,
    canManageAdmins: false,
    canProcessRefunds: false,
    canViewPayments: false,
    canViewAnalytics: false,
    canManageSettings: false,
  },
  [GlobalRole.ADMIN]: {
    canAccessAdminPanel: true,
    canManageUsers: true,
    canManageAdmins: false,
    canProcessRefunds: true,
    canViewPayments: true,
    canViewAnalytics: true,
    canManageSettings: false,
  },
  [GlobalRole.SUPER_ADMIN]: {
    canAccessAdminPanel: true,
    canManageUsers: true,
    canManageAdmins: true,
    canProcessRefunds: true,
    canViewPayments: true,
    canViewAnalytics: true,
    canManageSettings: true,
  },
}

/**
 * 역할별 레이블
 */
const ROLE_LABELS: Record<GlobalRole, string> = {
  [GlobalRole.USER]: '일반 사용자',
  [GlobalRole.ADMIN]: '관리자',
  [GlobalRole.SUPER_ADMIN]: '최고 관리자',
}

/**
 * 역할별 설명
 */
const ROLE_DESCRIPTIONS: Record<GlobalRole, string> = {
  [GlobalRole.USER]: '일반 서비스 사용자',
  [GlobalRole.ADMIN]: '회원 관리, 결제/환불 처리, 분석 조회 권한',
  [GlobalRole.SUPER_ADMIN]: '모든 권한 (관리자 관리, 시스템 설정 포함)',
}

// ========================================
// Helper Functions
// ========================================

/**
 * 관리자 이상 권한인지 확인
 */
export function isAdmin(role: GlobalRole): boolean {
  return role === GlobalRole.ADMIN || role === GlobalRole.SUPER_ADMIN
}

/**
 * 최고 관리자인지 확인
 */
export function isSuperAdmin(role: GlobalRole): boolean {
  return role === GlobalRole.SUPER_ADMIN
}

/**
 * 관리자 패널 접근 가능 여부
 */
export function canAccessAdminPanel(role: GlobalRole): boolean {
  return GLOBAL_ROLE_PERMISSIONS[role].canAccessAdminPanel
}

/**
 * 회원 관리 권한 여부
 */
export function canManageUsers(role: GlobalRole): boolean {
  return GLOBAL_ROLE_PERMISSIONS[role].canManageUsers
}

/**
 * 관리자 관리 권한 여부 (SUPER_ADMIN만)
 */
export function canManageAdmins(role: GlobalRole): boolean {
  return GLOBAL_ROLE_PERMISSIONS[role].canManageAdmins
}

/**
 * 환불 처리 권한 여부
 */
export function canProcessRefunds(role: GlobalRole): boolean {
  return GLOBAL_ROLE_PERMISSIONS[role].canProcessRefunds
}

/**
 * 결제 정보 조회 권한 여부
 */
export function canViewPayments(role: GlobalRole): boolean {
  return GLOBAL_ROLE_PERMISSIONS[role].canViewPayments
}

/**
 * 역할 레이블 반환
 */
export function getRoleLabel(role: GlobalRole): string {
  return ROLE_LABELS[role]
}

/**
 * 역할 설명 반환
 */
export function getRoleDescription(role: GlobalRole): string {
  return ROLE_DESCRIPTIONS[role]
}

/**
 * 모든 전역 역할 반환
 */
export function getAllGlobalRoles(): GlobalRole[] {
  return Object.values(GlobalRole)
}

/**
 * 역할 계층 비교: role1이 role2 이상의 권한을 가지고 있는지 확인
 */
export function hasHigherOrEqualRole(role1: GlobalRole, role2: GlobalRole): boolean {
  return ROLE_HIERARCHY[role1] >= ROLE_HIERARCHY[role2]
}

/**
 * 관리자가 특정 역할을 관리(변경)할 수 있는지 확인
 * - ADMIN: USER 역할만 관리 가능
 * - SUPER_ADMIN: USER, ADMIN 역할 관리 가능
 * - 자신보다 높거나 같은 역할은 관리 불가
 */
export function canManageRole(adminRole: GlobalRole, targetRole: GlobalRole): boolean {
  // USER는 역할 관리 불가
  if (adminRole === GlobalRole.USER) {
    return false
  }

  // ADMIN은 USER만 관리 가능
  if (adminRole === GlobalRole.ADMIN) {
    return targetRole === GlobalRole.USER
  }

  // SUPER_ADMIN은 자신을 제외한 모든 역할 관리 가능
  if (adminRole === GlobalRole.SUPER_ADMIN) {
    return targetRole !== GlobalRole.SUPER_ADMIN
  }

  return false
}
