import { Platform } from 'react-native'
import { getValidToken } from '../auth/authClient'
import { env } from '../../config/env'

export interface KPI {
    label: string
    value: number | string
    color: string
    icon: string
}

export interface Alert {
    id: string
    type: 'critical' | 'warning' | 'info'
    message: string
    timestamp: string
}

// export interface SupervisorProfile removed - use UserService.UserProfile

export interface SupervisorOrder {
    id: string
    clientName: string
    createdBy: string
    status: 'pending_validation' | 'billing' | 'in_route' | 'delivered' | 'rejected'
    date: string
    total: number
    timeline: {
        created: string
        validated?: string
        billed?: string
        inRoute?: string
        delivered?: string
    }
    observations: {
        role: string
        note: string
        date: string
    }[]
}

export interface SupervisorDelivery {
    id: string
    transportistaName: string
    status: 'in_route' | 'delivered' | 'failed'
    clientName: string
    address: string
    evidence?: {
        photoUrl?: string
        signatureUrl?: string
        notes?: string
    }
    date: string
}

export interface SupervisorTeamMember {
    id: string
    name: string
    role: 'Vendedor' | 'Transportista' | 'Bodeguero'
    status: 'active' | 'inactive' | 'on_route'
    metrics: {
        completed: number
        incidents: number
        compliance: number
    }
    lastActivity: string
}

export const SupervisorService = {
    getDashboardKPIs: async (): Promise<KPI[]> => {
        // TODO: Integrate with backend API
        return []
    },

    getDashboardAlerts: async (): Promise<Alert[]> => {
        // TODO: Integrate with backend API
        return []
    },

    // getProfile removed - use UserService.getProfile

    getOrders: async (): Promise<SupervisorOrder[]> => {
        // TODO: Integrate with backend API
        return []
    },

    getDeliveries: async (): Promise<SupervisorDelivery[]> => {
        // TODO: Integrate with backend API
        return []
    },

    getTeamMembers: async (): Promise<SupervisorTeamMember[]> => {
        // TODO: Integrate with backend API
        return []
    },

    // --- FAB Modules ---

    getClients: async (): Promise<SupervisorClient[]> => {
        // TODO: Integrate with backend API
        return []
    },

    getWarehouseData: async (): Promise<SupervisorWarehouseData> => {
        // TODO: Integrate with backend API
        return {
            pendingOrders: [],
            prepTimes: [],
            stockRejections: []
        }
    },

    getReturns: async (): Promise<SupervisorReturn[]> => {
        // TODO: Integrate with backend API
        return []
    },

    getReports: async (): Promise<SupervisorReport[]> => {
        // TODO: Integrate with backend API
        return []
    },

    // Explicit method for the full alerts screen if different from dashboard
    getAllAlerts: async (): Promise<Alert[]> => {
        // TODO: Integrate with backend API
        return []
    }
}

export interface SupervisorClient {
    id: string
    name: string
    address: string
    sellerName: string
    status: 'active' | 'blocked' | 'pending_validation'
}

export interface SupervisorWarehouseData {
    pendingOrders: { id: string; timeElapsed: string }[]
    prepTimes: { orderId: string; time: string }[]
    stockRejections: { productId: string; quantity: number }[]
}

export interface SupervisorReturn {
    id: string
    requestId: string
    clientName: string
    reason: string
    status: 'pending_approval' | 'approved' | 'rejected'
    amount: number
    date: string
}

export interface SupervisorReport {
    id: string
    title: string
    type: 'sales' | 'zone' | 'product'
    date: string
    url: string
}
