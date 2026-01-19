export class ApiError extends Error {
  readonly status: number
  readonly payload?: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error != null &&
    (error as { name?: unknown }).name === 'ApiError' &&
    typeof (error as { status?: unknown }).status === 'number'
  )
}

