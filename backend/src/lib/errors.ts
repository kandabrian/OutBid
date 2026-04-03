/**
 * Custom error classes for the application
 * All errors include proper HTTP status codes and structured data
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Auth Errors (40x)
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super('AUTHENTICATION_ERROR', message, 401, details)
    this.name = 'AuthenticationError'
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = 'Invalid or expired token') {
    super('INVALID_TOKEN', message, 401)
    this.name = 'InvalidTokenError'
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string = 'Invalid email or password') {
    super('INVALID_CREDENTIALS', message, 401)
    this.name = 'InvalidCredentialsError'
  }
}

export class UserNotFoundError extends AppError {
  constructor(message: string = 'User not found') {
    super('USER_NOT_FOUND', message, 404)
    this.name = 'UserNotFoundError'
  }
}

export class UserAlreadyExistsError extends AppError {
  constructor(message: string = 'User already exists') {
    super('USER_ALREADY_EXISTS', message, 409)
    this.name = 'UserAlreadyExistsError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Forbidden') {
    super('UNAUTHORIZED', message, 403)
    this.name = 'UnauthorizedError'
  }
}

// Validation Errors (400)
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details)
    this.name = 'ValidationError'
  }
}

// Business Logic Errors (409)
export class BusinessLogicError extends AppError {
  constructor(code: string, message: string, details?: any) {
    super(code, message, 409, details)
    this.name = 'BusinessLogicError'
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(required: number, available: number) {
    super(
      'INSUFFICIENT_BALANCE',
      'Insufficient wallet balance',
      409,
      { required, available }
    )
    this.name = 'InsufficientBalanceError'
  }
}

export class MatchNotFoundError extends AppError {
  constructor(message: string = 'Match not found') {
    super('MATCH_NOT_FOUND', message, 404)
    this.name = 'MatchNotFoundError'
  }
}

export class InvalidMatchStateError extends AppError {
  constructor(
    message: string = 'Invalid match state for this operation',
    details?: any
  ) {
    super('INVALID_MATCH_STATE', message, 409, details)
    this.name = 'InvalidMatchStateError'
  }
}

export class EscrowError extends AppError {
  constructor(code: string, message: string, details?: any) {
    super(code, message, 409, details)
    this.name = 'EscrowError'
  }
}

// Payment Errors (402, 409)
export class PaymentError extends AppError {
  constructor(
    code: string = 'PAYMENT_ERROR',
    message: string = 'Payment processing failed',
    details?: any
  ) {
    super(code, message, 402, details)
    this.name = 'PaymentError'
  }
}

export class PaymentProviderError extends AppError {
  constructor(
    provider: string,
    message: string,
    details?: any
  ) {
    super(
      `${provider.toUpperCase()}_ERROR`,
      message,
      502,
      details
    )
    this.name = 'PaymentProviderError'
  }
}

export class WebhookVerificationError extends AppError {
  constructor(message: string = 'Webhook signature verification failed') {
    super('WEBHOOK_VERIFICATION_FAILED', message, 401)
    this.name = 'WebhookVerificationError'
  }
}

// Rate Limiting (429)
export class RateLimitError extends AppError {
  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter?: number
  ) {
    super('RATE_LIMIT_EXCEEDED', message, 429, { retryAfter })
    this.name = 'RateLimitError'
  }
}

// Server Errors (500)
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super('DATABASE_ERROR', message, 500)
    this.name = 'DatabaseError'
  }
}

export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = 'External service error'
  ) {
    super('EXTERNAL_SERVICE_ERROR', message, 503, { service })
    this.name = 'ExternalServiceError'
  }
}
