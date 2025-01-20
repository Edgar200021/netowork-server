export class AppError extends Error {
  readonly statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    Object.setPrototypeOf(this, AppError.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not found') {
    super(message, 404)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403)
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500)
  }
}

export class ValidationError extends AppError {
  readonly errors: Record<string, string[]>
  constructor(errors: Record<string, string[]>) {
    super('Validation error', 422)
    this.errors = errors
  }
}

export class HealthCheckError extends Error {
  constructor(
    message: string = 'Health check error',
    public readonly statusCode: number = 503
  ) {
    super(message)
  }
}
