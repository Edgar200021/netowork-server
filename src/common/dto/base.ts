export type SuccessResponseDto<T> = {
  status: 'success'
  data: T
}

export type ErrorResponseDto = {
  status: 'error'
  error: string
}

export type ValidationErrorResponseDto = {
  status: 'error'
  errors: Record<string, string>
}
