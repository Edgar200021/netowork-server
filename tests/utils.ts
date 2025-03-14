import type { ValidationErrorResponseDto } from '../src/common/dto/base.dto.js'

export const createValidationError = (
  ...fields: string[]
): ValidationErrorResponseDto => {
  const errors = fields.reduce(
    (acc, field) => {
      acc[field] = `${field} is not valid`

      return acc
    },
    {} as Record<string, string>
  )

  return {
    status: 'error',
    errors,
  }
}
