import { UserService } from '../../../services/api/UserService'
import { SupervisorService, type KPI, type Alert } from '../../../services/api/SupervisorService'
import { BRAND_COLORS } from '../../../shared/types'

export const DashboardAdapter = {
    getKPIs: async (): Promise<KPI[]> => {
        try {
            const users = await UserService.getUsers()
            // Roles considerados parte del equipo activo: Vendedor, Transportista, Bodeguero, Supervisor
            const activeTeam = users.filter(u => {
                if (!u.active) return false
                const role = (u.role || '').toUpperCase()
                return ['VENDEDOR', 'TRANSPORTISTA', 'BODEGUERO', 'SUPERVISOR'].includes(role)
            }).length

            const pendingOrders = 0
            const dailySales = 0.00

            return [
                {
                    label: 'Ventas de Hoy',
                    value: `$${dailySales}`,
                    color: '#10B981',
                    icon: 'cash'
                },
                {
                    label: 'Pedidos\nPendientes',
                    value: pendingOrders,
                    color: '#F59E0B',
                    icon: 'time'
                },
                {
                    label: 'Equipo Activo',
                    value: activeTeam,
                    color: '#3B82F6',
                    icon: 'people'
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
