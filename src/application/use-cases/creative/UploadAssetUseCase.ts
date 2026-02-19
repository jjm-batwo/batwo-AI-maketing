import { CreativeAssetVO, AssetType, CreativeAssetProps } from '@domain/value-objects/CreativeAsset'
import { ICreativeAssetRepository } from '@domain/repositories/ICreativeAssetRepository'
import type { IBlobStorageService } from '@application/ports/IBlobStorageService'

export interface UploadAssetDTO {
  userId: string
  file: Buffer
  fileName: string
  mimeType: string
  fileSize: number
  type: AssetType
  width?: number
  height?: number
  duration?: number
}

export class UploadAssetUseCase {
  constructor(
    private readonly assetRepository: ICreativeAssetRepository,
    private readonly blobStorage: IBlobStorageService
  ) {}

  async execute(dto: UploadAssetDTO): Promise<CreativeAssetProps> {
    // 에셋 유효성 검증
    CreativeAssetVO.validate({
      type: dto.type,
      mimeType: dto.mimeType,
      fileSize: dto.fileSize,
      width: dto.width,
      height: dto.height,
    })

    // Blob Storage 업로드
    const { url } = await this.blobStorage.upload(
      dto.file,
      dto.fileName,
      dto.mimeType
    )

    // DB 저장
    const asset: CreativeAssetProps = {
      id: crypto.randomUUID(),
      userId: dto.userId,
      type: dto.type,
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      width: dto.width,
      height: dto.height,
      duration: dto.duration,
      blobUrl: url,
      createdAt: new Date(),
    }

    return this.assetRepository.save(asset)
  }
}
