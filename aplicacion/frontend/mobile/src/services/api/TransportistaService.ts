import { delay } from '../../utils/delay'
import { Order } from './OrderService'

export interface TransportistaKPIs {
    assignedOrders: number
    pendingDeliveries: number
    deliveredToday: number
}

export interface TransportistaProfile {
    id: string
    name: string
    email: string
    phone: string
    vehicle: string
    licensePlate: string
    assignedZone: string
    rating: number
    photoUrl?: string
}

export interface Notification {
    id: string
    title: string
    message: string
    date: string
    type: 'order' | 'route' | 'system'
    read: boolean
}

export interface Delivery {
    id: string
    orderId: string
    clientName: string
    address: string
    status: 'pending' | 'in_transit' | 'delivered' | 'failed'
    estimatedTime: string
    itemsCount: number
    latitude?: number
    longitude?: number
    contact: string
    phone: string
    notes?: string
}

export interface TransportistaAlert {
    id: string
    type: 'order_ready' | 'route_changed' | 'info'
    message: string
    date: string
}

export interface TransportistaOrder extends Order {
    address?: string
    observations?: string
    productSummary: string
}

export interface Route {
    id: string
    name: string
    status: 'pending' | 'active' | 'completed'
    startTime: string
    estimatedEndTime: string
    deliveries: Delivery[]
    distance: number
    estimatedDuration: number
}

export interface Return {
    id: string
    orderId: string
    clientName: string
    productName: string
    quantity: number
    reason: string
    status: 'pending' | 'collected' | 'returned_to_warehouse'
    date: string
}

export const TransportistaService = {
    async getOrders(): Promise<TransportistaOrder[]> {
        await delay(500)
        return []
    },

    async getDashboardKPIs(): Promise<TransportistaKPIs> {
        await delay(500)
        return {
            assignedOrders: 0,
            pendingDeliveries: 0,
            deliveredToday: 0
        }
    },

    async getNextDelivery(): Promise<Delivery | null> {
        await delay(300)
        return null
    },

    async getDeliveries(): Promise<Delivery[]> {
        await delay(600)
        return []
    },

    async getProfile(): Promise<TransportistaProfile> {
        await delay(400)
        return {
            id: '',
            name: 'Transportista',
            email: '',
            phone: '',
            vehicle: 'No asignado',
            licensePlate: '---',
            assignedZone: 'Sin zona',
            rating: 5.0,
            photoUrl: undefined
        }
    },

    async getNotifications(): Promise<Notification[]> {
        await delay(500)
        return []
    },

    async getAlerts(): Promise<TransportistaAlert[]> {
        await delay(400)
        return []
    },

    async getRoutes(): Promise<Route[]> {
        await delay(600)
        return []
    },

    async getRouteHistory(): Promise<Route[]> {
        await delay(700)
        return []
    },

    async getReturns(): Promise<Return[]> {
        await delay(500)
        return []
    },

    async confirmDelivery(_deliveryId: string, _evidence: { photo?: string; signature?: string; notes?: string }): Promise<void> {
        await delay(800)
    },

    async updateOrderStatus(_orderId: string, _status: 'shipped' | 'delivered'): Promise<void> {
        await delay(500)
    }
}
