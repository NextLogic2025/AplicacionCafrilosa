import { env } from '../../config/env'
import { apiRequest } from './client'
import { getUserFriendlyMessage, logErrorForDebugging } from '../../utils/errorMessages'
import { getValidToken } from '../auth/authClient'

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
            const token = await getValidToken()
            if (!token) return null
            const data = await apiRequest<any>(`${env.api.usersUrl}/usuarios/me`)

            return {
                id: data.id,
                name: data.nombreCompleto || data.nombre || '',
                role: data.rol?.nombre || 'Usuario',
                email: data.email || '',
                phone: data.telefono || 'Sin teléfono',
                photoUrl: data.avatarUrl,
                active: data.activo !== undefined ? data.activo : true,
                lastLogin: data.lastLogin
            }
        } catch (error) {
            logErrorForDebugging(error, 'UserService.getProfile')
            return null
        }
    },

    updateProfile: async (userId: string, data: { nombre: string; telefono: string }): Promise<boolean> => {
        try {
            await apiRequest(`${env.api.usersUrl}/usuarios/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            })
            return true
        } catch (error) {
            logErrorForDebugging(error, 'UserService.updateProfile', { userId })
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
                userId: response.id || response.userId
            }
        } catch (error: any) {
            logErrorForDebugging(error, 'UserService.createUser', { email: userData.email })
            return { success: false, message: getUserFriendlyMessage(error, 'CREATE_ERROR') }
        }
    },

    getUsers: async (): Promise<UserProfile[]> => {
        try {
            const data = await apiRequest<any[]>(`${env.api.usersUrl}/usuarios`)

            return data.map((u: any) => ({
                id: u.id,
                name: u.nombreCompleto || u.nombre || '',
                role: u.rol?.nombre || 'Usuario',
                email: u.email || '',
                phone: u.telefono || '',
                photoUrl: u.avatarUrl,
                active: u.activo !== undefined ? u.activo : true
            }))
        } catch (error) {
            logErrorForDebugging(error, 'UserService.getUsers')
            return []
        }
    },

    getVendors: async (): Promise<UserProfile[]> => {
        try {
            const data = await apiRequest<any[]>(`${env.api.usersUrl}/usuarios/vendedores`)

            return data.map((u: any) => ({
                id: u.id,
                name: u.nombreCompleto || u.nombre || '',
                role: u.rol?.nombre || 'Vendedor',
                email: u.email || '',
                phone: u.telefono || '',
                photoUrl: u.avatarUrl,
                active: u.activo !== undefined ? u.activo : true
            }))
        } catch (error) {
            logErrorForDebugging(error, 'UserService.getVendors')
            return []
        }
    },

    updateUser: async (userId: string, data: Partial<{ nombre: string; activo: boolean; rolId: number }>): Promise<{ success: boolean; message?: string }> => {
        try {
            await apiRequest(`${env.api.usersUrl}/usuarios/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            })

            if (data.activo !== undefined) {
                const action = data.activo ? 'activar' : 'desactivar'
                await apiRequest(`${env.api.usersUrl}/usuarios/${userId}/${action}`, {
                    method: 'PUT'
                })
            }

            return { success: true, message: 'Usuario actualizado correctamente' }
        } catch (error: any) {
            logErrorForDebugging(error, 'UserService.updateUser', { userId })
            return { success: false, message: getUserFriendlyMessage(error, 'UPDATE_ERROR') }
        }
    },

    deleteUser: async (userId: string): Promise<{ success: boolean; message?: string }> => {
        try {
            await apiRequest(`${env.api.usersUrl}/usuarios/${userId}`, {
                method: 'DELETE'
            })
            return { success: true, message: 'Usuario eliminado correctamente' }
        } catch (error: any) {
            logErrorForDebugging(error, 'UserService.deleteUser', { userId })
            return { success: false, message: getUserFriendlyMessage(error, 'DELETE_ERROR') }
        }
    }
}

export interface CreateUserPayload {
    email: string
    password: string
    nombre: string
    rolId: number
}
