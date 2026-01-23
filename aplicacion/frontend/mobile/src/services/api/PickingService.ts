import { ApiService } from './ApiService'
import { env } from '../../config/env'
import { endpoints } from './endpoints'
import { createService } from './createService'

export type PickingEstado = 'PENDIENTE' | 'ASIGNADO' | 'EN_PROCESO' | 'COMPLETADO' | string
export type PickingItemEstado = 'PENDIENTE' | 'PARCIAL' | 'COMPLETADO' | string

export type UbicacionSugerida = {
    id: string
    codigoVisual?: string
    nombre?: string
}

export type LoteSugerido = {
    id: string
    numeroLote?: string
    fechaVencimiento?: string
}

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
    nombreProducto?: string
    sku?: string
    ubicacionSugerida?: UbicacionSugerida
    loteInfo?: LoteSugerido
    cantidadDisponible?: number
    cantidadReservada?: number
}

export type PedidoInfo = {
    numero?: string | number
    clienteNombre?: string
    referenciaComercial?: string
}

export type BodegueroInfo = {
    id: string
    nombreCompleto?: string
}

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

export const MOTIVOS_DESVIACION = [
    { value: 'FALTANTE', label: 'Faltante (No hay stock físico)' },
    { value: 'DANADO', label: 'Producto Dañado' },
    { value: 'VENCIDO', label: 'Producto Vencido' },
    { value: 'ERROR_INVENTARIO', label: 'Error de Inventario' },
    { value: 'OTRO', label: 'Otro' },
] as const

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
    bodegueroAsignadoId?: string | null
    bodegueroId?: string | null
    pedido?: PedidoInfo
    bodegueroAsignado?: BodegueroInfo
    bodegueroNombre?: string | null
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

const normalizePicking = (p: Picking): Picking => ({
    ...p,
    bodegueroId: p.bodegueroId || p.bodegueroAsignadoId,
    bodegueroNombre: p.bodegueroNombre || p.bodegueroAsignado?.nombreCompleto,
})

const rawService = {
    async list(estado?: string, options?: PickingListOptions): Promise<Picking[]> {
        const queryParts: string[] = []
        if (estado) queryParts.push(`estado=${encodeURIComponent(estado)}`)
        if (options?.all) queryParts.push('all=1')
        const qs = queryParts.length ? `?${queryParts.join('&')}` : ''
        const result = await ApiService.get<Picking[]>(warehouse(endpoints.warehouse.picking + qs))
        return result.map(normalizePicking)
    },

    async listMine(): Promise<Picking[]> {
        const result = await ApiService.get<Picking[]>(warehouse(endpoints.warehouse.pickingMis))
        return result.map(normalizePicking)
    },

    async getById(id: string): Promise<Picking> {
        const result = await ApiService.get<Picking>(warehouse(endpoints.warehouse.pickingById(id)))
        return normalizePicking(result)
    },

    async create(payload: CreatePickingPayload): Promise<Picking> {
        const result = await ApiService.post<Picking>(warehouse(endpoints.warehouse.picking), payload)
        return normalizePicking(result)
    },

    async assign(id: string, bodegueroId: string): Promise<Picking> {
        const result = await ApiService.put<Picking>(warehouse(endpoints.warehouse.pickingAssign(id)), {
            bodegueroId
        })
        return normalizePicking(result)
    },

    async take(id: string): Promise<Picking> {
        const result = await ApiService.post<Picking>(warehouse(endpoints.warehouse.pickingTomar(id)), undefined)
        return normalizePicking(result)
    },

    async confirmReservation(pedidoId: string | null, reservationId: string): Promise<Picking> {
        const result = await ApiService.post<Picking>(warehouse(endpoints.warehouse.pickingConfirm), {
            pedidoId,
            reservation_id: reservationId
        })
        return normalizePicking(result)
    },

    async start(id: string): Promise<Picking> {
        const result = await ApiService.post<Picking>(warehouse(endpoints.warehouse.pickingStart(id)), undefined)
        return normalizePicking(result)
    },

    async complete(id: string, observaciones?: string): Promise<Picking> {
        const result = await ApiService.post<Picking>(warehouse(endpoints.warehouse.pickingComplete(id)), {
            observacionesBodega: observaciones
        })
        return normalizePicking(result)
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
        const payload: Record<string, unknown> = { cantidadPickeada }
        if (options?.loteConfirmado) payload.loteConfirmado = options.loteConfirmado
        if (options?.motivoDesviacion) payload.motivo_desviacion = options.motivoDesviacion
        if (options?.notasBodeguero) payload.nota_bodeguero = options.notasBodeguero
        if (options?.ubicacionConfirmada) payload.ubicacion_confirmada = options.ubicacionConfirmada

        return ApiService.post<PickingItem>(warehouse(endpoints.warehouse.pickingPickItem(id, itemId)), payload)
    },

    async getAlternativeStocks(productoId: string): Promise<AlternativeStock[]> {
        return ApiService.get<AlternativeStock[]>(warehouse(endpoints.warehouse.picking + `/products/${productoId}/stocks`))
    }
}

export const PickingService = createService('PickingService', rawService)
