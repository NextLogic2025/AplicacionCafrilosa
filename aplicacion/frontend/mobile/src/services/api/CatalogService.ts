import { apiRequest } from './client'
import { endpoints } from './endpoints'

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

export interface AuditLog {
    id: string
    action: 'CREATE' | 'UPDATE' | 'DELETE'
    entity: string
    detail: string
    user: string
    time: string
}

export const CatalogService = {
    getCategories: async (): Promise<Category[]> => {
        return apiRequest<Category[]>(endpoints.catalog.categories)
    },

    createCategory: async (data: Partial<Category>): Promise<Category> => {
        return apiRequest<Category>(endpoints.catalog.categories, {
            method: 'POST',
            body: JSON.stringify(data)
        })
    },

    updateCategory: async (id: number, data: Partial<Category>): Promise<Category> => {
        return apiRequest<Category>(endpoints.catalog.categoryById(id), {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    },

    deleteCategory: async (id: number): Promise<void> => {
        return apiRequest<void>(endpoints.catalog.categoryById(id), {
            method: 'DELETE'
        })
    },

    getProducts: async (): Promise<Product[]> => {
        const response = await apiRequest<ProductsResponse>(`${endpoints.catalog.products}?per_page=1000`)
        return response.items || []
    },

    getProductsPaginated: async (
        page: number = 1,
        perPage: number = 20,
        searchQuery?: string,
        clienteId?: string
    ): Promise<ProductsResponse> => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: perPage.toString()
            })

            if (searchQuery) params.append('q', searchQuery)
            if (clienteId) params.append('cliente_id', clienteId)

            return await apiRequest<ProductsResponse>(`${endpoints.catalog.products}?${params.toString()}`)
        } catch (error) {
            console.error('Error fetching paginated products:', error)
            return {
                metadata: { total_items: 0, page: 1, per_page: perPage, total_pages: 0 },
                items: []
            }
        }
    },

    getClientProducts: async (
        page: number = 1,
        perPage: number = 20,
        searchQuery?: string
    ): Promise<ProductsResponse> => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: perPage.toString()
            })

            if (searchQuery) params.append('q', searchQuery)

            const response: any = await apiRequest(`${endpoints.catalog.preciosClienteProductos}?${params.toString()}`)

            const transformedItems = response.items.map((item: any) => {
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
                    ahorro: ahorro,
                    campania_aplicada_id: campaniaAplicadaId,
                    promociones: item.promociones || []
                }
            })

            return {
                metadata: response.metadata,
                items: transformedItems
            }
        } catch (error) {
            console.error('Error fetching client products:', error)
            return {
                metadata: { total_items: 0, page: 1, per_page: perPage, total_pages: 0 },
                items: []
            }
        }
    },

    getProductsByCategory: async (
        categoryId: number,
        page: number = 1,
        perPage: number = 20,
        searchQuery?: string,
        clienteId?: string
    ): Promise<ProductsResponse> => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: perPage.toString()
            })

            if (searchQuery) params.append('q', searchQuery)
            if (clienteId) params.append('cliente_id', clienteId)

            return await apiRequest<ProductsResponse>(
                `${endpoints.catalog.productsByCategory(categoryId)}?${params.toString()}`
            )
        } catch (error) {
            console.error('Error fetching products by category:', error)
            return {
                metadata: { total_items: 0, page: 1, per_page: perPage, total_pages: 0 },
                items: []
            }
        }
    },

    getProductById: async (productId: string): Promise<Product | null> => {
        try {
            return await apiRequest<Product>(endpoints.catalog.productById(productId))
        } catch (error) {
            console.error('Error fetching product details:', error)
            return null
        }
    },

    getClientProductDetail: async (productId: string): Promise<Product | null> => {
        try {
            const firstPage = await CatalogService.getClientProducts(1, 20)
            const tryFind = (items: Product[]) => items.find((item) => item.id === productId) ?? null

            const fromFirst = tryFind(firstPage.items)
            if (fromFirst) return fromFirst

            const totalPages = firstPage.metadata.total_pages || 1
            for (let page = 2; page <= totalPages; page++) {
                const next = await CatalogService.getClientProducts(page, 20)
                const found = tryFind(next.items)
                if (found) return found
            }

            return null
        } catch (error) {
            console.error('Error fetching client product details:', error)
            return null
        }
    },

    createProduct: async (product: Partial<Product>): Promise<Product> => {
        return apiRequest<Product>(endpoints.catalog.products, {
            method: 'POST',
            body: JSON.stringify(product)
        })
    },

    updateProduct: async (id: string, product: Partial<Product>): Promise<Product> => {
        return apiRequest<Product>(endpoints.catalog.productById(id), {
            method: 'PUT',
            body: JSON.stringify(product)
        })
    },

    deleteProduct: async (id: string): Promise<void> => {
        return apiRequest<void>(endpoints.catalog.productById(id), {
            method: 'DELETE'
        })
    },

    getPromotions: async (): Promise<Promotion[]> => {
        return apiRequest<Promotion[]>(endpoints.catalog.promociones)
    },

    createPromotion: async (promo: Partial<Promotion>): Promise<Promotion> => {
        return apiRequest<Promotion>(endpoints.catalog.promociones, {
            method: 'POST',
            body: JSON.stringify(promo)
        })
    },

    getZones: async (): Promise<CommercialZone[]> => {
        return apiRequest<CommercialZone[]>(endpoints.catalog.zonas)
    },

    createZone: async (zone: Partial<CommercialZone>): Promise<CommercialZone> => {
        return apiRequest<CommercialZone>(endpoints.catalog.zonas, {
            method: 'POST',
            body: JSON.stringify(zone)
        })
    },

    getAuditLogs: async (): Promise<AuditLog[]> => {
        return apiRequest<AuditLog[]>('/api/audit')
    }
}
