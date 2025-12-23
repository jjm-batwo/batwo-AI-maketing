/**
 * @batow/database - Database client and utilities package
 *
 * This package provides:
 * - Prisma Client with automatic encryption for sensitive fields
 * - AES-256-GCM encryption/decryption utilities
 * - Type-safe database access
 *
 * @example
 * import { prisma, encrypt, decrypt } from '@batow/database';
 *
 * // Use Prisma client (encryption is automatic)
 * const account = await prisma.metaAdAccount.create({
 *   data: { accessToken: 'token' } // Auto-encrypted
 * });
 *
 * // Manual encryption (if needed)
 * const encrypted = encrypt('sensitive-data');
 * const decrypted = decrypt(encrypted);
 */

// Export Prisma client with encryption extension
export { prisma, type PrismaClientType } from './client';

// Export encryption utilities for manual use
export { encrypt, decrypt } from './crypto';

// Re-export Prisma types for convenience
// Note: Specific model types will be available after running prisma generate
export type { Prisma } from '@prisma/client';
