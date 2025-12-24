export class ExternalServiceError extends Error {
  constructor(
    message: string,
    public readonly service: 'meta-ads' | 'openai',
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'ExternalServiceError'
  }
}

export class MetaAdsApiError extends ExternalServiceError {
  constructor(
    message: string,
    public readonly errorCode?: number,
    public readonly errorSubcode?: number,
    statusCode?: number,
    originalError?: Error
  ) {
    super(message, 'meta-ads', statusCode, originalError)
    this.name = 'MetaAdsApiError'
  }

  static isRateLimitError(error: MetaAdsApiError): boolean {
    return error.errorCode === 17 || error.errorCode === 4
  }

  static isAuthError(error: MetaAdsApiError): boolean {
    return error.errorCode === 190 || error.errorCode === 102
  }

  static isTransientError(error: MetaAdsApiError): boolean {
    return error.errorCode === 1 || error.errorCode === 2
  }
}

export class OpenAIApiError extends ExternalServiceError {
  constructor(
    message: string,
    public readonly errorType?: string,
    statusCode?: number,
    originalError?: Error
  ) {
    super(message, 'openai', statusCode, originalError)
    this.name = 'OpenAIApiError'
  }

  static isRateLimitError(error: OpenAIApiError): boolean {
    return error.statusCode === 429
  }

  static isContextLengthError(error: OpenAIApiError): boolean {
    return error.errorType === 'context_length_exceeded'
  }

  static isTransientError(error: OpenAIApiError): boolean {
    return (
      error.statusCode === 500 ||
      error.statusCode === 502 ||
      error.statusCode === 503
    )
  }
}
