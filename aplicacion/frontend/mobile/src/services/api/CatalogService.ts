import { ApiService } from './ApiService'
import { endpoints } from './endpoints'
import { logErrorForDebugging } from '../../utils/errorMessages'
import { createService } from './createService'

export interface Category {
    id: number
    nombre: string
    descripcion?: string
    imagen_url?: string
    activo?: boolean
}

export interface Product {
    id: string
    codigo_sku: string
    nombre: string
    descripcion?: string
    categoria_id?: number
    categoria?: Category | { id: number; nombre: string }
    peso_unitario_kg?: number
    volumen_m3?: number
    requiere_frio?: boolean
    unidad_medida?: string
    imagen_url?: string
    activo: boolean
    precios?: Array<{ lista_id: number; precio: number }>
    precio_original?: number
    precio_oferta?: number
    ahorro?: number
    campania_aplicada_id?: number
    promociones?: Array<{
        campana_id: number
        precio_oferta: number | null
        tipo_descuento: string | null
        valor_descuento: number | null
    }>
}

export interface ProductsResponse {
    metadata: {
        total_items: number
        page: number
        per_page: number
        total_pages: number
    }
    items: Product[]
}

export interface PriceList {
    id: number
    nombre: string
    moneda: string
    activa: boolean
}

export interface Promotion {
    id: number
    nombre: string
    descripcion?: string
    fecha_inicio: string
    fecha_fin: string
    tipo_descuento: string
    valor_descuento: number
    activo: boolean
}

export interface CommercialZone {
    id: number
    nombre: string
    codigo: string
    ciudad?: string
    activo: boolean
}

const defaultProductsResponse = (perPage: number): ProductsResponse => ({
    metadata: { total_items: 0, page: 1, per_page: perPage, total_pages: 0 },
    items: []
})

type FallbackContext = {
    context: string
    details?: Record<string, unknown>
}

function enrichProductItem(item: any): Product {
    const precioLista = Number(item.precio_lista || 0)
    let precioOferta: number | undefined
    let ahorro: number | undefined
    let campaniaAplicadaId: number | undefined

    if (item.promociones && Array.isArray(item.promociones) && item.promociones.length > 0) {
        const mejorPromo = item.promociones[0]
        precioOferta = Number(mejorPromo.precio_oferta || 0)
        ahorro = precioLista - precioOferta
        campaniaAplicadaId = mejorPromo.campana_id
    }

    return {
        ...item,
        codigo_sku: item.codigo_sku,
        precio_original: precioLista,
        precio_oferta: precioOferta,
        ahorro,
        campania_aplicada_id: campaniaAplicadaId,
        promociones: item.promociones || []
    }
}

async function fetchProducts(url: string, perPage: number, fallbackContext: FallbackContext): Promise<ProductsResponse> {
    try {
        const response: any = await ApiService.get(url)
        const items = (response.items || []).map(enrichProductItem)
        return {
            metadata: response.metadata,
            items
        }
    } catch (error) {
        logErrorForDebugging(error, fallbackContext.context, fallbackContext.details)
        return defaultProductsResponse(perPage)
    }
}

