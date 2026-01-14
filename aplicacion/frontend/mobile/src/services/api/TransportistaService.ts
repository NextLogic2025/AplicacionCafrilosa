/**
 * TransportistaService
 *
 * Service for handling all Transportista (driver/delivery person) related API calls.
 * Manages deliveries, routes, alerts, and KPI data.
 */

import { delay } from '../../utils/delay'
import { Order } from './OrderService'

/**
 * Key Performance Indicators for Transportista dashboard
 */
export interface TransportistaKPIs {
    assignedOrders: number
    pendingDeliveries: number
    deliveredToday: number
}

/**
 * Transportista Profile Data
 */
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

/**
 * Notification object for Transportista
 */
export interface Notification {
    id: string
    title: string
    message: string
    date: string
    type: 'order' | 'route' | 'system'
    read: boolean
}

/**
 * Delivery tracking information
 */
export interface Delivery {
    id: string
    orderId: string
    clientName: string
    address: string
    status: 'pending' | 'in_transit' | 'delivered' | 'failed'
    estimatedTime: string // HH:mm format
    itemsCount: number
    latitude?: number
    longitude?: number
    contact: string
    phone: string
    notes?: string
}

/**
 * Alert for important events
 */
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

/**
 * Route information for deliveries
 */
export interface Route {
    id: string
    name: string
    status: 'pending' | 'active' | 'completed'
    startTime: string
    estimatedEndTime: string
    deliveries: Delivery[]
    distance: number // km
    estimatedDuration: number // minutes
}

/**
 * Return/devolution request
 */
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

/**
 * TransportistaService - API methods for Transportista role
 */
export const TransportistaService = {
    /**
     * Get all orders assigned to the driver
     *
     * @returns Promise<TransportistaOrder[]>
     */
    async getOrders(): Promise<TransportistaOrder[]> {
        await delay(500)
        return []
    },

    /**
     * Get dashboard KPIs for Transportista
     *
     * @returns Promise<TransportistaKPIs>
     */
    async getDashboardKPIs(): Promise<TransportistaKPIs> {
        await delay(500)
        return {
            assignedOrders: 0,
            pendingDeliveries: 0,
            deliveredToday: 0
        }
    },

    /**
     * Get the next delivery to complete
     *
     * @returns Promise<Delivery | null>
     */
    async getNextDelivery(): Promise<Delivery | null> {
        await delay(300)
        return null
    },

    /**
     * Get all deliveries for the driver
     *
     * @returns Promise<Delivery[]>
     */
    async getDeliveries(): Promise<Delivery[]> {
        await delay(600)
        return []
    },

    /**
     * Get driver profile
     */
    async getProfile(): Promise<TransportistaProfile> {
        await delay(400)
        // Return basic/empty profile or fetch from user context in real app
        // For now, return generic or placeholders to avoid breaking typed UI
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

    /**
     * Get all notifications for the driver
     *
     * @returns Promise<Notification[]>
     */
    async getNotifications(): Promise<Notification[]> {
        await delay(500)
        return []
    },

    /**
     * Get all alerts for the driver
     *
     * @returns Promise<TransportistaAlert[]>
     */
    async getAlerts(): Promise<TransportistaAlert[]> {
        await delay(400)
        return []
    },

    /**
     * Get assigned routes for the driver
     *
     * @returns Promise<Route[]>
     */
    async getRoutes(): Promise<Route[]> {
        await delay(600)
        return []
    },

    /**
     * Get route history
     *
     * @returns Promise<Route[]>
     */
    async getRouteHistory(): Promise<Route[]> {
        await delay(700)
        return []
    },

    /**
     * Get return/devolution requests
     *
     * @returns Promise<Return[]>
     */
    async getReturns(): Promise<Return[]> {
        await delay(500)
        return []
    },

    /**
     * Confirm a delivery
     */
    async confirmDelivery(
        deliveryId: string,
        evidence: { photo?: string; signature?: string; notes?: string }
    ): Promise<void> {
        await delay(800)
        console.log(`Delivery ${deliveryId} confirmed with evidence`, evidence)
    },

    /**
     * Update order status (Pick up / In Transit)
     */
    async updateOrderStatus(orderId: string, status: 'shipped' | 'delivered'): Promise<void> {
        await delay(500)
        console.log(`Order ${orderId} status updated to ${status}`)
    }
}
