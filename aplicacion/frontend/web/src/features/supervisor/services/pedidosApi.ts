import { httpOrders } from '../../../services/api/http'

export interface DetallePedido {
    id: string
    pedido_id: string
    producto_id: string
    codigo_sku: string
    nombre_producto: string
    cantidad: string
    unidad_medida: string
    precio_lista: string
    precio_final: string
    es_bonificacion: boolean
    motivo_descuento: string | null
    campania_aplicada_id: number | null
    subtotal_linea: string
    created_at: string
    updated_at: string
}

export interface Pedido {
    id: string
    codigo_visual: number
    cliente_id: string
    vendedor_id: string
    sucursal_id: string | null
    estado_actual: 'PENDIENTE' | 'APROBADO' | 'EN_PREPARACION' | 'FACTURADO' | 'EN_RUTA' | 'ENTREGADO' | 'ANULADO'
    subtotal: string
    descuento_total: string
    impuestos_total: string
    total_final: string
    monto_pagado: string
    estado_pago: 'PENDIENTE' | 'PAGADO' | 'PARCIAL'
    condicion_pago: 'CONTADO' | 'CREDITO'
    fecha_entrega_solicitada: string | null
    origen_pedido: string
    ubicacion_pedido: string | null
    observaciones_entrega: string | null
    created_at: string
    updated_at: string
    deleted_at: string | null
    detalles?: DetallePedido[]
    // Campos adicionales que pueden venir del backend
    cliente?: {
        id: string
        razon_social: string
        identificacion: string
    }
    vendedor?: {
        id: string
        nombreCompleto?: string
        email: string
    }
}

export interface CambiarEstadoDto {
    status: 'PENDIENTE' | 'APROBADO' | 'EN_PREPARACION' | 'FACTURADO' | 'EN_RUTA' | 'ENTREGADO' | 'ANULADO'
}

/**
 * Obtiene todos los pedidos del sistema (solo para supervisores)
 */
export async function obtenerTodosPedidos(): Promise<Pedido[]> {
    return httpOrders<Pedido[]>('/orders')
}

/**
 * Obtiene un pedido específico por ID
 */
export async function obtenerPedidoPorId(id: string): Promise<Pedido> {
    return httpOrders<Pedido>(`/orders/${id}`)
}

/**
 * Cambia el estado de un pedido
 */
export async function cambiarEstadoPedido(id: string, status: CambiarEstadoDto['status']): Promise<Pedido> {
    return httpOrders<Pedido>(`/orders/${id}/status`, {
        method: 'PATCH',
        body: { status },
    })
}

/**
 * Obtiene el seguimiento/historial de un pedido
 */
export async function obtenerSeguimientoPedido(id: string): Promise<{
    orderId: string
    currentStatus: string
    lastUpdate: string
    timeline: Array<{
        status: string
        time: string
        message: string
    }>
}> {
    return httpOrders(`/orders/${id}/tracking`)
}
