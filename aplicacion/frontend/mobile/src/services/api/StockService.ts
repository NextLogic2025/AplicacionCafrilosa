import { jwtDecode } from 'jwt-decode'
import { ApiService } from './ApiService'
import { createService } from './createService'
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

const rawService = {
    async list(): Promise<StockItem[]> {
        return ApiService.get<StockItem[]>(warehouse(endpoints.warehouse.stock))
    },

    async listByUbicacion(ubicacionId: string): Promise<StockItem[]> {
        return ApiService.get<StockItem[]>(warehouse(endpoints.warehouse.stockByUbicacion(ubicacionId)))
    },

    async listByProducto(productoId: string): Promise<StockItem[]> {
        return ApiService.get<StockItem[]>(warehouse(endpoints.warehouse.stockByProducto(productoId)))
    },

    async create(payload: CreateStockPayload): Promise<StockItem> {
        return ApiService.post<StockItem>(warehouse(endpoints.warehouse.stock), payload)
    },

    async ajustar(payload: AjusteStockPayload): Promise<StockItem> {
        const userId = await getCurrentUserId()
        if (!userId) {
            const err = new Error('missing_user')
            logErrorForDebugging(err, 'StockService.ajustar', { payload })
            throw err
        }
        return ApiService.post<StockItem>(warehouse(endpoints.warehouse.stockAjustar), {
            ...payload,
            usuarioResponsableId: userId
        })
    }
}

export const StockService = createService('StockService', rawService)
