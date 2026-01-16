import { IMetaPixelRepository } from '@domain/repositories/IMetaPixelRepository'
import { PixelSetupMethod } from '@domain/entities/MetaPixel'

export enum PixelOperationalStatus {
  PENDING = 'PENDING',
  AWAITING_PLATFORM_CONNECT = 'AWAITING_PLATFORM_CONNECT',
  PLATFORM_CONNECTED = 'PLATFORM_CONNECTED',
  RECEIVING_EVENTS = 'RECEIVING_EVENTS',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR',
}

export interface GetPixelStatusInput {
  userId: string
  pixelId: string
}

export interface PixelStatusDTO {
  pixelId: string
  metaPixelId: string
  name: string
  isActive: boolean
  setupMethod: PixelSetupMethod
  operationalStatus: PixelOperationalStatus
  hasReceivedEvents: boolean
  eventCount: number
  lastEventAt: string | null
  errorMessage?: string
  platformStatus?: string
  lastSyncAt?: string
}

export interface IPlatformIntegrationRepository {
  findByPixelId(pixelId: string): Promise<{
    status: string
    lastSyncAt: Date | null
    errorMessage: string | null
  } | null>
}

export interface IConversionEventRepository {
  countByPixelId(pixelId: string): Promise<number>
  getLastEventTime(pixelId: string): Promise<Date | null>
}

export class GetPixelStatusUseCase {
  constructor(
    private readonly pixelRepository: IMetaPixelRepository,
    private readonly platformIntegrationRepository: IPlatformIntegrationRepository,
    private readonly conversionEventRepository: IConversionEventRepository
  ) {}

  async execute(input: GetPixelStatusInput): Promise<PixelStatusDTO> {
    // Get pixel
    const pixel = await this.pixelRepository.findById(input.pixelId)

    if (!pixel || pixel.userId !== input.userId) {
      throw new Error('Pixel not found')
    }

    // Get event statistics
    const eventCount = await this.conversionEventRepository.countByPixelId(pixel.id)
    const lastEventAt = await this.conversionEventRepository.getLastEventTime(pixel.id)
    const hasReceivedEvents = eventCount > 0

    // Determine operational status based on setup method
    let operationalStatus: PixelOperationalStatus
    let errorMessage: string | undefined
    let platformStatus: string | undefined
    let lastSyncAt: string | undefined

    if (pixel.setupMethod === PixelSetupMethod.MANUAL) {
      operationalStatus = hasReceivedEvents
        ? PixelOperationalStatus.RECEIVING_EVENTS
        : PixelOperationalStatus.PENDING
    } else {
      // PLATFORM_API setup method
      const integration = await this.platformIntegrationRepository.findByPixelId(pixel.id)

      if (!integration) {
        operationalStatus = PixelOperationalStatus.AWAITING_PLATFORM_CONNECT
      } else {
        platformStatus = integration.status
        lastSyncAt = integration.lastSyncAt?.toISOString()

        switch (integration.status) {
          case 'CONNECTED':
          case 'SCRIPT_INJECTED':
            operationalStatus = PixelOperationalStatus.PLATFORM_CONNECTED
            break
          case 'ACTIVE':
            operationalStatus = PixelOperationalStatus.ACTIVE
            break
          case 'ERROR':
          case 'DISCONNECTED':
            operationalStatus = PixelOperationalStatus.ERROR
            errorMessage = integration.errorMessage || undefined
            break
          default:
            operationalStatus = PixelOperationalStatus.AWAITING_PLATFORM_CONNECT
        }
      }
    }

    return {
      pixelId: pixel.id,
      metaPixelId: pixel.metaPixelId,
      name: pixel.name,
      isActive: pixel.isActive,
      setupMethod: pixel.setupMethod,
      operationalStatus,
      hasReceivedEvents,
      eventCount,
      lastEventAt: lastEventAt?.toISOString() || null,
      errorMessage,
      platformStatus,
      lastSyncAt,
    }
  }
}
