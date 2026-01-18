import { jwtDecode } from 'jwt-decode'
import { apiRequest } from './client'
import { env } from '../../config/env'
import { endpoints } from './endpoints'
import { logErrorForDebugging } from '../../utils/errorMessages'
import { getToken } from '../../storage/authStorage'

export type StockItem = {
    id: string
    ubicacionId: string
    loteId: string
    cantidadFisica: number
    cantidadReservada?: number
    ultimaEntrada?: string
    createdAt?: string
    updatedAt?: string
    ubicacion?: { id: string; codigoVisual?: string; almacenId?: number; almacen?: { nombre?: string } }
    lote?: { id: string; numeroLote?: string; productoId?: string; fechaVencimiento?: string }
}

export type CreateStockPayload = {
    ubicacionId: string
    loteId: string
    cantidadFisica: number
}

export type AjusteStockPayload = {
    ubicacionId: string
    loteId: string
    cantidad: number
}

const warehouse = (path: string) => `${env.api.warehouseUrl}${path}`

async function getCurrentUserId(): Promise<string | null> {
    const token = await getToken()
    if (!token) return null
    try {
        const decoded = jwtDecode<{ sub?: string; userId?: string }>(token)
        return decoded.userId || decoded.sub || null
    } catch (error) {
        logErrorForDebugging(error, 'StockService.getCurrentUserId')
        return null
    }
}

export const StockService = {
    async list(): Promise<StockItem[]> {
        try {
            return await apiRequest<StockItem[]>(warehouse(endpoints.warehouse.stock))
        } catch (error) {
            logErrorForDebugging(error, 'StockService.list')
            throw error
        }
    },

    async listByUbicacion(ubicacionId: string): Promise<StockItem[]> {
        try {
            return await apiRequest<StockItem[]>(warehouse(endpoints.warehouse.stockByUbicacion(ubicacionId)))
        } catch (error) {
            logErrorForDebugging(error, 'StockService.listByUbicacion', { ubicacionId })
            throw error
        }
    },

    async listByProducto(productoId: string): Promise<StockItem[]> {
        try {
            return await apiRequest<StockItem[]>(warehouse(endpoints.warehouse.stockByProducto(productoId)))
        } catch (error) {
            logErrorForDebugging(error, 'StockService.listByProducto', { productoId })
            throw error
        }
    },

    async create(payload: CreateStockPayload): Promise<StockItem> {
        try {
            return await apiRequest<StockItem>(warehouse(endpoints.warehouse.stock), {
                method: 'POST',
                body: JSON.stringify(payload),
            })
        } catch (error) {
            logErrorForDebugging(error, 'StockService.create', { payload })
            throw error
        }
    },

    async ajustar(payload: AjusteStockPayload): Promise<StockItem> {
        const userId = await getCurrentUserId()
        if (!userId) {
            const err = new Error('missing_user')
            logErrorForDebugging(err, 'StockService.ajustar', { payload })
            throw err
        }
        try {
            return await apiRequest<StockItem>(warehouse(endpoints.warehouse.stockAjustar), {
                method: 'POST',
                body: JSON.stringify({ ...payload, usuarioResponsableId: userId }),
            })
        } catch (error) {
            logErrorForDebugging(error, 'StockService.ajustar', { payload })
            throw error
        }
    },
}
