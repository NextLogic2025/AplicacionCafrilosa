import { httpWarehouse } from '../../../services/api/http'

export interface StockItem {
    id: string
    ubicacionId: string
    loteId: string
    // Extend with joined data usually returned by findAll
    ubicacion?: {
        id: string
        codigoVisual: string
        almacen?: { id: string; nombre: string }
    }
    lote?: {
        id: string
        codigo: string
        producto?: {
            id: string
            nombre: string
            codigo_sku: string
        }
        fecha_vencimiento: string
    }
    cantidadFisica: string // usually string from decimal in DB
    cantidadReservada: string
    cantidadDisponible: string
    updatedAt: string
}

export interface CreateStockDto {
    ubicacionId: string
    loteId: string
    cantidadFisica: number
}

export interface AjusteStockDto {
    ubicacionId: string
    loteId: string
    cantidad: number
    usuarioResponsableId: string // UUID
}

export async function getAllStock(): Promise<StockItem[]> {
    return httpWarehouse<StockItem[]>('/stock')
}

export async function getStockByLocation(id: string): Promise<StockItem[]> {
    return httpWarehouse<StockItem[]>(`/stock/ubicacion/${id}`)
}

export async function getStockByProduct(id: string): Promise<StockItem[]> {
    return httpWarehouse<StockItem[]>(`/stock/producto/${id}`)
}

export async function createStock(data: CreateStockDto): Promise<StockItem> {
    return httpWarehouse<StockItem>('/stock', {
        method: 'POST',
        body: data,
    })
}

export async function adjustStock(data: AjusteStockDto): Promise<void> {
    return httpWarehouse<void>('/stock/ajustar', {
        method: 'POST',
        body: data,
    })
}
