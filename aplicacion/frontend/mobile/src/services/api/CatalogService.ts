/**
 * CatalogService - Servicio para gestión del catálogo de productos
 * Proporciona métodos para CRUD de productos, categorías, promociones y zonas
 */
import { env } from '../../config/env'
import { apiRequest } from './client'

// ==================== INTERFACES ====================

/** Categoría de productos */
export interface Category {
    id: number
    nombre: string
    descripcion?: string
    imagen_url?: string
    activo?: boolean
}

/** Producto del catálogo con información de precios y promociones */
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
    // Precios por lista de precios
    precios?: Array<{ lista_id: number; precio: number }>
    // Precio original y con descuento (calculado por backend según cliente)
    precio_original?: number
    precio_oferta?: number
    ahorro?: number
    campania_aplicada_id?: number
    // Lista de promociones aplicables al producto
    promociones?: Array<{
        campana_id: number
        precio_oferta: number | null
        tipo_descuento: string | null
        valor_descuento: number | null
    }>
}

/** Respuesta paginada para listados de productos */
export interface ProductsResponse {
    metadata: {
        total_items: number
        page: number
        per_page: number
        total_pages: number
    }
    items: Product[]
}

/** Lista de precios */
export interface PriceList {
    id: number
    nombre: string
    moneda: string
    activa: boolean
}

/** Promoción o campaña de descuento */
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

/** Zona comercial de distribución */
export interface CommercialZone {
    id: number
    nombre: string
    codigo: string
    ciudad?: string
    activo: boolean
}

/** Registro de auditoría para trazabilidad */
export interface AuditLog {
    id: string
    action: 'CREATE' | 'UPDATE' | 'DELETE'
    entity: string
    detail: string
    user: string
    time: string
}

// ==================== SERVICIO ====================

