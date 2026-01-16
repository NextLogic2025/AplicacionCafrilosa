import { apiRequest } from './client'
import { Product } from './CatalogService'
import { Client } from './ClientService'
import { endpoints } from './endpoints'

export interface PromotionCampaign {
    id: number
    nombre: string
    descripcion: string
    fecha_inicio: string // ISO Date
    fecha_fin: string // ISO Date
    tipo_descuento: 'PORCENTAJE' | 'MONTO_FIJO'
    valor_descuento: number
    alcance: 'GLOBAL' | 'POR_LISTA' | 'POR_CLIENTE'
    lista_precios_objetivo_id?: number | null
    imagen_banner_url?: string
    activo: boolean
}

export interface PromotionProduct {
    campania_id: number
    producto_id: string
    precio_oferta_fijo: number | null
    producto?: Product // For display
}

export interface PromotionClient {
    campania_id: number
    cliente_id: string
    cliente?: Client // For display
}

export const PromotionService = {
    getCampaigns: async (): Promise<PromotionCampaign[]> => {
        return apiRequest<PromotionCampaign[]>(endpoints.catalog.promociones)
    },

    getCampaign: async (id: number): Promise<PromotionCampaign> => {
        return apiRequest<PromotionCampaign>(endpoints.catalog.promocionById(id))
    },

    createCampaign: async (data: Partial<PromotionCampaign>): Promise<PromotionCampaign> => {
        return apiRequest<PromotionCampaign>(endpoints.catalog.promociones, {
            method: 'POST',
            body: JSON.stringify(data)
        })
    },

    updateCampaign: async (id: number, data: Partial<PromotionCampaign>): Promise<PromotionCampaign> => {
        return apiRequest<PromotionCampaign>(endpoints.catalog.promocionById(id), {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    },

    deleteCampaign: async (id: number): Promise<void> => {
        return apiRequest<void>(endpoints.catalog.promocionById(id), {
            method: 'DELETE'
        })
    },

    getProducts: async (campaignId: number): Promise<PromotionProduct[]> => {
        const response = await apiRequest<{ items: any[] }>(endpoints.catalog.promocionProductos(campaignId))
        if (response && typeof response === 'object' && 'items' in response) {
            return (response.items || []).map((item: any) => ({
                campania_id: campaignId,
                producto_id: item.id,
                precio_oferta_fijo: item.precio_oferta !== undefined && item.precio_oferta !== null ? item.precio_oferta : null,
                producto: {
                    id: item.id,
                    codigo_sku: item.codigo_sku,
                    nombre: item.nombre,
                    descripcion: item.descripcion,
                    unidad_medida: item.unidad_medida,
                    imagen_url: item.imagen_url,
                    activo: item.activo,
                    precios: item.precios || [],
                    categoria: item.categoria || null,
                    promociones: item.promociones || []
                }
            }))
        }
        return []
    },

    addProduct: async (campaignId: number, productId: string, precioOferta?: number | null): Promise<PromotionProduct> => {
        const body: any = { producto_id: productId }
        if (precioOferta !== undefined && precioOferta !== null) {
            body.precio_oferta_fijo = precioOferta
        }

        return apiRequest<PromotionProduct>(endpoints.catalog.promocionProductos(campaignId), {
            method: 'POST',
            body: JSON.stringify(body)
        })
    },

    removeProduct: async (campaignId: number, productId: string): Promise<void> => {
        return apiRequest<void>(endpoints.catalog.promocionProductoById(campaignId, productId), {
            method: 'DELETE'
        })
    },

    getClients: async (campaignId: number): Promise<PromotionClient[]> => {
        return apiRequest<PromotionClient[]>(endpoints.catalog.promocionClientes(campaignId))
    },

    addClient: async (campaignId: number, clientId: string): Promise<PromotionClient> => {
        return apiRequest<PromotionClient>(endpoints.catalog.promocionClientes(campaignId), {
            method: 'POST',
            body: JSON.stringify({
                cliente_id: clientId
            })
        })
    },

    removeClient: async (campaignId: number, clientId: string): Promise<void> => {
        return apiRequest<void>(endpoints.catalog.promocionClienteById(campaignId, clientId), {
            method: 'DELETE'
        })
    }
}