const rawService = {
    getCategories: async (): Promise<Category[]> => {
        return await ApiService.get<Category[]>(endpoints.catalog.categories)
    },

    createCategory: async (data: Partial<Category>): Promise<Category> => {
        return await ApiService.post<Category>(endpoints.catalog.categories, data)
    },

    updateCategory: async (id: number, data: Partial<Category>): Promise<Category> => {
        return await ApiService.put<Category>(endpoints.catalog.categoryById(id), data)
    },

    deleteCategory: async (id: number): Promise<void> => {
        await ApiService.delete<void>(endpoints.catalog.categoryById(id))
    },

    getProducts: async (): Promise<Product[]> => {
        const response = await ApiService.get<ProductsResponse>(`${endpoints.catalog.products}?per_page=1000`)
        return response.items || []
    },

    getProductsPaginated: async (
        page: number = 1,
        perPage: number = 20,
        searchQuery?: string,
        clienteId?: string
    ): Promise<ProductsResponse> => {
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString()
        })

        if (searchQuery) params.append('q', searchQuery)
        if (clienteId) params.append('cliente_id', clienteId)

        const url = `${endpoints.catalog.products}?${params.toString()}`
        return await fetchProducts(url, perPage, { context: 'CatalogService.getProductsPaginated', details: { page, searchQuery } })
    },

    getClientProducts: async (
        page: number = 1,
        perPage: number = 20,
        searchQuery?: string
    ): Promise<ProductsResponse> => {
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString()
        })

        if (searchQuery) params.append('q', searchQuery)

        const url = `${endpoints.catalog.preciosClienteProductos}?${params.toString()}`
        return await fetchProducts(url, perPage, {
            context: 'CatalogService.getClientProducts',
            details: { page, searchQuery }
        })
    },

    getProductsForClient: async (
        page: number = 1,
        perPage: number = 20,
        searchQuery?: string,
        clientListId?: number
    ): Promise<ProductsResponse> => {
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString()
        })

        if (searchQuery) params.append('q', searchQuery)

        const endpoint = clientListId
            ? endpoints.catalog.preciosListaProductos(clientListId)
            : endpoints.catalog.preciosClienteProductos

        const url = `${endpoint}?${params.toString()}`
        return await fetchProducts(url, perPage, {
            context: 'CatalogService.getProductsForClient',
            details: { page, searchQuery, clientListId }
        })
    },

    getProductsByCategory: async (
        categoryId: number,
        page: number = 1,
        perPage: number = 20,
        searchQuery?: string,
        clienteId?: string
    ): Promise<ProductsResponse> => {
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString()
        })

        if (searchQuery) params.append('q', searchQuery)
        if (clienteId) params.append('cliente_id', clienteId)

        const url = `${endpoints.catalog.productsByCategory(categoryId)}?${params.toString()}`
        return await fetchProducts(url, perPage, {
            context: 'CatalogService.getProductsByCategory',
            details: { categoryId, page }
        })
    },

    getProductById: async (productId: string): Promise<Product | null> => {
        try {
            return await ApiService.get<Product>(endpoints.catalog.productById(productId))
        } catch (error) {
            logErrorForDebugging(error, 'CatalogService.getProductById', { productId })
            return null
        }
    },

    getClientProductDetail: async (productId: string): Promise<Product | null> => {
        try {
            const firstPage = await rawService.getClientProducts(1, 20)
            const findItem = (items: Product[]) => items.find(item => item.id === productId) ?? null

            const fromFirst = findItem(firstPage.items)
            if (fromFirst) return fromFirst

            const totalPages = firstPage.metadata.total_pages || 1
            for (let page = 2; page <= totalPages; page++) {
                const next = await rawService.getClientProducts(page, 20)
                const found = findItem(next.items)
                if (found) return found
            }

            return null
        } catch (error) {
            logErrorForDebugging(error, 'CatalogService.getClientProductDetail', { productId })
            return null
        }
    },

    createProduct: async (product: Partial<Product>): Promise<Product> => {
        return await ApiService.post<Product>(endpoints.catalog.products, product)
    },

    updateProduct: async (id: string, product: Partial<Product>): Promise<Product> => {
        return await ApiService.put<Product>(endpoints.catalog.productById(id), product)
    },

    deleteProduct: async (id: string): Promise<void> => {
        await ApiService.delete<void>(endpoints.catalog.productById(id))
    },

    getPromotions: async (): Promise<Promotion[]> => {
        return await ApiService.get<Promotion[]>(endpoints.catalog.promociones)
    },

    createPromotion: async (promo: Partial<Promotion>): Promise<Promotion> => {
        return await ApiService.post<Promotion>(endpoints.catalog.promociones, promo)
    },

    getZones: async (): Promise<CommercialZone[]> => {
        return await ApiService.get<CommercialZone[]>(endpoints.catalog.zonas)
    },

    createZone: async (zone: Partial<CommercialZone>): Promise<CommercialZone> => {
        return await ApiService.post<CommercialZone>(endpoints.catalog.zonas, zone)
    }
}

export const CatalogService = createService('CatalogService', rawService)
