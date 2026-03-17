import { IAdRepository } from '@domain/repositories/IAdRepository'

export class AdNotFoundError extends Error {
  constructor(id: string) {
    super(`Ad with id "${id}" not found`)
    this.name = 'AdNotFoundError'
  }
}

export class DeleteAdUseCase {
  constructor(private readonly adRepository: IAdRepository) {}

  async execute(id: string): Promise<void> {
    const ad = await this.adRepository.findById(id)
    if (!ad) {
      throw new AdNotFoundError(id)
    }

    await this.adRepository.delete(id)
  }
}
