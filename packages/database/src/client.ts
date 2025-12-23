/**
 * Prisma Client with encryption extension for sensitive fields
 *
 * This module creates a Prisma Client extended with automatic encryption/decryption
 * for MetaAdAccount.accessToken field. The extension ensures that access tokens
 * are always encrypted before being stored in the database and automatically
 * decrypted when retrieved.
 *
 * @example
 * import { prisma } from '@batow/database';
 *
 * // Create account - accessToken is automatically encrypted
 * const account = await prisma.metaAdAccount.create({
 *   data: {
 *     userId: 'user-123',
 *     adAccountId: 'act_123456',
 *     accessToken: 'plain-text-token', // Will be encrypted
 *     tokenExpiry: new Date(),
 *   }
 * });
 *
 * // Read account - accessToken is automatically decrypted
 * const retrieved = await prisma.metaAdAccount.findUnique({
 *   where: { id: account.id }
 * });
 * console.log(retrieved.accessToken); // Returns decrypted token
 */

import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from './crypto';

/**
 * Create Prisma Client with encryption extension
 *
 * The extension intercepts MetaAdAccount operations to:
 * - Encrypt accessToken on create/update (query phase)
 * - Decrypt accessToken on read (result phase)
 * - Handle null/undefined tokens gracefully
 */
function createPrismaClient() {
  const prismaClient = new PrismaClient();

  return prismaClient.$extends({
    name: 'metaAdAccountEncryption',
    query: {
      metaAdAccount: {
        /**
         * Encrypt accessToken before creating record
         */
        async create({ args, query }) {
          if (args.data.accessToken) {
            args.data.accessToken = encrypt(args.data.accessToken);
          }
          return query(args);
        },

        /**
         * Encrypt accessToken before updating record
         */
        async update({ args, query }) {
          if (args.data.accessToken) {
            args.data.accessToken = encrypt(args.data.accessToken as string);
          }
          return query(args);
        },

        /**
         * Encrypt accessToken before upserting record
         */
        async upsert({ args, query }) {
          if (args.create.accessToken) {
            args.create.accessToken = encrypt(args.create.accessToken);
          }
          if (args.update.accessToken) {
            args.update.accessToken = encrypt(args.update.accessToken as string);
          }
          return query(args);
        },

        /**
         * Encrypt accessToken in bulk updates
         */
        async updateMany({ args, query }) {
          if (args.data.accessToken) {
            args.data.accessToken = encrypt(args.data.accessToken as string);
          }
          return query(args);
        },
      },
    },
    result: {
      metaAdAccount: {
        /**
         * Decrypt accessToken when reading from database
         */
        accessToken: {
          needs: { accessToken: true },
          compute(metaAdAccount) {
            // Handle null/undefined tokens
            if (!metaAdAccount.accessToken) {
              return metaAdAccount.accessToken;
            }

            try {
              return decrypt(metaAdAccount.accessToken);
            } catch (error) {
              // Log error but don't fail the query
              console.error('Failed to decrypt accessToken:', error);
              // Return null instead of encrypted value to prevent data leaks
              return null;
            }
          },
        },
      },
    },
  });
}

/**
 * Global Prisma Client instance with encryption extension
 *
 * Uses global variable in development to prevent multiple instances
 * during hot reloading.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Type helper to get the extended Prisma Client type
 */
export type PrismaClientType = typeof prisma;
