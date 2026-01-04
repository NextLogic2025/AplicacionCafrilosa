import { env } from '../../config/env'
import { apiRequest } from './client'

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
            // Using full URL to override default catalogUrl in client
            const data = await apiRequest<any>(`${env.api.baseUrl}/auth/me`)

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

    createUser: async (userData: CreateUserPayload): Promise<{ success: boolean; message?: string; userId?: string }> => {
        try {
            const response = await apiRequest<any>(`${env.api.baseUrl}/auth/registro`, {
                method: 'POST',
                body: JSON.stringify(userData)
            })

            return {
                success: true,
                message: 'Usuario creado exitosamente',
                userId: response.id || response.userId // Handling potential response variations
            }
        } catch (error: any) {
            console.error('Error creating user:', error)
            return { success: false, message: error.message || 'Error de red al crear usuario' }
        }
    },

    getUsers: async (): Promise<UserProfile[]> => {
        try {
            // Correct endpoint is /auth/usuarios
            const data = await apiRequest<any[]>(`${env.api.baseUrl}/auth/usuarios`)

            return data.map((u: any) => ({
                id: u.id,
                name: u.nombre,
                role: u.rol?.nombre || 'Usuario',
                email: u.email,
                phone: u.telefono || '',
                photoUrl: u.avatarUrl
            }))
        } catch (error) {
            console.error('Error fetching users:', error)
            return []
        }
    },

    getVendors: async (): Promise<UserProfile[]> => {
        try {
            const data = await apiRequest<any[]>(`${env.api.baseUrl}/auth/vendedores`)

            return data.map((u: any) => ({
                id: u.id,
                name: u.nombre,
                role: u.rol?.nombre || 'Vendedor',
                email: u.email,
                phone: u.telefono || '',
                photoUrl: u.avatarUrl
            }))
        } catch (error) {
            console.error('Error fetching vendors:', error)
            return []
        }
    },

    updateUser: async (userId: string, data: Partial<{ nombre: string; activo: boolean; rolId: number }>): Promise<{ success: boolean; message?: string }> => {
        try {
            await apiRequest(`${env.api.baseUrl}/auth/usuarios/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            })
            return { success: true, message: 'Usuario actualizado correctamente' }
        } catch (error: any) {
            console.error('Error updating user:', error)
            return { success: false, message: error.message || 'Error al actualizar usuario' }
        }
    },

    deleteUser: async (userId: string): Promise<{ success: boolean; message?: string }> => {
        try {
            await apiRequest(`${env.api.baseUrl}/auth/usuarios/${userId}`, {
                method: 'DELETE'
            })
            return { success: true, message: 'Usuario eliminado correctamente' }
        } catch (error: any) {
            console.error('Error deleting user:', error)
            return { success: false, message: error.message || 'Error al eliminar usuario' }
        }
    }
}

export interface CreateUserPayload {
    email: string
    password: string
    nombre: string
    rolId: number
}
