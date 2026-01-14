import { UserService } from '../../../services/api/UserService'
import { SupervisorService, type KPI, type Alert } from '../../../services/api/SupervisorService'
import { BRAND_COLORS } from '../../../shared/types'

// Adapter to aggregate real and mock data for the dashboard
export const DashboardAdapter = {
    getKPIs: async (): Promise<KPI[]> => {
        try {
            // 1. Get real team count
            const vendors = await UserService.getVendors()
            const activeVendors = vendors.filter(v => v.active).length

            // 2. Mock Sales/Orders (Pending Backend Implementation)
            // TODO: Backend: Need endpoints for sales stats and pending orders
            // Setting to 0 to avoid "burned" false data for the user.
            const pendingOrders = 0
            const dailySales = 0.00

            return [
                {
                    label: 'Ventas de Hoy',
                    value: `$${dailySales}`,
                    color: '#10B981',
                    icon: 'cash-outline'
                },
                {
                    label: 'Pedidos Pendientes',
                    value: pendingOrders,
                    color: '#F59E0B',
                    icon: 'time-outline'
                },
                {
                    label: 'Equipo Activo',
                    value: activeVendors, // Real Data
                    color: '#3B82F6',
                    icon: 'people-outline'
                }
            ]
        } catch (error) {
            console.error('Error fetching dashboard KPIs', error)
            return []
        }
    },

    getAlerts: async (): Promise<Alert[]> => {
        // TODO: Connect to backend alerts endpoint
        return []
    }
}
