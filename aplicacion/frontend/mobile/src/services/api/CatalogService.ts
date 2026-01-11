import { env } from '../../config/env'
import { apiRequest } from './client'

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
    // Pricing & Promotions (from backend)
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

/**
 * Paginated response for product lists
 */
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
    // --- Categories ---
    getCategories: async (): Promise<Category[]> => {
        return apiRequest<Category[]>('/api/categories', {
            useIdInsteadOfNumber: false // categories use number ID
        })
    },
    createCategory: async (data: Partial<Category>): Promise<Category> => {
        return apiRequest<Category>('/api/categories', {
            method: 'POST',
            body: JSON.stringify(data)
        })
    },
    updateCategory: async (id: number, data: Partial<Category>): Promise<Category> => {
        return apiRequest<Category>(`/api/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    },
    deleteCategory: async (id: number): Promise<void> => {
        return apiRequest<void>(`/api/categories/${id}`, {
            method: 'DELETE'
        })
    },

    // --- Products ---
    /**
     * Get all products (legacy method for supervisor screens)
     * Returns large page size for client-side filtering
     */
    getProducts: async (): Promise<Product[]> => {
        const response: any = await apiRequest('/api/products?per_page=1000')
        return response.items || response || []
    },

    /**
     * Get paginated products with client-specific pricing and promotions
     * For 'cliente' role: prices filtered by lista_precios_id, promotions by scope
     *
     * @param page - Page number (default: 1)
     * @param perPage - Items per page (default: 20)
     * @param searchQuery - Optional search by nombre or codigo_sku
     * @returns Paginated product list with metadata
     */
    getProductsPaginated: async (
        page: number = 1,
        perPage: number = 20,
        searchQuery?: string
    ): Promise<ProductsResponse> => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: perPage.toString()
            })

            if (searchQuery) {
                params.append('q', searchQuery)
            }

            return await apiRequest<ProductsResponse>(`/api/products?${params.toString()}`)
        } catch (error) {
            console.error('Error fetching paginated products:', error)
            return {
                metadata: { total_items: 0, page: 1, per_page: perPage, total_pages: 0 },
                items: []
            }
        }
    },

    /**
     * Get products filtered by category with pagination
     * Same pricing and promotion logic as getProductsPaginated
     *
     * @param categoryId - Category ID to filter by
     * @param page - Page number
     * @param perPage - Items per page
     * @param searchQuery - Optional search query
     * @returns Paginated product list for the category
     */
    getProductsByCategory: async (
        categoryId: number,
        page: number = 1,
        perPage: number = 20,
        searchQuery?: string
    ): Promise<ProductsResponse> => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: perPage.toString()
            })

            if (searchQuery) {
                params.append('q', searchQuery)
            }

            return await apiRequest<ProductsResponse>(
                `/api/products/categoria/${categoryId}?${params.toString()}`
            )
        } catch (error) {
            console.error('Error fetching products by category:', error)
            return {
                metadata: { total_items: 0, page: 1, per_page: perPage, total_pages: 0 },
                items: []
            }
        }
    },

    /**
     * Get detailed information for a single product
     * Includes client-specific pricing and promotions
     *
     * @param productId - Product UUID
     * @returns Product details with pricing
     */
    getProductById: async (productId: string): Promise<Product | null> => {
        try {
            return await apiRequest<Product>(`/api/products/${productId}`)
        } catch (error) {
            console.error('Error fetching product details:', error)
            return null
        }
    },
    createProduct: async (product: Partial<Product>): Promise<Product> => {
        return apiRequest<Product>('/api/products', {
            method: 'POST',
            body: JSON.stringify(product)
        })
    },
    updateProduct: async (id: string, product: Partial<Product>): Promise<Product> => {
        return apiRequest<Product>(`/api/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(product)
        })
    },
    deleteProduct: async (id: string): Promise<void> => {
        return apiRequest<void>(`/api/products/${id}`, {
            method: 'DELETE'
        })
    },



    // --- Promotions ---
    getPromotions: async (): Promise<Promotion[]> => {
        return apiRequest<Promotion[]>('/api/promotions')
    },
    createPromotion: async (promo: Partial<Promotion>): Promise<Promotion> => {
        return apiRequest<Promotion>('/api/promotions', {
            method: 'POST',
            body: JSON.stringify(promo)
        })
    },

    // --- Zones ---
    getZones: async (): Promise<CommercialZone[]> => {
        return apiRequest<CommercialZone[]>('/api/zones')
    },
    createZone: async (zone: Partial<CommercialZone>): Promise<CommercialZone> => {
        return apiRequest<CommercialZone>('/api/zones', {
            method: 'POST',
            body: JSON.stringify(zone)
        })
    },

    // --- Audit ---
    getAuditLogs: async (): Promise<AuditLog[]> => {
        return apiRequest<AuditLog[]>('/api/audit')
    }
}


