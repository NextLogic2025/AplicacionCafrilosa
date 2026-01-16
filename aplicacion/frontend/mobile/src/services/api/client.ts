import { env } from '../../config/env'
import { getValidToken, signOut } from '../auth/authClient'
import { resetToLogin } from '../../navigation/navigationRef'
import { ApiError } from './ApiError'

interface ApiRequestOptions extends RequestInit {
    useIdInsteadOfNumber?: boolean
    silent?: boolean
    auth?: boolean
}

function headersToObject(headers?: HeadersInit): Record<string, string> {
    if (!headers) return {}
    if (Array.isArray(headers)) return Object.fromEntries(headers)
    if (headers instanceof Headers) return Object.fromEntries(headers.entries())
    return { ...(headers as Record<string, string>) }
}

function safeJsonParse(text: string): unknown {
    try {
        return JSON.parse(text)
    } catch {
        return null
    }
}

function getErrorMessageFromPayload(payload: unknown, fallbackText: string): string {
    if (typeof payload === 'object' && payload != null) {
        const message = (payload as { message?: unknown }).message
        if (typeof message === 'string' && message.trim()) return message.trim()
    }
    if (fallbackText.trim()) return fallbackText.trim()
    return 'Error de API'
}

export async function apiRequest<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    try {
        const token = options.auth === false ? null : await getValidToken()

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...headersToObject(options.headers),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }

        const url = endpoint.startsWith('http') ? endpoint : `${env.api.catalogUrl}${endpoint}`

        let response: Response
        try {
            response = await fetch(url, {
                ...options,
                headers,
            })
        } catch (networkError) {
            throw new ApiError('API Error 0: Network request failed', 0, networkError)
        }

        if (!response.ok) {
            if (response.status === 401) {
                console.warn('[API] 401 Unauthorized - Redirecting to Login')
                await signOut()
                resetToLogin()
                throw new Error('SESSION_EXPIRED')
            }

            // Enhanced logging for 403 errors
            if (response.status === 403) {
                console.error(`[API] 403 Forbidden - Access denied to: ${endpoint}`)
                console.error('[API] Verify that the user role has permissions for this endpoint')
            }

            const errorText = await response.text().catch(() => '')
            const errorPayload =
                (response.headers.get('content-type') ?? '').includes('application/json') ? safeJsonParse(errorText) : null
            const message = getErrorMessageFromPayload(errorPayload, errorText)
            throw new ApiError(`API Error ${response.status}: ${message}`, response.status, errorPayload ?? errorText)
        }

        if (response.status === 204) {
            return {} as T
        }

        const text = await response.text().catch(() => '')
        if (!text) return {} as T

        const payload =
            (response.headers.get('content-type') ?? '').includes('application/json') ? safeJsonParse(text) : null
        if (payload != null) return payload as T

        const parsed = safeJsonParse(text)
        if (parsed != null) return parsed as T
        return {} as T
    } catch (error: any) {
        if (error?.message !== 'SESSION_EXPIRED' && !options.silent) {
            console.error(`API Request Error [${endpoint}]:`, error)
        }
        throw error
    }
}
