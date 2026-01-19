import { delay } from '../../utils/delay'

export interface ReturnRequest {
    id: string
    orderId?: string
    date: string
    status: 'pending' | 'approved' | 'rejected'
    total: number
    items: number
    reason: string
}

export const ReturnsService = {
    async getReturns(_page = 1): Promise<ReturnRequest[]> {
        await delay(500)
        return []
    },

    async createReturn(_orderId: string, _items: any[], _reason: string): Promise<boolean> {
        await delay(1000)
        return true
    },

    async processReturn(_returnId: string, _action: 'reintegrate' | 'discard', _notes?: string): Promise<boolean> {
        await delay(1000)
        return true
    }
}
