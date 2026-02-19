import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { AssetType } from '@domain/value-objects/CreativeAsset'
import { UploadAssetUseCase } from '@application/use-cases/creative/UploadAssetUseCase'
import { BlobStorageService } from '@/infrastructure/storage/BlobStorageService'
import { prisma } from '@/lib/prisma'

// CreativeAsset 리포지토리 인라인 구현
const assetRepository = {
  async save(asset: import('@domain/value-objects/CreativeAsset').CreativeAssetProps) {
    const created = await prisma.creativeAsset.create({
      data: {
        id: asset.id,
        type: asset.type,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType,
        width: asset.width ?? null,
        height: asset.height ?? null,
        duration: asset.duration ?? null,
        blobUrl: asset.blobUrl,
        metaHash: asset.metaHash ?? null,
        createdAt: asset.createdAt,
        user: { connect: { id: asset.userId } },
      },
    })
    return {
      ...created,
      type: created.type as AssetType,
      width: created.width ?? undefined,
      height: created.height ?? undefined,
      duration: created.duration ?? undefined,
      metaHash: created.metaHash ?? undefined,
      userId: asset.userId,
    }
  },
  async findById(id: string) {
    const asset = await prisma.creativeAsset.findUnique({ where: { id } })
    if (!asset) return null
    return {
      ...asset,
      type: asset.type as AssetType,
      width: asset.width ?? undefined,
      height: asset.height ?? undefined,
      duration: asset.duration ?? undefined,
      metaHash: asset.metaHash ?? undefined,
    }
  },
  async findByUserId(userId: string) {
    const assets = await prisma.creativeAsset.findMany({ where: { userId } })
    return assets.map((a) => ({
      ...a,
      type: a.type as AssetType,
      width: a.width ?? undefined,
      height: a.height ?? undefined,
      duration: a.duration ?? undefined,
      metaHash: a.metaHash ?? undefined,
    }))
  },
  async delete(id: string) {
    await prisma.creativeAsset.delete({ where: { id } })
  },
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { message: 'File is required' },
        { status: 400 }
      )
    }

    const typeStr = (formData.get('type') as string) ?? 'IMAGE'
    const type = typeStr === 'VIDEO' ? AssetType.VIDEO : AssetType.IMAGE
    const width = formData.get('width') ? Number(formData.get('width')) : undefined
    const height = formData.get('height') ? Number(formData.get('height')) : undefined
    const duration = formData.get('duration') ? Number(formData.get('duration')) : undefined

    const buffer = Buffer.from(await file.arrayBuffer())
    const blobStorage = new BlobStorageService()

    const useCase = new UploadAssetUseCase(assetRepository, blobStorage)

    const result = await useCase.execute({
      userId: user.id,
      file: buffer,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      type,
      width,
      height,
      duration,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Failed to upload asset:', error)
    const message = error instanceof Error ? error.message : 'Failed to upload asset'
    return NextResponse.json({ message }, { status: 400 })
  }
}
