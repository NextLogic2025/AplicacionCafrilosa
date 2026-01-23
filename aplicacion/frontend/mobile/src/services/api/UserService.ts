import { env } from '../../config/env'
import { ApiService } from './ApiService'
import { createService } from './createService'
import { getValidToken } from '../auth/authClient'
import { getUserFriendlyMessage, logErrorForDebugging } from '../../utils/errorMessages'

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

const USERS_URL = env.api.usersUrl
const AUTH_REGISTER_URL = `${env.api.baseUrl}/auth/registro`

const normalizeUser = (user: any): UserProfile => ({
    id: user.id,
    name: user.nombreCompleto || user.nombre || '',
    role: user.rol?.nombre || 'Usuario',
    email: user.email || '',
    phone: user.telefono || '',
    photoUrl: user.avatarUrl,
    active: user.activo !== undefined ? user.activo : true,
    lastLogin: user.lastLogin
})

const rawService = {
    async getProfile(): Promise<UserProfile | null> {
        try {
            const token = await getValidToken()
            if (!token) return null
            const data = await ApiService.get<any>(`${USERS_URL}/usuarios/me`)
            return normalizeUser(data)
        } catch (error) {
            logErrorForDebugging(error, 'UserService.getProfile')
            return null
        }
    },

    async updateProfile(userId: string, data: { nombre: string; telefono: string }): Promise<boolean> {
        try {
            await ApiService.put(`${USERS_URL}/usuarios/${userId}`, data)
            return true
        } catch (error) {
            logErrorForDebugging(error, 'UserService.updateProfile', { userId })
            return false
        }
    },

    async createUser(userData: CreateUserPayload): Promise<{ success: boolean; message?: string; userId?: string }> {
        try {
            const response = await ApiService.post<{ id?: string; userId?: string }>(AUTH_REGISTER_URL, userData)
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

    async getUsers(): Promise<UserProfile[]> {
        try {
            const data = await ApiService.get<any[]>(`${USERS_URL}/usuarios`)
            return data.map(normalizeUser)
        } catch (error) {
            logErrorForDebugging(error, 'UserService.getUsers')
            return []
        }
    },

    async getVendors(): Promise<UserProfile[]> {
        try {
            const data = await ApiService.get<any[]>(`${USERS_URL}/usuarios/vendedores`)
            return data.map(normalizeUser)
        } catch (error) {
            logErrorForDebugging(error, 'UserService.getVendors')
            return []
        }
    },

    async updateUser(userId: string, data: Partial<{ nombre: string; activo: boolean; rolId: number }>): Promise<{ success: boolean; message?: string }> {
        try {
            await ApiService.put(`${USERS_URL}/usuarios/${userId}`, data)
            if (data.activo !== undefined) {
                const action = data.activo ? 'activar' : 'desactivar'
                await ApiService.put(`${USERS_URL}/usuarios/${userId}/${action}`, {})
            }
            return { success: true, message: 'Usuario actualizado correctamente' }
        } catch (error: any) {
            logErrorForDebugging(error, 'UserService.updateUser', { userId })
            return { success: false, message: getUserFriendlyMessage(error, 'UPDATE_ERROR') }
        }
    },

    async deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
        try {
            await ApiService.delete(`${USERS_URL}/usuarios/${userId}`)
            return { success: true, message: 'Usuario eliminado correctamente' }
        } catch (error: any) {
            logErrorForDebugging(error, 'UserService.deleteUser', { userId })
            return { success: false, message: getUserFriendlyMessage(error, 'DELETE_ERROR') }
        }
    }
}

export const UserService = createService('UserService', rawService)

export interface CreateUserPayload {
    email: string
    password: string
    nombre: string
    rolId: number
}
