
import { apiRequest } from './client'
import { UserProfile } from './UserService'

export interface Allocation {
    id: number
    zona_id: number
    vendedor_usuario_id: string
    es_principal: boolean
    // Optional expanded info if backend joins
    vendedor?: UserProfile
    nombre_vendedor_cache?: string
    fecha_fin?: string | null
    deleted_at?: string | null
}

export interface AssignVendorPayload {
    zona_id: number
    vendedor_usuario_id: string
    es_principal?: boolean
    fecha_inicio?: string
    nombre_vendedor_cache?: string
}

export const AssignmentService = {
    getAssignmentsByZone: async (zoneId: number): Promise<Allocation[]> => {
        try {
            // BACKEND WORKAROUND: Endpoint /asignacion returns ALL records.
            const allAssignments = await AssignmentService.getAllAssignments()
            return allAssignments.filter(a => Number(a.zona_id) === Number(zoneId))
        } catch (error) {
            console.error('Error fetching assignments by zone:', error)
            return []
        }
    },

    getAllAssignments: async (): Promise<Allocation[]> => {
        try {
            return await apiRequest<Allocation[]>('/api/asignacion')
        } catch (error) {
            console.error('Error fetching all assignments:', error)
            return []
        }
    },


    assignVendor: async (data: AssignVendorPayload): Promise<{ success: boolean; message?: string }> => {
        try {
            const payload = {
                zona_id: Number(data.zona_id),
                vendedor_usuario_id: String(data.vendedor_usuario_id),
                es_principal: Boolean(data.es_principal ?? true),
                fecha_inicio: new Date().toISOString().split('T')[0],
                nombre_vendedor_cache: data.nombre_vendedor_cache || null
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
                es_principal: Boolean(data.es_principal ?? true),
                nombre_vendedor_cache: data.nombre_vendedor_cache || null
            }

            await apiRequest(`/api/asignacion/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            })
            return { success: true, message: 'Asignación actualizada correctamente' }
        } catch (error: any) {
            console.error('Error updating assignment:', error)
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
            console.error('Error removing assignment:', error)
            return { success: false, message: error.message || 'Error al eliminar asignación' }
        }
    }
}
