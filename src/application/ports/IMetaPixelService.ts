/**
 * Meta Pixel API Service Port
 * Application layer interface for Meta Pixel operations
 */

export interface MetaPixelData {
  id: string
  name: string
  lastFiredTime?: string
  isActive: boolean
  creationTime: string
}

export interface MetaPixelStats {
  matchRate: number
  matchedEventCount: number
  unmatchedEventCount: number
}

export interface IMetaPixelService {
  /**
   * List all pixels accessible by the user
   */
  listPixels(accessToken: string): Promise<MetaPixelData[]>

  /**
   * Get pixel from an ad account
   */
  getAdAccountPixel(
    accessToken: string,
    adAccountId: string
  ): Promise<MetaPixelData | null>

  /**
   * Create a new pixel (requires business ID)
   */
  createPixel(
    accessToken: string,
    businessId: string,
    name: string
  ): Promise<MetaPixelData>

  /**
   * Get pixel details by ID
   */
  getPixel(accessToken: string, pixelId: string): Promise<MetaPixelData | null>

  /**
   * Get pixel statistics (match rate)
   */
  getPixelStats(
    accessToken: string,
    pixelId: string
  ): Promise<MetaPixelStats | null>
}
