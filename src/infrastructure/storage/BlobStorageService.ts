import { put, del } from '@vercel/blob'
import type { IBlobStorageService } from '@application/ports/IBlobStorageService'

// re-export for backward compatibility
export type { IBlobStorageService } from '@application/ports/IBlobStorageService'

export class BlobStorageService implements IBlobStorageService {
  async upload(file: Buffer, filename: string, contentType: string): Promise<{ url: string }> {
    const blob = await put(filename, file, {
      access: 'public',
      contentType,
    })
    return { url: blob.url }
  }

  async delete(url: string): Promise<void> {
    await del(url)
  }
}
