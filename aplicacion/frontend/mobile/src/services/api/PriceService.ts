import { env } from '../../config/env'
import { getValidToken, signOut } from '../auth/authClient'
import { resetToLogin } from '../../navigation/navigationRef'
import { apiRequest } from './client'

export interface PriceList {
    id: number
    nombre: string
    activa: boolean
    moneda: string
}

export interface PriceAssignment {
    productoId: string
    listaId: number
    precio: number
}

export const PriceService = {
    // --- Price Lists (CRUD) ---
    getLists: async (): Promise<PriceList[]> => {
        return apiRequest<PriceList[]>('/api/precios/listas')
    },

    createList: async (list: Partial<PriceList>): Promise<PriceList> => {
        return apiRequest<PriceList>('/api/precios/listas', {
            method: 'POST',
            body: JSON.stringify(list)
        })
    },

    updateList: async (id: number, list: Partial<PriceList>): Promise<PriceList> => {
        return apiRequest<PriceList>(`/api/precios/listas/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(list)
        })
    },

    deleteList: async (id: number): Promise<void> => {
        return apiRequest<void>(`/api/precios/listas/${id}`, {
            method: 'DELETE'
        })
    },

    // --- Product Prices ---

    // Get all prices for a specific product context (for Supervisor editing)
    getByProduct: async (productId: string): Promise<any[]> => {
        return apiRequest<any[]>(`/api/precios/producto/${productId}`)
    },

    // Assign/Update a price for a product in a specific list
    assignPrice: async (data: { productoId: string, listaId: number, precio: number }) => {
        return apiRequest('/api/precios', {
            method: 'POST',
            body: JSON.stringify(data)
        })
    },

    deletePrice: async (productoId: string, listaId: number) => {
        return apiRequest(`/api/precios/lista/${listaId}/producto/${productoId}`, {
            method: 'DELETE'
        })
    }
}
