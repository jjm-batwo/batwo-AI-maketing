import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

/**
 * AES-256-GCM 암호화/복호화 유틸리티
 * 빌링키를 안전하게 저장하기 위해 사용
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12  // GCM recommended IV length
const _TAG_LENGTH = 16 // GCM auth tag length
const SEPARATOR = ':'

/**
 * 환경변수에서 암호화 키를 가져옴 (32바이트 hex)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.TOSS_BILLING_ENCRYPTION_KEY
  if (!key) {
    throw new Error('TOSS_BILLING_ENCRYPTION_KEY is not set')
  }
  // If key is hex string (64 chars = 32 bytes), convert from hex
  if (key.length === 64) {
    return Buffer.from(key, 'hex')
  }
  // If key is 32 bytes string, use as-is
  if (key.length === 32) {
    return Buffer.from(key, 'utf-8')
  }
  throw new Error('TOSS_BILLING_ENCRYPTION_KEY must be 32 bytes (or 64 hex chars)')
}

/**
 * 빌링키 암호화
 * @returns "iv:encrypted:tag" 형식의 문자열 (모두 hex)
 */
export function encryptBillingKey(plainBillingKey: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(plainBillingKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()

  return [
    iv.toString('hex'),
    encrypted,
    tag.toString('hex'),
  ].join(SEPARATOR)
}

/**
 * 빌링키 복호화
 * @param encryptedString - "iv:encrypted:tag" 형식의 문자열
 */
export function decryptBillingKey(encryptedString: string): string {
  const key = getEncryptionKey()
  const parts = encryptedString.split(SEPARATOR)

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted billing key format')
  }

  const [ivHex, encryptedHex, tagHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encrypted)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString('utf8')
}
