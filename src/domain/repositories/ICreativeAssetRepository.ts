import { CreativeAssetProps } from '../value-objects/CreativeAsset'

export interface ICreativeAssetRepository {
  save(asset: CreativeAssetProps): Promise<CreativeAssetProps>
  findById(id: string): Promise<CreativeAssetProps | null>
  findByUserId(userId: string): Promise<CreativeAssetProps[]>
  delete(id: string): Promise<void>
}
