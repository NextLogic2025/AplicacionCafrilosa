import { apiRequest } from './client'
import { endpoints } from './endpoints'

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
    getLists: async (): Promise<PriceList[]> => {
        return apiRequest<PriceList[]>(endpoints.catalog.preciosListas)
    },

    createList: async (list: Partial<PriceList>): Promise<PriceList> => {
        return apiRequest<PriceList>(endpoints.catalog.preciosListas, {
            method: 'POST',
            body: JSON.stringify(list)
        })
    },

    updateList: async (id: number, list: Partial<PriceList>): Promise<PriceList> => {
        return apiRequest<PriceList>(endpoints.catalog.preciosListaById(id), {
            method: 'PATCH',
            body: JSON.stringify(list)
        })
    },

    deleteList: async (id: number): Promise<void> => {
        return apiRequest<void>(endpoints.catalog.preciosListaById(id), {
            method: 'DELETE'
        })
    },

    getByProduct: async (productId: string): Promise<any[]> => {
        return apiRequest<any[]>(endpoints.catalog.preciosProducto(productId))
    },

    assignPrice: async (data: { productoId: string, listaId: number, precio: number }) => {
        return apiRequest(endpoints.catalog.precios, {
            method: 'POST',
            body: JSON.stringify(data)
        })
    },

    deletePrice: async (productoId: string, listaId: number) => {
        return apiRequest(endpoints.catalog.preciosListaProducto(listaId, productoId), {
            method: 'DELETE'
        })
    }
}
