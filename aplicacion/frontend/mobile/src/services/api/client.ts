import { env } from '../../config/env'
import { getValidToken, signOut } from '../auth/authClient'
import { resetToLogin } from '../../navigation/navigationRef'
import { ApiError } from './ApiError'
import { ERROR_MESSAGES, logErrorForDebugging } from '../../utils/errorMessages'
import { showGlobalToast } from '../../utils/toastService'

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

function getUserFriendlyApiMessage(status: number, backendMessage?: string): string {
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
            logErrorForDebugging(networkError, 'apiRequest.network', { endpoint })
            throw new ApiError(ERROR_MESSAGES.NETWORK_ERROR, 0, networkError)
        }

        if (!response.ok) {
            if (response.status === 401) {
                logErrorForDebugging(new Error('401 Unauthorized'), 'apiRequest.auth', { endpoint })
                await signOut()
                resetToLogin()
                if (!options.silent) {
                    showGlobalToast(ERROR_MESSAGES.SESSION_EXPIRED, 'error', 3500)
                }
                throw new Error('SESSION_EXPIRED')
            }

            if (response.status === 403) {
                logErrorForDebugging(new Error('403 Forbidden'), 'apiRequest.permissions', { endpoint })
            }

            const errorText = await response.text().catch(() => '')
            const errorPayload =
                (response.headers.get('content-type') ?? '').includes('application/json') ? safeJsonParse(errorText) : null

            const backendMessage = typeof (errorPayload as any)?.message === 'string'
                ? (errorPayload as { message: string }).message
                : undefined

            const userMessage = getUserFriendlyApiMessage(response.status, backendMessage)

            logErrorForDebugging(
                new Error(`API ${response.status}`),
                'apiRequest.error',
                { endpoint, status: response.status, backendMessage }
            )

            throw new ApiError(userMessage, response.status, errorPayload ?? errorText)
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
            logErrorForDebugging(error, 'apiRequest', { endpoint })
        }
        throw error
    }
}
