import { PrismaClient } from '@/generated/prisma'
import { ICreativeAssetRepository } from '@domain/repositories/ICreativeAssetRepository'
import { CreativeAssetProps, AssetType } from '@domain/value-objects/CreativeAsset'

export class PrismaCreativeAssetRepository implements ICreativeAssetRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(asset: CreativeAssetProps): Promise<CreativeAssetProps> {
    const created = await this.prisma.creativeAsset.create({
      data: {
        id: asset.id,
        userId: asset.userId,
        type: asset.type,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType,
        width: asset.width,
        height: asset.height,
        duration: asset.duration,
        blobUrl: asset.blobUrl,
        metaHash: asset.metaHash,
      },
    })

    return this.toDomain(created)
  }

  async findById(id: string): Promise<CreativeAssetProps | null> {
    const asset = await this.prisma.creativeAsset.findUnique({ where: { id } })
    if (!asset) return null
    return this.toDomain(asset)
  }

  async findByUserId(userId: string): Promise<CreativeAssetProps[]> {
    const assets = await this.prisma.creativeAsset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return assets.map(this.toDomain)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.creativeAsset.delete({ where: { id } })
  }

  private toDomain(record: {
    id: string
    userId: string
    type: string
    fileName: string
    fileSize: number
    mimeType: string
    width: number | null
    height: number | null
    duration: number | null
    blobUrl: string
    metaHash: string | null
    createdAt: Date
  }): CreativeAssetProps {
    return {
      id: record.id,
      userId: record.userId,
      type: record.type as AssetType,
      fileName: record.fileName,
      fileSize: record.fileSize,
      mimeType: record.mimeType,
      width: record.width ?? undefined,
      height: record.height ?? undefined,
      duration: record.duration ?? undefined,
      blobUrl: record.blobUrl,
      metaHash: record.metaHash ?? undefined,
      createdAt: record.createdAt,
    }
  }
}
