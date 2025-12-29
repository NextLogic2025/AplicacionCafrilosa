import { delay } from '../../utils/delay'

export interface OrderItem {
    id: string
    productId: string
    productName: string
    quantity: number
    price: number
    total: number
}

export interface Order {
    id: string
    date: string // ISO Date
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
    total: number
    itemsCount: number
    items?: OrderItem[]
    invoiceUrl?: string
    // Bodeguero & Vendedor specifics
    clientName?: string
    origin?: 'cliente' | 'vendedor'
    priority?: 'normal' | 'alta' | 'urgente'
    observations?: string

    // Timeline for detailed view
    timeline?: {
        status: string
        date: string
        description: string
        active: boolean
    }[]
}

// Mock Data removed. Using clean service for integration.

export const OrderService = {
    async getOrders(page = 1): Promise<Order[]> {
        await delay(800)
        return []
    },

    async getOrderById(id: string): Promise<Order | null> {
        await delay(500)
        return null
    },

    async createOrder(items: any[]): Promise<boolean> {
        await delay(1500)
        return true
    },

    async cancelOrder(id: string): Promise<boolean> {
        await delay(1000)
        return false
        // Logic to cancel order via API
        return false
    },

    async getTrackingInfo(orderId: string): Promise<any> {
        await delay(500)
        return null
    },

    // Warehouse Operations
    async confirmPicking(orderId: string): Promise<boolean> {
        await delay(1000)
        return true
    },

    async confirmDispatch(orderId: string, carrierId: string, guideNumber: string): Promise<boolean> {
        await delay(1000)
        return true
    }
}
