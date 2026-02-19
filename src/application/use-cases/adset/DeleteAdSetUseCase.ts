import { IAdSetRepository } from '@domain/repositories/IAdSetRepository'

export class AdSetNotFoundError extends Error {
  constructor(id: string) {
    super(`AdSet with id "${id}" not found`)
    this.name = 'AdSetNotFoundError'
  }
}

export class DeleteAdSetUseCase {
  constructor(
    private readonly adSetRepository: IAdSetRepository
  ) {}

  async execute(id: string): Promise<void> {
    const adSet = await this.adSetRepository.findById(id)
    if (!adSet) {
      throw new AdSetNotFoundError(id)
    }

    await this.adSetRepository.delete(id)
  }
}
