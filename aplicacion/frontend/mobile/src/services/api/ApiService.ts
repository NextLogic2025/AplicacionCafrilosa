import { apiRequest } from './client'

export type ApiServiceOptions = RequestInit & {
    silent?: boolean
    auth?: boolean
}

function normalizeBody(body?: unknown) {
    if (body === undefined || body === null) return undefined
    return typeof body === 'string' ? body : JSON.stringify(body)
}

export const ApiService = {
    request: async <T>(endpoint: string, options: ApiServiceOptions = {}): Promise<T> => {
        return apiRequest<T>(endpoint, options)
    },
    get: async <T>(endpoint: string, options?: ApiServiceOptions): Promise<T> => {
        return ApiService.request(endpoint, { ...options, method: 'GET' })
    },
    post: async <T>(endpoint: string, body?: unknown, options?: ApiServiceOptions): Promise<T> => {
        return ApiService.request(endpoint, {
            ...options,
            method: 'POST',
            body: normalizeBody(body)
        })
    },
    put: async <T>(endpoint: string, body?: unknown, options?: ApiServiceOptions): Promise<T> => {
        return ApiService.request(endpoint, {
            ...options,
            method: 'PUT',
            body: normalizeBody(body)
        })
    },
    patch: async <T>(endpoint: string, body?: unknown, options?: ApiServiceOptions): Promise<T> => {
        return ApiService.request(endpoint, {
            ...options,
            method: 'PATCH',
            body: normalizeBody(body)
        })
    },
    delete: async <T>(endpoint: string, options?: ApiServiceOptions): Promise<T> => {
        return ApiService.request(endpoint, { ...options, method: 'DELETE' })
    }
}
