import { Order, OrderStatus, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../services/api/OrderService'
import { Picking } from '../services/api/PickingService'

/**
 * Estados visuales del pedido (incluye estado inferido "EN_PREPARACION")
 */
export type DisplayOrderStatus = OrderStatus | 'EN_PREPARACION'

/**
 * Información completa del estado visual del pedido
 */
export interface OrderDisplayInfo {
    /** Estado a mostrar (puede ser inferido) */
    status: DisplayOrderStatus
    /** Etiqueta corta para badges */
    label: string
    /** Descripción detallada para tooltips */
    description: string
    /** Color principal del estado */
    color: string
    /** Color de fondo (más claro) */
    backgroundColor: string
    /** Ícono de Ionicons apropiado */
    icon: 'time-outline' | 'checkmark-circle-outline' | 'cube-outline' | 'sync-outline' |
    'checkmark-done-circle-outline' | 'car-outline' | 'close-circle-outline' | 'ban-outline' | 'receipt-outline'
}

/**
 * Obtiene la información de estado visual del pedido considerando el picking
 * 
 * @param order - Pedido a evaluar
 * @param picking - Picking asociado (opcional)
 * @returns Información completa del estado visual
 */
export function getOrderDisplayStatus(
    order: Order,
    picking?: Picking | null
): OrderDisplayInfo {
    const baseStatus = order.estado_actual

    // PENDIENTE - Esperando aprobación del supervisor
    if (baseStatus === 'PENDIENTE') {
        return {
            status: 'PENDIENTE',
            label: 'Pendiente',
            description: 'Pedido esperando aprobación del supervisor',
            color: '#F59E0B',
            backgroundColor: '#FEF3C7',
            icon: 'time-outline'
        }
    }

    // APROBADO - Analizar estado del picking
    if (baseStatus === 'APROBADO') {
        if (!picking) {
            // Aprobado pero sin picking aún (transición)
            return {
                status: 'APROBADO',
                label: 'Aprobado',
                description: 'Pedido aprobado, creando orden de picking...',
                color: '#3B82F6',
                backgroundColor: '#DBEAFE',
                icon: 'checkmark-circle-outline'
            }
        }

        if (picking.estado === 'PENDIENTE') {
            // Picking creado pero no tomado por bodeguero
            return {
                status: 'APROBADO',
                label: 'Esperando Bodega',
                description: 'Pedido aprobado, esperando que bodega tome la orden',
                color: '#3B82F6',
                backgroundColor: '#DBEAFE',
                icon: 'checkmark-circle-outline'
            }
        }

        if (picking.estado === 'ASIGNADO' || picking.estado === 'EN_PROCESO') {
            // Estado visual "EN_PREPARACION" - Bodeguero trabajando
            return {
                status: 'EN_PREPARACION',
                label: 'En Preparación',
                description: picking.estado === 'EN_PROCESO'
                    ? 'Bodeguero está preparando el pedido'
                    : 'Pedido asignado a bodeguero',
                color: '#8B5CF6',
                backgroundColor: '#EDE9FE',
                icon: 'sync-outline'
            }
        }

        if (picking.estado === 'COMPLETADO') {
            // Picking completado pero pedido aún no actualizado (transición)
            return {
                status: 'EN_PREPARACION',
                label: 'Preparado',
                description: 'Picking completado, sincronizando estado...',
                color: '#10B981',
                backgroundColor: '#D1FAE5',
                icon: 'cube-outline'
            }
        }
    }

    // PREPARADO - Picking completado y pedido actualizado
    if (baseStatus === 'PREPARADO') {
        return {
            status: 'PREPARADO',
            label: 'Preparado',
            description: 'Pedido preparado, listo para despacho',
            color: '#10B981',
            backgroundColor: '#D1FAE5',
            icon: 'cube-outline'
        }
    }

    // EN_RUTA - En camino al cliente
    if (baseStatus === 'EN_RUTA') {
        return {
            status: 'EN_RUTA',
            label: 'En Camino',
            description: 'Pedido en ruta hacia el cliente',
            color: '#6366F1',
            backgroundColor: '#E0E7FF',
            icon: 'car-outline'
        }
    }

    // ENTREGADO - Completado exitosamente
    if (baseStatus === 'ENTREGADO') {
        return {
            status: 'ENTREGADO',
            label: 'Entregado',
            description: 'Pedido entregado exitosamente',
            color: '#10B981',
            backgroundColor: '#D1FAE5',
            icon: 'checkmark-done-circle-outline'
        }
    }

    // FACTURADO
    if (baseStatus === 'FACTURADO') {
        return {
            status: 'FACTURADO',
            label: 'Facturado',
            description: 'Pedido facturado',
            color: '#06B6D4',
            backgroundColor: '#CFFAFE',
            icon: 'receipt-outline'
        }
    }

    // RECHAZADO
    if (baseStatus === 'RECHAZADO') {
        return {
            status: 'RECHAZADO',
            label: 'Rechazado',
            description: 'Pedido rechazado por supervisor',
            color: '#EF4444',
            backgroundColor: '#FEE2E2',
            icon: 'close-circle-outline'
        }
    }

    // ANULADO
    if (baseStatus === 'ANULADO') {
        return {
            status: 'ANULADO',
            label: 'Anulado',
            description: 'Pedido anulado',
            color: '#6B7280',
            backgroundColor: '#F3F4F6',
            icon: 'ban-outline'
        }
    }

    // Fallback - Estado desconocido
    return {
        status: baseStatus,
        label: ORDER_STATUS_LABELS[baseStatus] || baseStatus,
        description: `Estado: ${baseStatus}`,
        color: ORDER_STATUS_COLORS[baseStatus] || '#6B7280',
        backgroundColor: '#F3F4F6',
        icon: 'time-outline'
    }
}

/**
 * Valida si una transición de estado es permitida
 * 
 * @param currentStatus - Estado actual del pedido
 * @param targetStatus - Estado destino
 * @returns true si la transición es válida
 */
export function canChangeStatus(
    currentStatus: OrderStatus,
    targetStatus: OrderStatus
): boolean {
    // Definir transiciones permitidas
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
        'PENDIENTE': ['APROBADO', 'RECHAZADO', 'ANULADO'],
        'APROBADO': ['RECHAZADO', 'ANULADO', 'PREPARADO'], // PREPARADO se establece automáticamente
        'EN_PREPARACION': [], // Este es un estado visual, no se puede establecer manualmente
        'PREPARADO': ['EN_RUTA', 'ANULADO'],
        'FACTURADO': ['EN_RUTA', 'ANULADO'],
        'EN_RUTA': ['ENTREGADO', 'ANULADO'],
        'ENTREGADO': [], // Estado final
        'RECHAZADO': ['PENDIENTE'], // Posible reversión
        'ANULADO': [] // Estado final
    }

    const allowed = allowedTransitions[currentStatus] || []
    return allowed.includes(targetStatus)
}

