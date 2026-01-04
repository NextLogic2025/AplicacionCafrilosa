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
    peso_unitario_kg?: number
    volumen_m3?: number
    requiere_frio?: boolean
    unidad_medida?: string
    imagen_url?: string
    activo: boolean
    // ... possibly other fields
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
    getProducts: async (): Promise<Product[]> => {
        return apiRequest<Product[]>('/api/products')
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


