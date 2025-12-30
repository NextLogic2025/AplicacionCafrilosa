import { env } from '../../config/env'
import { getValidToken, signOut } from '../auth/authClient'
import { resetToLogin } from '../../navigation/navigationRef'

export interface UserProfile {
    id: string
    name: string
    role: string
    email: string
    phone: string
    photoUrl?: string
}

export const UserService = {
    getProfile: async (): Promise<UserProfile | null> => {
        try {
            const token = await getValidToken()
            if (!token) return null

            const response = await fetch(`${env.api.baseUrl}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                if (response.status === 401) {
                    console.warn('[UserService] 401 Unauthorized - Redirecting to Login')
                    await signOut()
                    resetToLogin()
                    return null
                }
                throw new Error('Failed to fetch profile')
            }

            const data = await response.json()
            return {
                id: data.id,
                name: data.nombre,
                role: data.rol?.nombre || 'Usuario',
                email: data.email,
                phone: data.telefono || 'Sin teléfono',
                photoUrl: data.avatarUrl
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
            return null
        }
    },

    createUser: async (userData: CreateUserPayload): Promise<{ success: boolean; message?: string }> => {
        try {
            // Not authentication required for registration endpoint? usually public but here using it as admin tool
            // If backend requires AUTH for this endpoint we'd add header.
            // Based on analysis, /auth/registro is PUBLIC.

            const response = await fetch(`${env.api.baseUrl}/auth/registro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            })

            const data = await response.json()

            if (!response.ok) {
                return { success: false, message: data.message || 'Error al crear usuario' }
            }

            return { success: true, message: 'Usuario creado exitosamente' }
        } catch (error) {
            console.error('Error creating user:', error)
            return { success: false, message: 'Error de red al crear usuario' }
        }
    },

    getUsers: async (): Promise<UserProfile[]> => {
        try {
            // Future-proof: This endpoint DOES NOT EXIST yet. It will 404.
            // Frontend will handle the empty/error state.
            const token = await getValidToken()
            if (!token) return []

            const response = await fetch(`${env.api.baseUrl}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!response.ok) return []

            const data = await response.json()
            // Map hypothetical backend response to UserProfile
            return data.map((u: any) => ({
                id: u.id,
                name: u.nombre,
                role: u.rol?.nombre || 'Usuario',
                email: u.email,
                phone: u.telefono || '',
                photoUrl: u.avatarUrl
            }))
        } catch (error) {
            console.warn('Backend for getUsers not ready yet')
            return []
        }
    }
}

export interface CreateUserPayload {
    email: string
    password: string
    nombre: string
    rolId: number
}
