export class AppError extends Error {
  constructor(
    message: string,
    private readonly _code: number
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }

  get code() {
    return this._code
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404)
  }
}

export class InternalServerError extends AppError {
  constructor(message: string) {
    super(message, 500)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401)
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string) {
    super(message, 401)
  }
}
