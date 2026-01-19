import { delay } from '../../utils/delay'

export interface WarehouseStats {
    pendingOrders: number
    preparingOrders: number
    readyOrders: number
    expiringLots: number
    criticalStock: number
}

export interface RecentActivity {
    id: string
    title: string
    timestamp: string
    type: 'approved' | 'rejected' | 'reception' | 'other'
}

export const WarehouseService = {
    async getDashboardStats(): Promise<WarehouseStats> {
        await delay(500)
        return {
            pendingOrders: 0,
            preparingOrders: 0,
            readyOrders: 0,
            expiringLots: 0,
            criticalStock: 0
        }
    },

    async getRecentActivity(): Promise<RecentActivity[]> {
        await delay(500)
        return []
    }
}
