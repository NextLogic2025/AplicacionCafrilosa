/**
 * TransportistaService
 *
 * Service for handling all Transportista (driver/delivery person) related API calls.
 * Manages deliveries, routes, alerts, and KPI data.
 *
 * TODO: Replace mock data with actual API endpoints once backend is connected
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
 * Notification object for Transportista
 */
export interface Notification {
    id: string
    title: string
    message: string
    date: string
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

/**
 * Route information for deliveries
 */
export interface Route {
    id: string
    name: string
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
    reason: string
    status: 'pending' | 'in_process' | 'completed'
    date: string
}

/**
 * TransportistaService - API methods for Transportista role
 */
export const TransportistaService = {
    /**
     * Get all orders assigned to the driver
     *
     * @returns Promise<Order[]>
     */
    async getOrders(): Promise<Order[]> {
        // TODO: Replace with actual API call
        // return api.get('/transportista/orders')
        await delay(500)
        return [
            {
                id: 'ORD-12345',
                clientName: 'Tienda La Esquina',
                date: '2023-10-27',
                status: 'shipped',
                total: 150.00,
                itemsCount: 15,
                priority: 'normal'
            },
            {
                id: 'ORD-12348',
                clientName: 'Supermercado El Ahorro',
                date: '2023-10-27',
                status: 'shipped',
                total: 420.50,
                itemsCount: 42,
                priority: 'alta'
            }
        ]
    },

    /**
     * Get dashboard KPIs for Transportista
     *
     * @returns Promise<TransportistaKPIs>
     */
    async getDashboardKPIs(): Promise<TransportistaKPIs> {
        // TODO: Replace with actual API call
        // return api.get('/transportista/dashboard/kpis')
        await delay(500)
        return {
            assignedOrders: 6,
            pendingDeliveries: 4,
            deliveredToday: 2
        }
    },

    /**
     * Get the next delivery to complete
     *
     * @returns Promise<Delivery | null>
     */
    async getNextDelivery(): Promise<Delivery | null> {
        // TODO: Replace with actual API call
        // return api.get('/transportista/next-delivery')
        await delay(300)
        return {
            id: 'DEL-001',
            orderId: 'ORD-12345',
            clientName: 'Tienda La Esquina',
            address: 'Av. Principal 123, Centro',
            status: 'pending',
            estimatedTime: '10:30',
            itemsCount: 15
        }
    },

    /**
     * Get all deliveries for the driver
     *
     * @returns Promise<Delivery[]>
     */
    async getDeliveries(): Promise<Delivery[]> {
        // TODO: Replace with actual API call
        // return api.get('/transportista/deliveries')
        await delay(600)
        return [
            {
                id: 'DEL-001',
                orderId: 'ORD-12345',
                clientName: 'Tienda La Esquina',
                address: 'Av. Principal 123, Centro',
                status: 'pending',
                estimatedTime: '10:30',
                itemsCount: 15
            },
            {
                id: 'DEL-002',
                orderId: 'ORD-12348',
                clientName: 'Supermercado El Ahorro',
                address: 'Calle 5ta y 10ma, Norte',
                status: 'in_transit',
                estimatedTime: '11:15',
                itemsCount: 42
            },
            {
                id: 'DEL-003',
                orderId: 'ORD-12350',
                clientName: 'Bodega Central',
                address: 'Zona Industrial Lote 5',
                status: 'delivered',
                estimatedTime: '09:00',
                itemsCount: 120
            }
        ]
    },

    /**
     * Get all notifications for the driver
     *
     * @returns Promise<Notification[]>
     */
    async getNotifications(): Promise<Notification[]> {
        // TODO: Replace with actual API call
        // return api.get('/transportista/notifications')
        await delay(500)
        return [
            {
                id: '1',
                title: 'Nueva Ruta',
                message: 'Se te ha asignado la Ruta Norte',
                date: 'Hace 1h',
                read: false
            },
            {
                id: '2',
                title: 'Cambio de Pedido',
                message: 'Pedido #123 Cancelado',
                date: 'Hace 2h',
                read: true
            }
        ]
    },

    /**
     * Get all alerts for the driver
     *
     * @returns Promise<TransportistaAlert[]>
     */
    async getAlerts(): Promise<TransportistaAlert[]> {
        // TODO: Replace with actual API call
        // return api.get('/transportista/alerts')
        await delay(400)
        return [
            {
                id: '1',
                type: 'order_ready',
                message: 'Pedido #12399 listo para retiro',
                date: 'Hace 10 min'
            },
            {
                id: '2',
                type: 'route_changed',
                message: 'Ruta #5 reasignada por tráfico',
                date: 'Hace 25 min'
            }
        ]
    },

    /**
     * Get assigned routes for the driver
     *
     * @returns Promise<Route[]>
     */
    async getRoutes(): Promise<Route[]> {
        // TODO: Replace with actual API call
        // return api.get('/transportista/routes')
        await delay(600)
        return [
            {
                id: 'RUT-001',
                name: 'Ruta Centro',
                startTime: '08:00',
                estimatedEndTime: '14:30',
                deliveries: [],
                distance: 45.2,
                estimatedDuration: 390
            },
            {
                id: 'RUT-002',
                name: 'Ruta Norte',
                startTime: '15:00',
                estimatedEndTime: '18:00',
                deliveries: [],
                distance: 32.5,
                estimatedDuration: 180
            }
        ]
    },

    /**
     * Get route history
     *
     * @returns Promise<Route[]>
     */
    async getRouteHistory(): Promise<Route[]> {
        // TODO: Replace with actual API call
        // return api.get('/transportista/routes/history')
        await delay(700)
        return [
            {
                id: 'HIST-001',
                name: 'Ruta Centro - 2023-10-26',
                startTime: '08:00',
                estimatedEndTime: '14:30',
                deliveries: [],
                distance: 45.2,
                estimatedDuration: 390
            },
            {
                id: 'HIST-002',
                name: 'Ruta Norte - 2023-10-26',
                startTime: '15:00',
                estimatedEndTime: '18:15',
                deliveries: [],
                distance: 32.5,
                estimatedDuration: 195
            }
        ]
    },

    /**
     * Get return/devolution requests
     *
     * @returns Promise<Return[]>
     */
    async getReturns(): Promise<Return[]> {
        // TODO: Replace with actual API call
        // return api.get('/transportista/returns')
        await delay(500)
        return [
            {
                id: 'RET-001',
                orderId: 'ORD-12340',
                reason: 'Producto defectuoso',
                status: 'pending',
                date: '2023-10-27'
            },
            {
                id: 'RET-002',
                orderId: 'ORD-12339',
                reason: 'Cliente no disponible',
                status: 'in_process',
                date: '2023-10-27'
            }
        ]
    },

    /**
     * Confirm a delivery
     *
     * @param deliveryId - ID of the delivery to confirm
     * @param signature - Signature data (base64 or URL)
     * @param timestamp - Delivery confirmation timestamp
     * @returns Promise<void>
     */
    async confirmDelivery(
        deliveryId: string,
        signature?: string,
        timestamp?: number
    ): Promise<void> {
        // TODO: Replace with actual API call
        // return api.post(`/transportista/deliveries/${deliveryId}/confirm`, {
        //     signature,
        //     timestamp
        // })
        await delay(300)
        console.log(`Delivery ${deliveryId} confirmed`)
    },

    /**
     * Mark delivery as failed
     *
     * @param deliveryId - ID of the delivery
     * @param reason - Reason for failure
     * @returns Promise<void>
     */
    async failDelivery(deliveryId: string, reason: string): Promise<void> {
        // TODO: Replace with actual API call
        // return api.post(`/transportista/deliveries/${deliveryId}/fail`, {
        //     reason
        // })
        await delay(300)
        console.log(`Delivery ${deliveryId} marked as failed: ${reason}`)
    },

    /**
     * Update delivery location
     *
     * @param deliveryId - ID of the delivery
     * @param latitude - Current latitude
     * @param longitude - Current longitude
     * @returns Promise<void>
     */
    async updateLocation(
        deliveryId: string,
        latitude: number,
        longitude: number
    ): Promise<void> {
        // TODO: Replace with actual API call
        // return api.post(`/transportista/deliveries/${deliveryId}/location`, {
        //     latitude,
        //     longitude
        // })
        await delay(100)
        console.log(
            `Location updated for delivery ${deliveryId}: ${latitude}, ${longitude}`
        )
    }
}
