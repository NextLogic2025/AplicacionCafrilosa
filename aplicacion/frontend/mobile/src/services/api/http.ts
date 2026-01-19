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

export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const baseUrl = env.api.baseUrl
  if (!baseUrl) throw new Error(ERROR_MESSAGES.SERVER_UNAVAILABLE)

  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers ?? {}) }
  if (options.auth !== false) {
    const token = await getValidToken()
    if (token && !('Authorization' in headers)) headers.Authorization = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body == null ? undefined : JSON.stringify(options.body),
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
  const data = (isJson ? (() => { try { return JSON.parse(text) } catch { return null } })() : null) as
    | T
    | { message?: string }
    | null

  if (!res.ok) {
    const backendMessage = typeof (data as { message?: string } | null)?.message === 'string'
      ? (data as { message: string }).message
      : undefined

    logErrorForDebugging(
      new Error(`HTTP ${res.status}`),
      'http.error',
      { path, status: res.status, backendMessage }
    )

    const userMessage = getUserFriendlyHttpMessage(res.status, backendMessage)
    throw new ApiError(userMessage, res.status, data ?? text)
  }

  if (data == null && !text) {
    logErrorForDebugging(new Error('Empty response'), 'http.emptyResponse', { path })
    throw new ApiError(ERROR_MESSAGES.SERVER_UNAVAILABLE, res.status)
  }

  if (data == null) return {} as T
  return data as T
}
