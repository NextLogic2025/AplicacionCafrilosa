import { apiRequest } from './client'
import { env } from '../../config/env'
import { endpoints } from './endpoints'
import { logErrorForDebugging } from '../../utils/errorMessages'

export type PickingEstado = 'PENDIENTE' | 'ASIGNADO' | 'EN_PROCESO' | 'COMPLETADO' | string
export type PickingItemEstado = 'PENDIENTE' | 'PARCIAL' | 'COMPLETADO' | string

// Ubicación sugerida enriquecida
export type UbicacionSugerida = {
    id: string
    codigoVisual?: string
    nombre?: string
}

// Lote sugerido enriquecido
export type LoteSugerido = {
    id: string
    numeroLote?: string
    fechaVencimiento?: string
}

// Item de picking con campos enriquecidos del backend
export type PickingItem = {
    id: string
    pickingId?: string
    productoId: string
    cantidadSolicitada: number
    cantidadPickeada?: number
    estadoLinea?: PickingItemEstado
    ubicacionOrigenSugerida?: string
    loteSugerido?: string | null
    loteConfirmado?: string | null
    createdAt?: string
    updatedAt?: string
    // Campos enriquecidos
    nombreProducto?: string
    sku?: string
    ubicacionSugerida?: UbicacionSugerida
    loteInfo?: LoteSugerido
    cantidadDisponible?: number
    cantidadReservada?: number
}

// Información del pedido enriquecida
export type PedidoInfo = {
    numero?: string | number
    clienteNombre?: string
    referenciaComercial?: string
}

// Información del bodeguero asignado
export type BodegueroInfo = {
    id: string
    nombreCompleto?: string
}

// Stock alternativo para cambio de lote
export type AlternativeStock = {
    ubicacion: {
        id: string
        codigoVisual?: string
        nombre?: string
    }
    lote: {
        id: string
        numeroLote?: string
        fechaVencimiento?: string
    }
    cantidadDisponible: number
}

// Motivos de desviación predefinidos
export const MOTIVOS_DESVIACION = [
    { value: 'FALTANTE', label: 'Faltante (No hay stock físico)' },
    { value: 'DANADO', label: 'Producto Dañado' },
    { value: 'VENCIDO', label: 'Producto Vencido' },
    { value: 'ERROR_INVENTARIO', label: 'Error de Inventario' },
    { value: 'OTRO', label: 'Otro' },
] as const

// Picking con campos enriquecidos del backend
export type Picking = {
    id: string
    pedidoId?: string
    reservationId?: string
    estado: PickingEstado
    prioridad?: number
    fechaInicio?: string
    fechaFin?: string
    observacionesBodega?: string
    createdAt?: string
    updatedAt?: string
    // Campos de asignación
    bodegueroAsignadoId?: string | null
    bodegueroId?: string | null // alias para compatibilidad
    // Campos enriquecidos
    pedido?: PedidoInfo
    bodegueroAsignado?: BodegueroInfo
    bodegueroNombre?: string | null // alias para compatibilidad
    items?: PickingItem[]
}

export type CreatePickingPayload = {
    pedidoId: string
    items: Array<{ productoId: string; cantidadSolicitada: number }>
}

const warehouse = (path: string) => `${env.api.warehouseUrl}${path}`

export type PickingListOptions = {
    all?: boolean
}

// Helper para normalizar el picking con compatibilidad hacia atrás
const normalizePicking = (p: Picking): Picking => ({
    ...p,
    // Asegurar que bodegueroId y bodegueroNombre estén disponibles
    bodegueroId: p.bodegueroId || p.bodegueroAsignadoId,
    bodegueroNombre: p.bodegueroNombre || p.bodegueroAsignado?.nombreCompleto,
})

