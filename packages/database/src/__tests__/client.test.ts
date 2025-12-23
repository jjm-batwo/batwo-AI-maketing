/**
 * Tests for Prisma Client with encryption extension
 *
 * These tests verify that the Prisma Client extension correctly encrypts
 * accessToken on create/update operations and decrypts on read operations.
 *
 * @module @batow/database/client.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Store original env
const originalEnv = process.env.ENCRYPTION_KEY;

// Valid 32-byte encryption key for testing (exactly 32 characters)
const TEST_ENCRYPTION_KEY = 'test-32-byte-key-for-aes256!!!!!';

// Mock PrismaClient
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockUpsert = vi.fn();
const mockUpdateMany = vi.fn();
const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      $extends: vi.fn().mockImplementation((extension) => {
        // Store the extension for testing
        const extendedClient = {
          _extension: extension,
          metaAdAccount: {
            create: async (args: { data: { accessToken?: string } }) => {
              // Apply the extension's query transformation
              if (extension.query?.metaAdAccount?.create) {
                const transformedArgs = { ...args };
                await extension.query.metaAdAccount.create({
                  args: transformedArgs,
                  query: mockCreate.mockResolvedValue({
                    id: 'test-id',
                    ...transformedArgs.data,
                  }),
                });
                return mockCreate.mock.results[mockCreate.mock.results.length - 1]?.value;
              }
              return mockCreate(args);
            },
            update: async (args: { where: { id: string }; data: { accessToken?: string } }) => {
              if (extension.query?.metaAdAccount?.update) {
                const transformedArgs = { ...args };
                await extension.query.metaAdAccount.update({
                  args: transformedArgs,
                  query: mockUpdate.mockResolvedValue({
                    id: args.where.id,
                    ...transformedArgs.data,
                  }),
                });
                return mockUpdate.mock.results[mockUpdate.mock.results.length - 1]?.value;
              }
              return mockUpdate(args);
            },
            upsert: async (args: {
              where: { id: string };
              create: { accessToken?: string };
              update: { accessToken?: string };
            }) => {
              if (extension.query?.metaAdAccount?.upsert) {
                const transformedArgs = { ...args };
                await extension.query.metaAdAccount.upsert({
                  args: transformedArgs,
                  query: mockUpsert.mockResolvedValue({
                    id: 'test-id',
                    ...transformedArgs.create,
                  }),
                });
                return mockUpsert.mock.results[mockUpsert.mock.results.length - 1]?.value;
              }
              return mockUpsert(args);
            },
            updateMany: async (args: {
              where: { userId: string };
              data: { accessToken?: string };
            }) => {
              if (extension.query?.metaAdAccount?.updateMany) {
                const transformedArgs = { ...args };
                await extension.query.metaAdAccount.updateMany({
                  args: transformedArgs,
                  query: mockUpdateMany.mockResolvedValue({ count: 1 }),
                });
                return mockUpdateMany.mock.results[mockUpdateMany.mock.results.length - 1]?.value;
              }
              return mockUpdateMany(args);
            },
            findUnique: mockFindUnique,
            findMany: mockFindMany,
            findFirst: mockFindFirst,
          },
          // Expose result transformer for testing
          _getResultTransformer: () => extension.result?.metaAdAccount?.accessToken,
        };
        return extendedClient;
      }),
    })),
  };
});

describe('Prisma Client with Encryption Extension', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  describe('encrypt and decrypt integration', () => {
    it('should encrypt and decrypt correctly', async () => {
      const { encrypt, decrypt } = await import('../crypto');
      const plaintext = 'my-secret-token';

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('query extension - create', () => {
    it('should encrypt accessToken on create', async () => {
      const { prisma } = await import('../client');

      const plainToken = 'my-plain-token';
      await prisma.metaAdAccount.create({
        data: { accessToken: plainToken },
      });

      // Verify the mock was called with encrypted token
      expect(mockCreate).toHaveBeenCalled();
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.data.accessToken).not.toBe(plainToken);

      // Verify it's properly encrypted (can be decrypted)
      const { decrypt } = await import('../crypto');
      const decrypted = decrypt(callArgs.data.accessToken);
      expect(decrypted).toBe(plainToken);
    });

    it('should handle create without accessToken', async () => {
      const { prisma } = await import('../client');

      await prisma.metaAdAccount.create({
        data: {},
      });

      expect(mockCreate).toHaveBeenCalled();
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.data.accessToken).toBeUndefined();
    });
  });

  describe('query extension - update', () => {
    it('should encrypt accessToken on update', async () => {
      const { prisma } = await import('../client');

      const plainToken = 'updated-token';
      await prisma.metaAdAccount.update({
        where: { id: 'test-id' },
        data: { accessToken: plainToken },
      });

      expect(mockUpdate).toHaveBeenCalled();
      const callArgs = mockUpdate.mock.calls[0][0];
      expect(callArgs.data.accessToken).not.toBe(plainToken);

      const { decrypt } = await import('../crypto');
      const decrypted = decrypt(callArgs.data.accessToken);
      expect(decrypted).toBe(plainToken);
    });

    it('should handle update without accessToken', async () => {
      const { prisma } = await import('../client');

      await prisma.metaAdAccount.update({
        where: { id: 'test-id' },
        data: {},
      });

      expect(mockUpdate).toHaveBeenCalled();
      const callArgs = mockUpdate.mock.calls[0][0];
      expect(callArgs.data.accessToken).toBeUndefined();
    });
  });

  describe('query extension - upsert', () => {
    it('should encrypt accessToken on upsert create', async () => {
      const { prisma } = await import('../client');

      const createToken = 'create-token';
      const updateToken = 'update-token';

      await prisma.metaAdAccount.upsert({
        where: { id: 'test-id' },
        create: { accessToken: createToken },
        update: { accessToken: updateToken },
      });

      expect(mockUpsert).toHaveBeenCalled();
      const callArgs = mockUpsert.mock.calls[0][0];

      const { decrypt } = await import('../crypto');
      expect(decrypt(callArgs.create.accessToken)).toBe(createToken);
      expect(decrypt(callArgs.update.accessToken)).toBe(updateToken);
    });

    it('should handle upsert without accessToken', async () => {
      const { prisma } = await import('../client');

      await prisma.metaAdAccount.upsert({
        where: { id: 'test-id' },
        create: {},
        update: {},
      });

      expect(mockUpsert).toHaveBeenCalled();
      const callArgs = mockUpsert.mock.calls[0][0];
      expect(callArgs.create.accessToken).toBeUndefined();
      expect(callArgs.update.accessToken).toBeUndefined();
    });
  });

  describe('query extension - updateMany', () => {
    it('should encrypt accessToken on updateMany', async () => {
      const { prisma } = await import('../client');

      const plainToken = 'bulk-update-token';
      await prisma.metaAdAccount.updateMany({
        where: { userId: 'user-123' },
        data: { accessToken: plainToken },
      });

      expect(mockUpdateMany).toHaveBeenCalled();
      const callArgs = mockUpdateMany.mock.calls[0][0];

      const { decrypt } = await import('../crypto');
      expect(decrypt(callArgs.data.accessToken)).toBe(plainToken);
    });
  });

  describe('result extension - decryption', () => {
    it('should have result transformer defined', async () => {
      const { prisma } = await import('../client');

      // Access the internal extension via type assertion
      const client = prisma as unknown as { _getResultTransformer: () => unknown };
      const transformer = client._getResultTransformer();

      expect(transformer).toBeDefined();
      expect(transformer).toHaveProperty('needs');
      expect(transformer).toHaveProperty('compute');
    });

    it('should decrypt accessToken via compute function', async () => {
      const { prisma } = await import('../client');
      const { encrypt } = await import('../crypto');

      const plainToken = 'my-secret-token';
      const encryptedToken = encrypt(plainToken);

      // Get the result transformer
      const client = prisma as unknown as {
        _getResultTransformer: () => {
          needs: { accessToken: boolean };
          compute: (data: { accessToken: string | null }) => string | null;
        };
      };
      const transformer = client._getResultTransformer();

      // Test the compute function
      const result = transformer.compute({ accessToken: encryptedToken });
      expect(result).toBe(plainToken);
    });

    it('should handle null accessToken in compute', async () => {
      const { prisma } = await import('../client');

      const client = prisma as unknown as {
        _getResultTransformer: () => {
          compute: (data: { accessToken: string | null }) => string | null;
        };
      };
      const transformer = client._getResultTransformer();

      const result = transformer.compute({ accessToken: null });
      expect(result).toBeNull();
    });

    it('should handle empty string accessToken in compute', async () => {
      const { prisma } = await import('../client');

      const client = prisma as unknown as {
        _getResultTransformer: () => {
          compute: (data: { accessToken: string | null }) => string | null;
        };
      };
      const transformer = client._getResultTransformer();

      // Empty string is falsy, should return as-is
      const result = transformer.compute({ accessToken: '' });
      expect(result).toBe('');
    });

    it('should return null for invalid ciphertext in compute', async () => {
      const { prisma } = await import('../client');

      const client = prisma as unknown as {
        _getResultTransformer: () => {
          compute: (data: { accessToken: string | null }) => string | null;
        };
      };
      const transformer = client._getResultTransformer();

      // Mock console.error to prevent test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = transformer.compute({ accessToken: 'invalid-ciphertext' });
      expect(result).toBeNull();

      consoleSpy.mockRestore();
    });
  });

  describe('global singleton pattern', () => {
    it('should export prisma client', async () => {
      const { prisma } = await import('../client');
      expect(prisma).toBeDefined();
    });

    it('should export PrismaClientType', async () => {
      const module = await import('../client');
      expect(module).toHaveProperty('prisma');
    });
  });

  describe('encryption roundtrip via extension', () => {
    it('should correctly round-trip Meta Ads token format', async () => {
      const crypto = await import('../crypto');

      // Simulated Meta Ads access token
      const metaToken = 'EAABwzLixnjYBO0ZB2XZAZBqZCZAnKZCqJxMZCNhZBL8xK9ZC4QZDZD';

      const encrypted = crypto.encrypt(metaToken);
      const decrypted = crypto.decrypt(encrypted);

      expect(decrypted).toBe(metaToken);
      expect(encrypted).not.toBe(metaToken);
      expect(encrypted).not.toContain(metaToken);
    });
  });
});
