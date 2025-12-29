import { delay } from '../../utils/delay'

export interface Client {
    id: string
    name: string
    businessName: string
    ruc: string
    address: string
    phone: string
    zone: string
    category: 'A' | 'B' | 'C' // Commercial category
    status: 'active' | 'blocked' | 'pending_approval' // Prospects
    creditLimit: number
    creditUsed: number

    // Details for Seller
    outstandingBalance: number
    lastOrders?: {
        id: string
        date: string
        total: number
        status: string
    }[]
    paymentStatus?: 'up_to_date' | 'overdue' // Informativo
}

export const ClientService = {
    async getMyClients(search?: string): Promise<Client[]> {
        await delay(600)
        return [] // Backend ready
    },

    async getClientDetails(id: string): Promise<Client | null> {
        await delay(300)
        return null
    }
}
