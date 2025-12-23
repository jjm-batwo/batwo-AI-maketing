/**
 * Tests for AES-256-GCM encryption/decryption utilities
 *
 * @module @batow/database/crypto.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Store original env
const originalEnv = process.env.ENCRYPTION_KEY;

// Valid 32-byte encryption key for testing (exactly 32 characters)
const TEST_ENCRYPTION_KEY = 'test-32-byte-key-for-aes256!!!!!';

describe('Crypto Utils', () => {
  beforeEach(() => {
    // Reset module cache to ensure fresh imports with new env
    vi.resetModules();
    process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv !== undefined) {
      process.env.ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  describe('encrypt', () => {
    it('should encrypt plaintext successfully', async () => {
      const { encrypt } = await import('../crypto');
      const plaintext = 'my-secret-token';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext (random IV)', async () => {
      const { encrypt } = await import('../crypto');
      const plaintext = 'same-token';

      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should produce base64 encoded output', async () => {
      const { encrypt } = await import('../crypto');
      const encrypted = encrypt('test-token');

      // Valid base64 should only contain these characters
      const base64Regex = /^[A-Za-z0-9+/]+=*$/;
      expect(encrypted).toMatch(base64Regex);
    });

    it('should throw error for empty plaintext', async () => {
      const { encrypt } = await import('../crypto');

      expect(() => encrypt('')).toThrow('Cannot encrypt empty plaintext');
    });

    it('should throw error when ENCRYPTION_KEY is not set', async () => {
      delete process.env.ENCRYPTION_KEY;
      vi.resetModules();
      const { encrypt } = await import('../crypto');

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY environment variable is not set');
    });

    it('should throw error when ENCRYPTION_KEY is wrong length', async () => {
      process.env.ENCRYPTION_KEY = 'short-key';
      vi.resetModules();
      const { encrypt } = await import('../crypto');

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must be exactly 32 characters');
    });

    it('should handle long plaintext', async () => {
      const { encrypt, decrypt } = await import('../crypto');
      const longText = 'a'.repeat(10000);

      const encrypted = encrypt(longText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(longText);
    });

    it('should handle special characters', async () => {
      const { encrypt, decrypt } = await import('../crypto');
      const specialChars = '!@#$%^&*()_+-={}[]|\\:"\'<>?,./`~\n\t한글日本語🔐';

      const encrypted = encrypt(specialChars);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(specialChars);
    });

    it('should handle unicode characters', async () => {
      const { encrypt, decrypt } = await import('../crypto');
      const unicode = '안녕하세요 Hello 你好 مرحبا';

      const encrypted = encrypt(unicode);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(unicode);
    });
  });

  describe('decrypt', () => {
    it('should decrypt ciphertext successfully', async () => {
      const { encrypt, decrypt } = await import('../crypto');
      const plaintext = 'my-secret-token';

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for empty ciphertext', async () => {
      const { decrypt } = await import('../crypto');

      expect(() => decrypt('')).toThrow('Cannot decrypt empty ciphertext');
    });

    it('should throw error for invalid ciphertext format (too short)', async () => {
      const { decrypt } = await import('../crypto');
      const shortCiphertext = Buffer.from('short').toString('base64');

      expect(() => decrypt(shortCiphertext)).toThrow('Invalid ciphertext format: too short');
    });

    it('should throw error for tampered ciphertext (auth tag verification)', async () => {
      const { encrypt, decrypt } = await import('../crypto');
      const encrypted = encrypt('original-data');

      // Tamper with the ciphertext
      const buffer = Buffer.from(encrypted, 'base64');
      buffer[buffer.length - 1] ^= 0xff; // Flip bits in last byte
      const tampered = buffer.toString('base64');

      expect(() => decrypt(tampered)).toThrow('Decryption failed');
    });

    it('should throw error for invalid base64', async () => {
      const { decrypt } = await import('../crypto');

      // Invalid base64 with wrong characters
      expect(() => decrypt('!!!invalid!!!')).toThrow();
    });

    it('should throw error when ENCRYPTION_KEY is not set', async () => {
      delete process.env.ENCRYPTION_KEY;
      vi.resetModules();
      const { decrypt } = await import('../crypto');

      expect(() => decrypt('some-ciphertext')).toThrow(
        'ENCRYPTION_KEY environment variable is not set'
      );
    });

    it('should throw error when ENCRYPTION_KEY is wrong length', async () => {
      process.env.ENCRYPTION_KEY = 'too-short';
      vi.resetModules();
      const { decrypt } = await import('../crypto');

      expect(() => decrypt('some-ciphertext')).toThrow(
        'ENCRYPTION_KEY must be exactly 32 characters'
      );
    });

    it('should fail decryption with wrong key', async () => {
      const { encrypt } = await import('../crypto');
      const encrypted = encrypt('secret');

      // Change to a different key (also 32 characters)
      process.env.ENCRYPTION_KEY = 'different-32-byte-key-here!!!!!!';
      vi.resetModules();
      const { decrypt } = await import('../crypto');

      expect(() => decrypt(encrypted)).toThrow('Decryption failed');
    });
  });

  describe('round-trip encryption', () => {
    it('should successfully round-trip various data types', async () => {
      const { encrypt, decrypt } = await import('../crypto');

      const testCases = [
        'simple-token',
        'token-with-numbers-12345',
        'EAABwzLixnjYBO...(long oauth token)',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0',
        JSON.stringify({ key: 'value', nested: { data: true } }),
      ];

      for (const testData of testCases) {
        const encrypted = encrypt(testData);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(testData);
      }
    });

    it('should handle Meta Ads token format', async () => {
      const { encrypt, decrypt } = await import('../crypto');

      // Simulated Meta Ads access token format
      const metaToken = 'EAABwzLixnjYBO0ZB2XZAZBqZCZAnKZCqJxMZCNhZBL8xK9ZC4QZDZD';

      const encrypted = encrypt(metaToken);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(metaToken);
    });

    it('should maintain data integrity through multiple encrypt/decrypt cycles', async () => {
      const { encrypt, decrypt } = await import('../crypto');
      const original = 'test-token-for-multiple-cycles';

      let current = original;
      for (let i = 0; i < 5; i++) {
        const encrypted = encrypt(current);
        current = decrypt(encrypted);
      }

      expect(current).toBe(original);
    });
  });

  describe('security properties', () => {
    it('should produce ciphertext longer than plaintext (due to IV + authTag)', async () => {
      const { encrypt } = await import('../crypto');
      const plaintext = 'short';
      const encrypted = encrypt(plaintext);

      // Encrypted should be base64 of: IV (16) + authTag (16) + ciphertext
      // So minimum 32 bytes overhead + ciphertext, all base64 encoded
      expect(encrypted.length).toBeGreaterThan(plaintext.length);
    });

    it('should not leak plaintext in ciphertext', async () => {
      const { encrypt } = await import('../crypto');
      const plaintext = 'secret-password-123';
      const encrypted = encrypt(plaintext);

      // Ciphertext should not contain the plaintext
      expect(encrypted).not.toContain(plaintext);
      expect(encrypted).not.toContain(Buffer.from(plaintext).toString('base64'));
    });

    it('should use random IV (proven by different ciphertext for same input)', async () => {
      const { encrypt } = await import('../crypto');
      const plaintext = 'test';

      const encryptions = new Set<string>();
      for (let i = 0; i < 100; i++) {
        encryptions.add(encrypt(plaintext));
      }

      // All 100 encryptions should be unique due to random IV
      expect(encryptions.size).toBe(100);
    });
  });
});
