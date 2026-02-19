import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { vi } from 'vitest'

describe('TokenEncryption', () => {
  const VALID_KEY_HEX = 'a'.repeat(64) // 64자리 hex = 32바이트

  describe('encryptToken / decryptToken 라운드트립', () => {
    beforeEach(() => {
      vi.stubEnv('TOKEN_ENCRYPTION_KEY', VALID_KEY_HEX)
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('should_encrypt_and_decrypt_token_roundtrip', async () => {
      const { encryptToken, decryptToken } = await import('@application/utils/TokenEncryption')
      const plainToken = 'EAABwzLixnjYBO1234567890abcdefghij'
      const encrypted = encryptToken(plainToken)
      const decrypted = decryptToken(encrypted)
      expect(decrypted).toBe(plainToken)
    })

    it('should_produce_different_ciphertext_each_time_due_to_random_iv', async () => {
      const { encryptToken } = await import('@application/utils/TokenEncryption')
      const plainToken = 'same-token-value'
      const enc1 = encryptToken(plainToken)
      const enc2 = encryptToken(plainToken)
      expect(enc1).not.toBe(enc2)
    })

    it('should_produce_iv_encrypted_tag_format', async () => {
      const { encryptToken } = await import('@application/utils/TokenEncryption')
      const encrypted = encryptToken('test-token')
      const parts = encrypted.split(':')
      expect(parts).toHaveLength(3)
      // iv(24자 hex = 12바이트), encrypted(hex), tag(32자 hex = 16바이트)
      expect(parts[0]).toMatch(/^[0-9a-f]{24}$/)
      expect(parts[2]).toMatch(/^[0-9a-f]{32}$/)
    })
  })

  describe('isEncrypted', () => {
    beforeEach(() => {
      vi.stubEnv('TOKEN_ENCRYPTION_KEY', VALID_KEY_HEX)
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('should_return_true_for_encrypted_token', async () => {
      const { encryptToken, isEncrypted } = await import('@application/utils/TokenEncryption')
      const encrypted = encryptToken('plain-token')
      expect(isEncrypted(encrypted)).toBe(true)
    })

    it('should_return_false_for_plain_token', async () => {
      const { isEncrypted } = await import('@application/utils/TokenEncryption')
      expect(isEncrypted('EAABwzLixnjYBO_plain_token')).toBe(false)
    })

    it('should_return_false_for_empty_string', async () => {
      const { isEncrypted } = await import('@application/utils/TokenEncryption')
      expect(isEncrypted('')).toBe(false)
    })

    it('should_return_false_for_two_part_string', async () => {
      const { isEncrypted } = await import('@application/utils/TokenEncryption')
      expect(isEncrypted('abc:def')).toBe(false)
    })

    it('should_return_false_when_iv_is_not_hex', async () => {
      const { isEncrypted } = await import('@application/utils/TokenEncryption')
      // iv 부분이 hex가 아닌 경우
      expect(isEncrypted('not-hex-iv:aabb:ccdd')).toBe(false)
    })
  })

  describe('키 없을 때 평문 반환 (마이그레이션 호환성)', () => {
    beforeEach(() => {
      vi.stubEnv('TOKEN_ENCRYPTION_KEY', '')
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('should_return_plaintext_when_key_not_set_on_encrypt', async () => {
      const { encryptToken } = await import('@application/utils/TokenEncryption')
      const plainToken = 'plain-token-no-key'
      expect(encryptToken(plainToken)).toBe(plainToken)
    })

    it('should_return_plaintext_when_key_not_set_on_decrypt', async () => {
      const { decryptToken } = await import('@application/utils/TokenEncryption')
      const plainToken = 'plain-token-no-key'
      expect(decryptToken(plainToken)).toBe(plainToken)
    })
  })

  describe('잘못된 형식 복호화 에러', () => {
    beforeEach(() => {
      vi.stubEnv('TOKEN_ENCRYPTION_KEY', VALID_KEY_HEX)
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('should_throw_on_invalid_format_missing_parts', async () => {
      const { decryptToken } = await import('@application/utils/TokenEncryption')
      expect(() => decryptToken('only-two:parts')).toThrow()
    })
  })

  describe('잘못된 키로 복호화 에러', () => {
    it('should_throw_on_wrong_key_decryption', async () => {
      vi.stubEnv('TOKEN_ENCRYPTION_KEY', VALID_KEY_HEX)
      const { encryptToken } = await import('@application/utils/TokenEncryption')
      const encrypted = encryptToken('secret-token')
      vi.unstubAllEnvs()

      const WRONG_KEY = 'b'.repeat(64)
      vi.stubEnv('TOKEN_ENCRYPTION_KEY', WRONG_KEY)
      // 모듈 캐시 우회를 위해 동적 import 사용 (vi.resetModules 없이도 함수 참조 재사용)
      const { decryptToken } = await import('@application/utils/TokenEncryption')
      expect(() => decryptToken(encrypted)).toThrow()
      vi.unstubAllEnvs()
    })
  })
})