export const CatalogService = {
    // --- Categorías ---

    /** Obtiene todas las categorías de productos */
    getCategories: async (): Promise<Category[]> => {
        return apiRequest<Category[]>('/api/categories', {
            useIdInsteadOfNumber: false
        })
    },

    /** Crea una nueva categoría */
    createCategory: async (data: Partial<Category>): Promise<Category> => {
        return apiRequest<Category>('/api/categories', {
            method: 'POST',
            body: JSON.stringify(data)
        })
    },

    /** Actualiza una categoría existente */
    updateCategory: async (id: number, data: Partial<Category>): Promise<Category> => {
        return apiRequest<Category>(`/api/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    },

    /** Elimina una categoría por ID */
    deleteCategory: async (id: number): Promise<void> => {
        return apiRequest<void>(`/api/categories/${id}`, {
            method: 'DELETE'
        })
    },

    // --- Productos ---

    /**
     * Obtiene todos los productos (para pantallas de supervisor)
     * Retorna página grande para filtrado del lado del cliente
     */
    getProducts: async (): Promise<Product[]> => {
        const response: any = await apiRequest('/api/products?per_page=1000')
        return response.items || response || []
    },

    /**
     * Obtiene productos paginados con precios y promociones del cliente
     * Para rol 'cliente': precios filtrados por lista_precios_id, promociones por alcance
     * Para rol 'vendedor': puede pasar cliente_id para filtrar productos por lista del cliente
     * 
     * @param page - Número de página
     * @param perPage - Items por página
     * @param searchQuery - Búsqueda por nombre/SKU
     * @param clienteId - ID del cliente para filtrar precios y promociones (opcional, usado por vendedor)
     */
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

            if (searchQuery) {
                params.append('q', searchQuery)
            }

            // Si hay cliente_id, el backend filtra precios/promociones por su lista
            if (clienteId) {
                params.append('cliente_id', clienteId)
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
     * Obtiene productos con precios específicos del cliente autenticado
     * Usa el token JWT del cliente para determinar automáticamente su lista de precios
     * Este endpoint es específico para clientes - el backend resuelve la lista de precios desde el token
     * 
     * @param page - Número de página
     * @param perPage - Items por página
     * @param searchQuery - Búsqueda por nombre/SKU
     */
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

            if (searchQuery) {
                params.append('q', searchQuery)
            }

            // Llama al endpoint de precios que usa el token JWT del cliente
            const response: any = await apiRequest(`/api/precios/cliente/productos?${params.toString()}`)

            // CRITICAL: Transformar respuesta del backend al formato que espera el frontend
            // Backend devuelve: { precio_lista, promociones[] }
            // Frontend espera: { precio_original, precio_oferta, ahorro, campania_aplicada_id }
            const transformedItems = response.items.map((item: any) => {
                const precioLista = Number(item.precio_lista || 0)
                let precioOferta: number | undefined
                let ahorro: number | undefined
                let campaniaAplicadaId: number | undefined

                // Si hay promociones, tomar la mejor (primera en el array)
                if (item.promociones && Array.isArray(item.promociones) && item.promociones.length > 0) {
                    const mejorPromo = item.promociones[0]
                    precioOferta = Number(mejorPromo.precio_oferta || 0)
                    ahorro = precioLista - precioOferta
                    campaniaAplicadaId = mejorPromo.campana_id
                }

                return {
                    ...item,
                    // Mapear campos del backend al formato frontend
                    codigo_sku: item.codigo_sku,
                    precio_original: precioLista,
                    precio_oferta: precioOferta,
                    ahorro: ahorro,
                    campania_aplicada_id: campaniaAplicadaId,
                    // Mantener promociones para detalles
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

    /**
     * Obtiene productos filtrados por categoría con paginación
     * Misma lógica de precios y promociones que getProductsPaginated
     * 
     * @param categoryId - ID de la categoría
     * @param page - Número de página
     * @param perPage - Items por página
     * @param searchQuery - Búsqueda por nombre/SKU
     * @param clienteId - ID del cliente para filtrar precios y promociones (opcional)
     */
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

            if (searchQuery) {
                params.append('q', searchQuery)
            }

            if (clienteId) {
                params.append('cliente_id', clienteId)
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
     * Obtiene información detallada de un producto por ID
     * Incluye precios y promociones específicas del cliente
     */
    getProductById: async (productId: string): Promise<Product | null> => {
        try {
            return await apiRequest<Product>(`/api/products/${productId}`)
        } catch (error) {
            console.error('Error fetching product details:', error)
            return null
        }
    },

    /**
     * Obtiene información detallada de un producto para CLIENTES
     * 
     * NOTA TÉCNICA: No existe un endpoint dedicado /api/precios/cliente/producto/:id
     * Por lo tanto, usamos el endpoint de listado y buscamos el producto específico
     * 
     * Esta es una solución temporal hasta que el backend agregue un endpoint dedicado
     */
    getClientProductDetail: async (productId: string): Promise<Product | null> => {
        try {
            // Estrategia: Buscar el producto en el listado completo
            // Usar per_page grande para asegurar que está en la primera página
            const response: any = await apiRequest(`/api/precios/cliente/productos?per_page=1000`)

            if (!response || !response.items || !Array.isArray(response.items)) {
                console.error('Invalid response from client products endpoint')
                return null
            }

            // Buscar el producto específico en la lista
            const productInList = response.items.find((item: any) => item.id === productId)

            if (!productInList) {
                console.warn(`Product ${productId} not found in client products list`)
                return null
            }

            // Aplicar la misma transformación que en getClientProducts
            const precioLista = Number(productInList.precio_lista || 0)
            let precioOferta: number | undefined
            let ahorro: number | undefined
            let campaniaAplicadaId: number | undefined

            if (productInList.promociones && Array.isArray(productInList.promociones) && productInList.promociones.length > 0) {
                const mejorPromo = productInList.promociones[0]
                precioOferta = Number(mejorPromo.precio_oferta || 0)
                ahorro = precioLista - precioOferta
                campaniaAplicadaId = mejorPromo.campana_id
            }

            return {
                ...productInList,
                codigo_sku: productInList.codigo_sku,
                precio_original: precioLista,
                precio_oferta: precioOferta,
                ahorro: ahorro,
                campania_aplicada_id: campaniaAplicadaId,
                promociones: productInList.promociones || []
            }
        } catch (error) {
            console.error('Error fetching client product details:', error)
            return null
        }
    },

    /** Crea un nuevo producto en el catálogo */
    createProduct: async (product: Partial<Product>): Promise<Product> => {
        return apiRequest<Product>('/api/products', {
            method: 'POST',
            body: JSON.stringify(product)
        })
    },

    /** Actualiza un producto existente */
    updateProduct: async (id: string, product: Partial<Product>): Promise<Product> => {
        return apiRequest<Product>(`/api/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(product)
        })
    },

    /** Elimina un producto del catálogo */
    deleteProduct: async (id: string): Promise<void> => {
        return apiRequest<void>(`/api/products/${id}`, {
            method: 'DELETE'
        })
    },

    // --- Promociones ---

    /** Obtiene todas las promociones activas */
    getPromotions: async (): Promise<Promotion[]> => {
        return apiRequest<Promotion[]>('/api/promotions')
    },

    /** Crea una nueva promoción */
    createPromotion: async (promo: Partial<Promotion>): Promise<Promotion> => {
        return apiRequest<Promotion>('/api/promotions', {
            method: 'POST',
            body: JSON.stringify(promo)
        })
    },

    // --- Zonas Comerciales ---

    /** Obtiene todas las zonas comerciales */
    getZones: async (): Promise<CommercialZone[]> => {
        return apiRequest<CommercialZone[]>('/api/zones')
    },

    /** Crea una nueva zona comercial */
    createZone: async (zone: Partial<CommercialZone>): Promise<CommercialZone> => {
        return apiRequest<CommercialZone>('/api/zones', {
            method: 'POST',
            body: JSON.stringify(zone)
        })
    },

    // --- Auditoría ---

    /** Obtiene los registros de auditoría del sistema */
    getAuditLogs: async (): Promise<AuditLog[]> => {
        return apiRequest<AuditLog[]>('/api/audit')
    }
}


