export interface IBlobStorageService {
  upload(file: Buffer, filename: string, contentType: string): Promise<{ url: string }>
  delete(url: string): Promise<void>
}
