import { RouteService, type ScheduledVisit } from './RouteService'

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

export type { ScheduledVisit }

export const SellerService = {
    async getDashboardKPIs(): Promise<SellerKPIs> {
        return {
            todayOrders: 0,
            activeClients: 0,
            overdueInvoices: 0
        }
    },

    async getScheduledVisits(): Promise<ScheduledVisit[]> {
        return RouteService.getTodayVisits()
    },

    async getAlerts(): Promise<SellerAlert[]> {
        return []
    }
}
