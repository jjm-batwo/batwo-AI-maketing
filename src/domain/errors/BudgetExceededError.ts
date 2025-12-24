import { DomainError } from './DomainError'

export class BudgetExceededError extends DomainError {
  readonly code = 'BUDGET_EXCEEDED'

  constructor(
    message: string,
    public readonly budget: number,
    public readonly spent: number
  ) {
    super(message)
  }

  static dailyBudgetExceeded(budget: number, spent: number): BudgetExceededError {
    return new BudgetExceededError(
      `Daily budget of ${budget} exceeded. Current spend: ${spent}`,
      budget,
      spent
    )
  }

  static lifetimeBudgetExceeded(budget: number, spent: number): BudgetExceededError {
    return new BudgetExceededError(
      `Lifetime budget of ${budget} exceeded. Current spend: ${spent}`,
      budget,
      spent
    )
  }
}
