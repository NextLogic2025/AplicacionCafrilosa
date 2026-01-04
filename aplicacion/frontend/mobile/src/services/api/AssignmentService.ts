
import { apiRequest } from './client'
import { UserProfile } from './UserService'

export interface Allocation {
    id: number
    zona_id: number
    vendedor_usuario_id: string
    es_principal: boolean
    // Optional expanded info if backend joins
    vendedor?: UserProfile
}

export interface AssignVendorPayload {
    zona_id: number
    vendedor_usuario_id: string
    es_principal?: boolean
    fecha_inicio?: string
}

export const AssignmentService = {
    getAssignmentsByZone: async (zoneId: number): Promise<Allocation[]> => {
        try {
            // BACKEND WORKAROUND: Endpoint /asignacion returns ALL records (does not filter by query param).
            // We must filter client-side to find assignments for THIS zone.
            const allAssignments = await apiRequest<Allocation[]>('/api/asignacion')
            return allAssignments.filter(a => Number(a.zona_id) === Number(zoneId))
        } catch (error) {
            console.error('Error fetching assignments:', error)
            return []
        }
    },

    assignVendor: async (data: AssignVendorPayload): Promise<{ success: boolean; message?: string }> => {
        try {
            const payload = {
                zona_id: Number(data.zona_id),
                vendedor_usuario_id: String(data.vendedor_usuario_id),
                es_principal: Boolean(data.es_principal ?? true),
                // Optional: Provide start date if strictly required, but DB default is usually sufficient
                // fecha_inicio: new Date().toISOString().split('T')[0]
            }

            await apiRequest('/api/asignacion', {
                method: 'POST',
                body: JSON.stringify(payload)
            })
            return { success: true, message: 'Vendedor asignado exitosamente' }
        } catch (error: any) {
            console.error('Error assigning vendor:', error)
            return { success: false, message: error.message || 'Error al asignar vendedor' }
        }
    },

    updateAssignment: async (id: number, data: AssignVendorPayload): Promise<{ success: boolean; message?: string }> => {
        try {
            const payload = {
                zona_id: Number(data.zona_id),
                vendedor_usuario_id: String(data.vendedor_usuario_id),
                es_principal: Boolean(data.es_principal ?? true)
            }

            await apiRequest(`/api/asignacion/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            })
            return { success: true, message: 'Asignación actualizada correctamente' }
        } catch (error: any) {
            console.error('Error updating assignment:', error)
            // Fallback: If 405 Method Not Allowed, maybe try PATCH? 
            // But usually standard is PUT. We return false to handle it in UI.
            return { success: false, message: error.message || 'Error al actualizar asignación' }
        }
    },

    removeAssignment: async (id: number): Promise<{ success: boolean; message?: string }> => {
        try {
            await apiRequest(`/api/asignacion/${id}`, {
                method: 'DELETE'
            })
            return { success: true, message: 'Asignación eliminada correctamente' }
        } catch (error: any) {
            // We know backend restricts this to ADMIN, so this might fail for Supervisor unless specific backend rules change
            console.error('Error removing assignment:', error)
            return { success: false, message: error.message || 'Error al eliminar asignación' }
        }
    }
}
