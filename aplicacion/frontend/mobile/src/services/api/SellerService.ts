import { RouteService, type ScheduledVisit } from './RouteService'

/**
 * SellerService - Servicio para funcionalidades específicas del Vendedor
 *
 * Maneja operaciones relacionadas con el dashboard y actividades del vendedor:
 * - KPIs del día (pedidos, clientes, facturas vencidas)
 * - Alertas críticas (pedidos rechazados, clientes bloqueados)
 *
 * NOTA: Las funcionalidades de rutero ahora están centralizadas en RouteService
 */

export interface SellerKPIs {
    todayOrders: number
    activeClients: number
    overdueInvoices: number
}

export interface SellerAlert {
    id: string
    type: 'order_rejected' | 'credit_blocked'
    message: string
    clientName: string
}

// Re-exportar tipos de RouteService para mantener compatibilidad
export type { ScheduledVisit }

export const SellerService = {
    /**
     * Obtiene los KPIs del dashboard del vendedor
     * TODO: Conectar con endpoints reales de estadísticas
     */
    async getDashboardKPIs(): Promise<SellerKPIs> {
        // TODO: Implementar llamada real al backend
        return {
            todayOrders: 0,
            activeClients: 0,
            overdueInvoices: 0
        }
    },

    /**
     * Obtiene las visitas programadas para hoy
     * Delega a RouteService para mantener la lógica centralizada
     */
    async getScheduledVisits(): Promise<ScheduledVisit[]> {
        return RouteService.getTodayVisits()
    },

    /**
     * Obtiene las alertas críticas del vendedor
     * TODO: Conectar con endpoints reales de alertas
     */
    async getAlerts(): Promise<SellerAlert[]> {
        // TODO: Implementar llamada real al backend
        return []
    }
}
