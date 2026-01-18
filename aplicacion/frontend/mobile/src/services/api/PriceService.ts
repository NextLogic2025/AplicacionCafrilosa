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

export interface PriceListProductPromotion {
    campana_id?: number
    campana_nombre?: string
    tipo_descuento?: string
    valor_descuento?: number
    precio_oferta?: number
}

export interface PriceListProduct {
    id: string
    codigo_sku: string
    nombre: string
    unidad_medida?: string
    precio_lista: number
    promociones: PriceListProductPromotion[]
}

export interface PriceListProductsResponse {
    metadata: {
        total_items: number
        page: number
        per_page: number
        total_pages: number
    }
    items: PriceListProduct[]
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
    },

    getProductsForList: async (
        listId: number,
        page: number = 1,
        perPage: number = 20,
        search?: string
    ): Promise<PriceListProductsResponse> => {
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString()
        })
        if (search) params.append('q', search)

        return apiRequest<PriceListProductsResponse>(
            `${endpoints.catalog.preciosListaProductos(listId)}?${params.toString()}`
        )
    }
}
