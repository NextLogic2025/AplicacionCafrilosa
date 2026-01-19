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

export const SupervisorService = {
    getDashboardKPIs: async (): Promise<KPI[]> => {
        return []
    },

    getDashboardAlerts: async (): Promise<Alert[]> => {
        return []
    },

    getOrders: async (): Promise<SupervisorOrder[]> => {
        return []
    },

    getDeliveries: async (): Promise<SupervisorDelivery[]> => {
        return []
    },

    getTeamMembers: async (): Promise<SupervisorTeamMember[]> => {
        return []
    },

    getClients: async (): Promise<SupervisorClient[]> => {
        return []
    },

    getWarehouseData: async (): Promise<SupervisorWarehouseData> => {
        return {
            pendingOrders: [],
            prepTimes: [],
            stockRejections: []
        }
    },

    getReturns: async (): Promise<SupervisorReturn[]> => {
        return []
    },

    getReports: async (): Promise<SupervisorReport[]> => {
        return []
    },

    getAllAlerts: async (): Promise<Alert[]> => {
        return []
    }
}
