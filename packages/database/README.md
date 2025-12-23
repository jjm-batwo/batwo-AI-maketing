# @batow/database

Database client package with automatic encryption for sensitive data.

## Features

- **Prisma Client** with automatic encryption extension
- **AES-256-GCM** encryption for `MetaAdAccount.accessToken`
- **Type-safe** database operations
- **Zero-configuration** encryption/decryption

## Setup

### 1. Environment Variables

Add to your `.env` file:

```bash
# Must be exactly 32 characters for AES-256
ENCRYPTION_KEY="your-32-byte-encryption-key!!"
```

Generate a secure key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64').substring(0, 32))"
```

### 2. Install Dependencies

```bash
pnpm install
```

## Usage

### Automatic Encryption (Recommended)

```typescript
import { prisma } from '@batow/database';

// Create account - accessToken is automatically encrypted
const account = await prisma.metaAdAccount.create({
  data: {
    userId: 'user-123',
    adAccountId: 'act_123456',
    accessToken: 'plain-text-token', // Encrypted before storage
    tokenExpiry: new Date(),
  },
});

// Read account - accessToken is automatically decrypted
const retrieved = await prisma.metaAdAccount.findUnique({
  where: { id: account.id },
});
console.log(retrieved.accessToken); // Returns decrypted token
```

### Manual Encryption

```typescript
import { encrypt, decrypt } from '@batow/database';

// Encrypt sensitive data
const encrypted = encrypt('my-secret-data');
console.log(encrypted); // Base64 string

// Decrypt data
const decrypted = decrypt(encrypted);
console.log(decrypted); // 'my-secret-data'
```

## Security

### Algorithm

- **Cipher**: AES-256-GCM
- **Key Size**: 32 bytes (256 bits)
- **IV Length**: 16 bytes (random per encryption)
- **Auth Tag**: 16 bytes (for integrity verification)

### Storage Format

```
base64(IV + authTag + ciphertext)
```

- **IV**: 16 bytes random initialization vector
- **authTag**: 16 bytes authentication tag
- **ciphertext**: Encrypted data

### Error Handling

- Invalid encryption key length → Error on first operation
- Decryption failure → Returns `null` (prevents data leaks)
- Missing ENCRYPTION_KEY → Error on module load

## Development

### Type Checking

```bash
pnpm typecheck
```

### Building

```bash
pnpm build
```

### Testing

```bash
pnpm test
```

## Important Notes

1. **Key Management**: Never commit the actual `ENCRYPTION_KEY` to version control
2. **Key Rotation**: Changing the key will make existing encrypted data unreadable
3. **Null Handling**: The extension gracefully handles null/undefined tokens
4. **Performance**: Each encryption generates a new random IV (cryptographically secure)

## Architecture

```
src/
├── crypto.ts      # AES-256-GCM encryption utilities
├── client.ts      # Prisma Client with encryption extension
└── index.ts       # Public API exports
```

## Dependencies

- `@prisma/client`: Database ORM
- `crypto`: Node.js built-in (AES-256-GCM)
- `zod`: Runtime validation

## Related Tasks

- **INF-002**: DB schema design (Prisma models)
- **INF-006**: Encryption setup (this package)
- **BE-003**: Meta Ads OAuth integration