/**
 * Obtiene los estados posibles para cambiar según el rol del usuario
 * 
 * @param order - Pedido actual
 * @param userRole - Rol del usuario
 * @returns Array de estados permitidos
 */
export function getNextPossibleStatuses(
    order: Order,
    userRole: 'supervisor' | 'bodeguero' | 'transportista' | 'admin'
): OrderStatus[] {
    const currentStatus = order.estado_actual

    // Supervisor - Solo puede aprobar o rechazar
    if (userRole === 'supervisor') {
        if (currentStatus === 'PENDIENTE') {
            return ['APROBADO', 'RECHAZADO']
        }
        if (currentStatus === 'APROBADO' || currentStatus === 'EN_PREPARACION') {
            return ['RECHAZADO', 'ANULADO']
        }
        return []
    }

    // Bodeguero - No cambia estados de pedido directamente (usa picking)
    if (userRole === 'bodeguero') {
        return []
    }

    // Transportista - Puede marcar en ruta o entregado
    if (userRole === 'transportista') {
        if (currentStatus === 'PREPARADO' || currentStatus === 'FACTURADO') {
            return ['EN_RUTA']
        }
        if (currentStatus === 'EN_RUTA') {
            return ['ENTREGADO']
        }
        return []
    }

    // Admin - Todos los estados (con validación)
    if (userRole === 'admin') {
        const allStatuses: OrderStatus[] = [
            'PENDIENTE', 'APROBADO', 'PREPARADO', 'FACTURADO',
            'EN_RUTA', 'ENTREGADO', 'RECHAZADO', 'ANULADO'
        ]
        return allStatuses.filter(status =>
            status !== currentStatus && canChangeStatus(currentStatus, status)
        )
    }

    return []
}

/**
 * Calcula el progreso del picking (0-100)
 * 
 * @param picking - Picking a evaluar
 * @returns Porcentaje de progreso (0-100)
 */
export function getPickingProgress(picking: Picking | null | undefined): number {
    if (!picking || !picking.items || picking.items.length === 0) {
        return 0
    }

    const total = picking.items.reduce((acc, item) => acc + (item.cantidadSolicitada || 0), 0)
    const picked = picking.items.reduce((acc, item) => acc + (item.cantidadPickeada || 0), 0)

    return total > 0 ? Math.round((picked / total) * 100) : 0
}

/**
 * Verifica si todos los items del picking están completados
 */
export function isPickingComplete(picking: Picking | null | undefined): boolean {
    if (!picking || !picking.items || picking.items.length === 0) {
        return false
    }

    return picking.items.every(item => item.estadoLinea === 'COMPLETADO')
}
