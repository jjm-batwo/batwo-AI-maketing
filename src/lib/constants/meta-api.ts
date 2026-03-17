/**
 * Meta Graph API 버전 상수 (Single Source of Truth)
 *
 * 모든 Meta API 호출은 이 상수를 참조합니다.
 * 버전 업그레이드 시 이 파일만 수정하면 됩니다.
 */
export const META_API_VERSION = 'v25.0'
export const META_GRAPH_BASE = `https://graph.facebook.com/${META_API_VERSION}`
export const META_OAUTH_BASE = `https://www.facebook.com/${META_API_VERSION}`
