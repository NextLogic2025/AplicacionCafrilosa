import { env } from '../../config/env'
import { getValidToken, signOut } from '../auth/authClient'
import { ApiError } from './ApiError'
import { resetToLogin } from '../../navigation/navigationRef'
import { ERROR_MESSAGES, logErrorForDebugging } from '../../utils/errorMessages'
import { showGlobalToast } from '../../utils/toastService'

export type HttpOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: unknown
  auth?: boolean
}

function getUserFriendlyHttpMessage(status: number, backendMessage?: string): string {
  if (backendMessage) {
    const msg = backendMessage.toLowerCase()
    if (msg.includes('credenciales') || msg.includes('inválid')) return ERROR_MESSAGES.INVALID_CREDENTIALS
    if (msg.includes('desactivado') || msg.includes('bloqueado')) return ERROR_MESSAGES.ACCOUNT_DISABLED
    if (msg.includes('no encontrado') || msg.includes('not found')) return ERROR_MESSAGES.NOT_FOUND
    if (msg.includes('ya existe') || msg.includes('duplicad')) return ERROR_MESSAGES.DUPLICATE_ENTRY
  }

  switch (status) {
    case 0: return ERROR_MESSAGES.NETWORK_ERROR
    case 400: return ERROR_MESSAGES.VALIDATION_ERROR
    case 401: return ERROR_MESSAGES.SESSION_EXPIRED
    case 403: return ERROR_MESSAGES.FORBIDDEN
    case 404: return ERROR_MESSAGES.NOT_FOUND
    case 409: return ERROR_MESSAGES.DUPLICATE_ENTRY
    case 422: return ERROR_MESSAGES.VALIDATION_ERROR
    case 500:
    case 502:
    case 503: return ERROR_MESSAGES.SERVER_UNAVAILABLE
    case 504: return ERROR_MESSAGES.TIMEOUT_ERROR
    default: return ERROR_MESSAGES.GENERIC_ERROR
  }
}

function sanitizeHeaders(rawHeaders?: Record<string, string>): Record<string, string> {
  if (!rawHeaders) return {}
  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(rawHeaders)) {
    if (value == null) continue
    const trimmed = value.toString().trim()
    if (trimmed.length === 0) continue
    headers[key] = trimmed
  }
  return headers
}

function removeUnsafeValues(value: unknown): unknown {
  if (value === null || value === undefined) return undefined

  if (typeof value === 'function') return undefined
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value

  if (Array.isArray(value)) {
    const filtered = value.map(removeUnsafeValues).filter(item => item !== undefined)
    return filtered
  }

  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, raw] of Object.entries(value)) {
      const cleaned = removeUnsafeValues(raw)
      if (cleaned !== undefined) {
        sanitized[key] = cleaned
      }
    }
    return sanitized
  }

  return undefined
}

function sanitizeRequestBody(body: unknown): string | undefined {
  if (body === null || body === undefined) return undefined
  const cleaned = removeUnsafeValues(body)
  try {
    return cleaned === undefined ? undefined : JSON.stringify(cleaned)
  } catch {
    return undefined
  }
}

function safeParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function sanitizeResponsePayload(payload: unknown): unknown {
  if (payload === null || payload === undefined) return payload
  if (typeof payload === 'string' || typeof payload === 'number' || typeof payload === 'boolean') {
    return payload
  }
  try {
    return JSON.parse(JSON.stringify(payload))
  } catch {
    return payload
  }
}

export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const baseUrl = env.api.baseUrl
  if (!baseUrl) throw new Error(ERROR_MESSAGES.SERVER_UNAVAILABLE)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...sanitizeHeaders(options.headers),
  }
  if (options.auth !== false) {
    const token = await getValidToken()
    if (token && !('Authorization' in headers)) headers.Authorization = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: sanitizeRequestBody(options.body),
    })
  } catch (networkError) {
    logErrorForDebugging(networkError, 'http.network', { path })
    throw new ApiError(ERROR_MESSAGES.NETWORK_ERROR, 0, networkError)
  }

  if (res.status === 401 && options.auth !== false) {
    logErrorForDebugging(new Error('401 Unauthorized'), 'http.auth', { path })
    await signOut()
    resetToLogin()
    showGlobalToast(ERROR_MESSAGES.SESSION_EXPIRED, 'error', 3500)
    throw new Error('SESSION_EXPIRED')
  }

  if (res.status === 204) return undefined as T

  const text = await res.text().catch(() => '')
  const isJson = (res.headers.get('content-type') ?? '').includes('application/json')
  const parsedJson = isJson ? safeParseJson(text) : null
  const sanitizedData = sanitizeResponsePayload(parsedJson ?? text) as T | { message?: string } | null

  if (!res.ok) {
  const backendMessage = typeof (sanitizedData as { message?: string } | null)?.message === 'string'
    ? (sanitizedData as { message: string }).message
    : undefined

    logErrorForDebugging(
      new Error(`HTTP ${res.status}`),
      'http.error',
      { path, status: res.status, backendMessage }
    )

    const userMessage = getUserFriendlyHttpMessage(res.status, backendMessage)
    throw new ApiError(userMessage, res.status, sanitizedData ?? text)
  }

  if (sanitizedData == null && !text) {
    logErrorForDebugging(new Error('Empty response'), 'http.emptyResponse', { path })
    throw new ApiError(ERROR_MESSAGES.SERVER_UNAVAILABLE, res.status)
  }

  if (sanitizedData == null) return {} as T
  return sanitizedData as T
}
