export enum AssetType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export interface CreativeAssetProps {
  id: string
  userId: string
  type: AssetType
  fileName: string
  fileSize: number
  mimeType: string
  width?: number
  height?: number
  duration?: number
  blobUrl: string
  metaHash?: string
  createdAt: Date
}

// 이미지 허용 MIME 타입
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
// 동영상 허용 MIME 타입
const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime']

// 최대 파일 크기
const MAX_IMAGE_SIZE = 30 * 1024 * 1024 // 30MB
const MAX_VIDEO_SIZE = 4 * 1024 * 1024 * 1024 // 4GB

// 최소 이미지 크기
const MIN_IMAGE_WIDTH = 600
const MIN_IMAGE_HEIGHT = 600

export class CreativeAssetVO {
  static validate(props: {
    type: AssetType
    mimeType: string
    fileSize: number
    width?: number
    height?: number
  }): void {
    if (props.type === AssetType.IMAGE) {
      if (!IMAGE_MIME_TYPES.includes(props.mimeType)) {
        throw new Error(`허용되지 않는 이미지 형식입니다: ${props.mimeType}. jpeg, png, webp만 허용됩니다`)
      }
      if (props.fileSize > MAX_IMAGE_SIZE) {
        throw new Error(`이미지 파일 크기는 30MB를 초과할 수 없습니다`)
      }
      if (props.width !== undefined && props.width < MIN_IMAGE_WIDTH) {
        throw new Error(`이미지 너비는 최소 ${MIN_IMAGE_WIDTH}px이어야 합니다`)
      }
      if (props.height !== undefined && props.height < MIN_IMAGE_HEIGHT) {
        throw new Error(`이미지 높이는 최소 ${MIN_IMAGE_HEIGHT}px이어야 합니다`)
      }
    } else if (props.type === AssetType.VIDEO) {
      if (!VIDEO_MIME_TYPES.includes(props.mimeType)) {
        throw new Error(`허용되지 않는 동영상 형식입니다: ${props.mimeType}. mp4, mov만 허용됩니다`)
      }
      if (props.fileSize > MAX_VIDEO_SIZE) {
        throw new Error(`동영상 파일 크기는 4GB를 초과할 수 없습니다`)
      }
    }
  }
}
