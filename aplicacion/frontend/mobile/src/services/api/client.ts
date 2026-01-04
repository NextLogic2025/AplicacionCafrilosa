
import { env } from '../../config/env'
import { getValidToken, signOut } from '../auth/authClient'
import { resetToLogin } from '../../navigation/navigationRef'

interface ApiRequestOptions extends RequestInit {
    useIdInsteadOfNumber?: boolean // For endpoints expecting IDs as strings
}

export async function apiRequest<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    try {
        const token = await getValidToken()
        // console.log(`[API] Token for ${endpoint}:`, token ? `Exists (${token.substring(0, 5)}...)` : 'MISSING')

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        }

        const baseUrl = env.api.catalogUrl // Default to catalog, most used
        // Logic to switch URL based on endpoint or context could go here if needed
        // For now, assuming most robust generic calls hit catalog, but Auth/Users might need distinct handling in their own services or switching here.
        // Actually, CatalogService used env.api.catalogUrl. UserService likely uses env.api.baseUrl or authUrl.
        // Let's standardise on passing the full path or handling the base URL outside if it varies too much.
        // Or better: Use the endpoint to decide, or just stick to one base if they are unified via gateway.
        // Given current code, CatalogService uses catalogUrl.

        const url = endpoint.startsWith('http') ? endpoint : `${env.api.catalogUrl}${endpoint}`

        const response = await fetch(url, {
            ...options,
            headers,
        })

        if (!response.ok) {
            if (response.status === 401) {
                console.warn('[API] 401 Unauthorized - Redirecting to Login')
                await signOut()
                resetToLogin()
                throw new Error('SESSION_EXPIRED')
            }
            const errorBody = await response.text()
            throw new Error(`API Error ${response.status}: ${errorBody}`)
        }

        // Return void for 204 No Content
        if (response.status === 204) {
            return {} as T
        }

        return await response.json() as T
    } catch (error: any) {
        if (error?.message !== 'SESSION_EXPIRED') {
            console.error(`API Request Error [${endpoint}]:`, error)
        }
        throw error
    }
}
