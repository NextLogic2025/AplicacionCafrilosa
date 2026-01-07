import { env } from '../../config/env'
import { apiRequest } from './client'

export interface UserProfile {
    id: string
    name: string
    role: string
    email: string
    phone: string
    photoUrl?: string
    active: boolean
    lastLogin?: string
}

export const UserService = {
    getProfile: async (): Promise<UserProfile | null> => {
        try {
            // Using usersUrl for user-related data
            const data = await apiRequest<any>(`${env.api.usersUrl}/auth/me`)

            return {
                id: data.id,
                name: data.nombre,
                role: data.rol?.nombre || 'Usuario',
                email: data.email,
                phone: data.telefono || 'Sin teléfono',
                photoUrl: data.avatarUrl,
                active: data.activo,
                lastLogin: data.lastLogin
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
            return null
        }
    },

    updateProfile: async (userId: string, data: { nombre: string; telefono: string }): Promise<boolean> => {
        try {
            await apiRequest(`${env.api.usersUrl}/auth/usuarios/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            })
            return true
        } catch (error) {
            console.error('Error updating profile:', error)
            return false
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
            // Users service endpoints
            const data = await apiRequest<any[]>(`${env.api.usersUrl}/auth/usuarios`)

            return data.map((u: any) => ({
                id: u.id,
                name: u.nombre,
                role: u.rol?.nombre || 'Usuario',
                email: u.email,
                phone: u.telefono || '',
                photoUrl: u.avatarUrl,
                active: u.activo
            }))
        } catch (error) {
            console.error('Error fetching users:', error)
            return []
        }
    },

    getVendors: async (): Promise<UserProfile[]> => {
        try {
            const data = await apiRequest<any[]>(`${env.api.usersUrl}/auth/vendedores`)

            return data.map((u: any) => ({
                id: u.id,
                name: u.nombre,
                role: u.rol?.nombre || 'Vendedor',
                email: u.email,
                phone: u.telefono || '',
                photoUrl: u.avatarUrl,
                active: u.activo
            }))
        } catch (error) {
            console.error('Error fetching vendors:', error)
            return []
        }
    },

    updateUser: async (userId: string, data: Partial<{ nombre: string; activo: boolean; rolId: number }>): Promise<{ success: boolean; message?: string }> => {
        try {
            // 1. Update basic info (Name, Role, etc.)
            await apiRequest(`${env.api.usersUrl}/auth/usuarios/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            })

            // 2. Handle Activation/Deactivation Explicitly if provided
            if (data.activo !== undefined) {
                const action = data.activo ? 'activar' : 'desactivar'
                await apiRequest(`${env.api.usersUrl}/auth/usuarios/${userId}/${action}`, {
                    method: 'PUT'
                })
            }

            return { success: true, message: 'Usuario actualizado correctamente' }
        } catch (error: any) {
            console.error('Error updating user:', error)
            return { success: false, message: error.message || 'Error al actualizar usuario' }
        }
    },

    deleteUser: async (userId: string): Promise<{ success: boolean; message?: string }> => {
        try {
            await apiRequest(`${env.api.usersUrl}/auth/usuarios/${userId}`, {
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
