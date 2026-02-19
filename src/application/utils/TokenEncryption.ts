import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

/**
 * AES-256-GCM 범용 토큰 암호화/복호화 유틸리티
 * MetaAdAccount, PlatformIntegration, OAuthSession의 accessToken 안전 저장에 사용
 *
 * 환경변수: TOKEN_ENCRYPTION_KEY (64자 hex = 32바이트)
 * 키가 없으면 평문 그대로 반환 (마이그레이션 호환성)
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12  // GCM 권장 IV 길이 (바이트)
const TAG_LENGTH = 16 // GCM 인증 태그 길이 (바이트)
const SEPARATOR = ':'

/**
 * 환경변수에서 암호화 키를 가져옴
 * 키가 없으면 null 반환 (마이그레이션 호환성)
 */
function getEncryptionKey(): Buffer | null {
  const key = process.env.TOKEN_ENCRYPTION_KEY
  if (!key) {
    return null
  }
  // 64자 hex 문자열 → 32바이트
  if (key.length === 64) {
    return Buffer.from(key, 'hex')
  }
  // 32바이트 UTF-8 문자열
  if (key.length === 32) {
    return Buffer.from(key, 'utf-8')
  }
  throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes (or 64 hex chars)')
}

/**
 * 토큰 암호화
 * @returns "iv:encrypted:tag" 형식의 문자열 (모두 hex)
 * 키가 설정되지 않은 경우 평문 그대로 반환
 */
export function encryptToken(plainToken: string): string {
  const key = getEncryptionKey()
  if (!key) {
    return plainToken
  }

  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plainToken, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()

  return [
    iv.toString('hex'),
    encrypted,
    tag.toString('hex'),
  ].join(SEPARATOR)
}

/**
 * 토큰 복호화
 * @param encryptedToken - "iv:encrypted:tag" 형식의 문자열 또는 평문
 * 키가 설정되지 않은 경우 입력값 그대로 반환
 */
export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey()
  if (!key) {
    return encryptedToken
  }

  const parts = encryptedToken.split(SEPARATOR)
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format: expected iv:encrypted:tag')
  }

  const [ivHex, encryptedHex, tagHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const encryptedBuf = Buffer.from(encryptedHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')

  if (tag.length !== TAG_LENGTH) {
    throw new Error('Invalid encrypted token format: invalid tag length')
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encryptedBuf)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString('utf8')
}

/**
 * 이미 암호화된 토큰인지 판별
 * "iv:encrypted:tag" 형식 + iv가 hex인지 확인
 */
export function isEncrypted(token: string): boolean {
  if (!token) return false

  const parts = token.split(SEPARATOR)
  if (parts.length !== 3) return false

  // iv 부분이 유효한 hex 문자열인지 확인 (24자 = 12바이트)
  const [ivHex] = parts
  return /^[0-9a-f]{24}$/i.test(ivHex)
}

/**
 * Lazy migration: 평문 토큰을 조회 시 자동으로 암호화하여 반환
 * 이미 암호화된 토큰은 그대로 반환
 */
export function ensureEncrypted(token: string): string {
  if (isEncrypted(token)) {
    return token
  }
  return encryptToken(token)
}

/**
 * 안전한 복호화: 평문 토큰과 암호화된 토큰 모두 처리
 * 키가 없거나 평문 토큰이면 그대로 반환
 */
export function safeDecryptToken(token: string): string {
  if (!isEncrypted(token)) {
    return token
  }
  return decryptToken(token)
}