export const PickingService = {
    async list(estado?: string, options?: PickingListOptions): Promise<Picking[]> {
        try {
            const queryParts: string[] = []
            if (estado) queryParts.push(`estado=${encodeURIComponent(estado)}`)
            if (options?.all) queryParts.push('all=1')
            const qs = queryParts.length ? `?${queryParts.join('&')}` : ''
            const result = await apiRequest<Picking[]>(warehouse(endpoints.warehouse.picking + qs))
            return result.map(normalizePicking)
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.list', { estado, options })
            throw error
        }
    },

    async listMine(): Promise<Picking[]> {
        try {
            const result = await apiRequest<Picking[]>(warehouse(endpoints.warehouse.pickingMis))
            return result.map(normalizePicking)
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.listMine')
            throw error
        }
    },

    async getById(id: string): Promise<Picking> {
        try {
            const result = await apiRequest<Picking>(warehouse(endpoints.warehouse.pickingById(id)))
            return normalizePicking(result)
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.getById', { id })
            throw error
        }
    },

    async create(payload: CreatePickingPayload): Promise<Picking> {
        try {
            const result = await apiRequest<Picking>(warehouse(endpoints.warehouse.picking), {
                method: 'POST',
                body: JSON.stringify(payload),
            })
            return normalizePicking(result)
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.create', { payload })
            throw error
        }
    },

    async assign(id: string, bodegueroId: string): Promise<Picking> {
        try {
            const result = await apiRequest<Picking>(warehouse(endpoints.warehouse.pickingAssign(id)), {
                method: 'PUT',
                body: JSON.stringify({ bodegueroId }),
            })
            return normalizePicking(result)
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.assign', { id, bodegueroId })
            throw error
        }
    },

    async take(id: string): Promise<Picking> {
        try {
            const result = await apiRequest<Picking>(warehouse(endpoints.warehouse.pickingTomar(id)), {
                method: 'POST',
            })
            return normalizePicking(result)
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.take', { id })
            throw error
        }
    },

    async confirmReservation(pedidoId: string | null, reservationId: string): Promise<Picking> {
        try {
            const result = await apiRequest<Picking>(warehouse(endpoints.warehouse.pickingConfirm), {
                method: 'POST',
                body: JSON.stringify({ pedidoId, reservation_id: reservationId }),
            })
            return normalizePicking(result)
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.confirmReservation', { pedidoId, reservationId })
            throw error
        }
    },

    async start(id: string): Promise<Picking> {
        try {
            const result = await apiRequest<Picking>(warehouse(endpoints.warehouse.pickingStart(id)), { method: 'POST' })
            return normalizePicking(result)
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.start', { id })
            throw error
        }
    },

    async complete(id: string, observaciones?: string): Promise<Picking> {
        try {
            const result = await apiRequest<Picking>(warehouse(endpoints.warehouse.pickingComplete(id)), {
                method: 'POST',
                body: JSON.stringify({ observacionesBodega: observaciones }),
            })
            return normalizePicking(result)
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.complete', { id, observaciones })
            throw error
        }
    },

    async pickItem(
        id: string,
        itemId: string,
        cantidadPickeada: number,
        options?: {
            loteConfirmado?: string
            motivoDesviacion?: string
            notasBodeguero?: string
            ubicacionConfirmada?: string
        }
    ): Promise<PickingItem> {
        try {
            // Backend espera campos en snake_case
            const payload: Record<string, unknown> = { cantidadPickeada }
            if (options?.loteConfirmado) payload.loteConfirmado = options.loteConfirmado
            if (options?.motivoDesviacion) payload.motivo_desviacion = options.motivoDesviacion
            if (options?.notasBodeguero) payload.nota_bodeguero = options.notasBodeguero
            if (options?.ubicacionConfirmada) payload.ubicacion_confirmada = options.ubicacionConfirmada

            return await apiRequest<PickingItem>(warehouse(endpoints.warehouse.pickingPickItem(id, itemId)), {
                method: 'POST',
                body: JSON.stringify(payload),
            })
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.pickItem', { id, itemId, cantidadPickeada, ...options })
            throw error
        }
    },

    /**
     * Obtiene stocks alternativos para un producto (otros lotes/ubicaciones disponibles)
     */
    async getAlternativeStocks(productoId: string): Promise<AlternativeStock[]> {
        try {
            return await apiRequest<AlternativeStock[]>(warehouse(endpoints.warehouse.picking + `/products/${productoId}/stocks`))
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.getAlternativeStocks', { productoId })
            throw error
        }
    },
}
