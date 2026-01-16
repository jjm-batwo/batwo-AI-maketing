import { IMetaPixelRepository } from '@domain/repositories/IMetaPixelRepository'
import { MetaPixel, PixelSetupMethod } from '@domain/entities/MetaPixel'

export enum SetupMode {
  MANUAL = 'MANUAL',
  PLATFORM_API = 'PLATFORM_API',
}

export interface NewPixelInput {
  metaPixelId: string
  name: string
}

export interface SetupPixelInput {
  userId: string
  pixelId?: string
  newPixel?: NewPixelInput
  setupMode: SetupMode
  platform?: 'CAFE24' | 'CUSTOM'
}

export interface SetupPixelResultDTO {
  pixelId: string
  metaPixelId: string
  name: string
  setupMode: SetupMode
  status: 'PENDING' | 'AWAITING_PLATFORM_CONNECT' | 'CONNECTED' | 'ACTIVE'
  scriptSnippet?: string
  platformConnectUrl?: string
}

export class SetupPixelUseCase {
  constructor(private readonly pixelRepository: IMetaPixelRepository) {}

  async execute(input: SetupPixelInput): Promise<SetupPixelResultDTO> {
    // Validation: Either pixelId or newPixel must be provided, but not both
    if (input.pixelId && input.newPixel) {
      throw new Error('Cannot specify both pixelId and newPixel')
    }

    if (!input.pixelId && !input.newPixel) {
      throw new Error('Either pixelId or newPixel must be provided')
    }

    // Validation: Platform must be specified for PLATFORM_API mode
    if (input.setupMode === SetupMode.PLATFORM_API && !input.platform) {
      throw new Error('Platform must be specified for PLATFORM_API mode')
    }

    let pixel: MetaPixel

    if (input.pixelId) {
      // Use existing pixel
      pixel = await this.getExistingPixel(input.userId, input.pixelId)
    } else {
      // Create new pixel
      pixel = await this.createNewPixel(input.userId, input.newPixel!, input.setupMode)
    }

    // Update setup method if needed
    const setupMethod =
      input.setupMode === SetupMode.PLATFORM_API
        ? PixelSetupMethod.PLATFORM_API
        : PixelSetupMethod.MANUAL

    if (pixel.setupMethod !== setupMethod) {
      pixel = pixel.updateSetupMethod(setupMethod)
      await this.pixelRepository.update(pixel)
    }

    // Build result
    return this.buildResult(pixel, input.setupMode, input.platform)
  }

  private async getExistingPixel(userId: string, pixelId: string): Promise<MetaPixel> {
    const pixel = await this.pixelRepository.findById(pixelId)

    if (!pixel || pixel.userId !== userId) {
      throw new Error('Pixel not found')
    }

    return pixel
  }

  private async createNewPixel(
    userId: string,
    newPixel: NewPixelInput,
    setupMode: SetupMode
  ): Promise<MetaPixel> {
    // Validate new pixel input
    if (!newPixel.name || newPixel.name.trim() === '') {
      throw new Error('Pixel name is required')
    }

    if (!this.isValidMetaPixelId(newPixel.metaPixelId)) {
      throw new Error('Invalid Meta Pixel ID format. Must be a 15-16 digit numeric string.')
    }

    const setupMethod =
      setupMode === SetupMode.PLATFORM_API
        ? PixelSetupMethod.PLATFORM_API
        : PixelSetupMethod.MANUAL

    const pixel = MetaPixel.create({
      userId,
      metaPixelId: newPixel.metaPixelId,
      name: newPixel.name.trim(),
      setupMethod,
    })

    return await this.pixelRepository.save(pixel)
  }

  private isValidMetaPixelId(metaPixelId: string): boolean {
    const pixelIdRegex = /^\d{15,16}$/
    return pixelIdRegex.test(metaPixelId)
  }

  private buildResult(
    pixel: MetaPixel,
    setupMode: SetupMode,
    platform?: 'CAFE24' | 'CUSTOM'
  ): SetupPixelResultDTO {
    const baseResult: SetupPixelResultDTO = {
      pixelId: pixel.id,
      metaPixelId: pixel.metaPixelId,
      name: pixel.name,
      setupMode,
      status: setupMode === SetupMode.MANUAL ? 'PENDING' : 'AWAITING_PLATFORM_CONNECT',
    }

    if (setupMode === SetupMode.MANUAL) {
      baseResult.scriptSnippet = this.generateScriptSnippet(pixel.metaPixelId)
    } else if (setupMode === SetupMode.PLATFORM_API && platform) {
      baseResult.platformConnectUrl = this.generatePlatformConnectUrl(pixel.id, platform)
    }

    return baseResult
  }

  private generateScriptSnippet(metaPixelId: string): string {
    return `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${metaPixelId}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`
  }

  private generatePlatformConnectUrl(pixelId: string, platform: 'CAFE24' | 'CUSTOM'): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://batwo.ai'

    if (platform === 'CAFE24') {
      return `${baseUrl}/api/platform/cafe24/auth?pixelId=${pixelId}`
    }

    return `${baseUrl}/setup/custom/${pixelId}`
  }
}
