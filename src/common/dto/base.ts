export type SuccessResponseDto<T> = {
  status: 'success'
  data: T
}

export type ErrorResponseDto = {
  status: 'error'
  message: string
}

export type ValidationErrorResponseDto = Record<string, string[]>
