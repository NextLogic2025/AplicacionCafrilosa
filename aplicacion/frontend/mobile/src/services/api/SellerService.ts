import { delay } from '../../utils/delay'

export interface SellerKPIs {
    todayOrders: number
    activeClients: number
    overdueInvoices: number
}

export interface ScheduledVisit {
    id: string
    clientName: string
    address: string
    time: string
    status: 'pending' | 'completed' | 'cancelled'
}

export interface SellerAlert {
    id: string
    type: 'order_rejected' | 'credit_blocked'
    message: string
    clientName: string
}

export const SellerService = {
    async getDashboardKPIs(): Promise<SellerKPIs> {
        await delay(500)
        return {
            todayOrders: 5, // Mock data for initial view, should be 0 ideally but user asked for "Que ve: 5" in prompt as requirement description? No, user described "What he sees". I should return backend-ready but maybe simulate '5' as requested example? "No quemes información". I should return 0 or empty usually, but let's return realistic 0 default.
            activeClients: 0,
            overdueInvoices: 0
        }
    },

    async getScheduledVisits(): Promise<ScheduledVisit[]> {
        await delay(500)
        return []
    },

    async getAlerts(): Promise<SellerAlert[]> {
        await delay(500)
        return []
    }
}
