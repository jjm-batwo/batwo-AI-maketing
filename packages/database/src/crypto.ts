/**
 * AES-256-GCM encryption utilities for sensitive data
 *
 * Uses Node.js built-in crypto module to encrypt/decrypt sensitive data like
 * Meta Ads access tokens. Encryption key must be provided via ENCRYPTION_KEY
 * environment variable and must be exactly 32 bytes for AES-256.
 *
 * Format: base64(IV + authTag + ciphertext)
 * - IV: 16 bytes (random per encryption)
 * - authTag: 16 bytes (for integrity verification)
 * - ciphertext: variable length
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment variable
 * @throws {Error} If ENCRYPTION_KEY is not set or invalid length
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must be exactly ${KEY_LENGTH} characters (bytes). ` +
      `Current length: ${key.length}`
    );
  }

  return Buffer.from(key, 'utf8');
}

/**
 * Encrypt plaintext using AES-256-GCM
 *
 * @param plaintext - The text to encrypt
 * @returns Base64 encoded string containing IV + authTag + ciphertext
 * @throws {Error} If encryption fails or ENCRYPTION_KEY is invalid
 *
 * @example
 * const encrypted = encrypt('my-secret-token');
 * // Returns: base64 string like "AbCd...XyZ="
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty plaintext');
  }

  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Combine IV + authTag + ciphertext
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'base64'),
    ]);

    return combined.toString('base64');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
    throw new Error('Encryption failed with unknown error');
  }
}

/**
 * Decrypt ciphertext using AES-256-GCM
 *
 * @param ciphertext - Base64 encoded string from encrypt()
 * @returns Decrypted plaintext string
 * @throws {Error} If decryption fails, auth tag verification fails, or format is invalid
 *
 * @example
 * const decrypted = decrypt('AbCd...XyZ=');
 * // Returns: 'my-secret-token'
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) {
    throw new Error('Cannot decrypt empty ciphertext');
  }

  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(ciphertext, 'base64');

    // Validate minimum length
    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error('Invalid ciphertext format: too short');
    }

    // Extract components
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    if (error instanceof Error) {
      // Auth tag verification failure or other crypto errors
      throw new Error(`Decryption failed: ${error.message}`);
    }
    throw new Error('Decryption failed with unknown error');
  }
}
