import { UserService } from '../../../services/api/UserService'
import { SupervisorService, type KPI, type Alert } from '../../../services/api/SupervisorService'
import { BRAND_COLORS } from '../../../shared/types'

export const DashboardAdapter = {
    getKPIs: async (): Promise<KPI[]> => {
        try {
            const vendors = await UserService.getVendors()
            const activeVendors = vendors.filter(v => v.active).length

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
                    value: activeVendors,
                    color: '#3B82F6',
                    icon: 'people-outline'
                }
            ]
        } catch {
            return []
        }
    },

    getAlerts: async (): Promise<Alert[]> => {
        return []
    }
}
