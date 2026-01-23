import { ApiService } from './ApiService'
import { UserProfile } from './UserService'
import { endpoints } from './endpoints'
import { logErrorForDebugging } from '../../utils/errorMessages'
import { createService } from './createService'

export interface Allocation {
    id: number
    zona_id: number
    vendedor_usuario_id: string
    es_principal: boolean
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

const ASSIGNMENTS_ENDPOINT = endpoints.catalog.asignacion
const ASSIGNMENT_BY_ID = endpoints.catalog.asignacionById

const fetchAllAssignments = async (): Promise<Allocation[]> => {
    try {
        return await ApiService.get<Allocation[]>(ASSIGNMENTS_ENDPOINT)
    } catch (error) {
        logErrorForDebugging(error, 'AssignmentService.getAllAssignments')
        return []
    }
}

const buildPayload = (data: AssignVendorPayload, fallbackDate?: string) => ({
    zona_id: Number(data.zona_id),
    vendedor_usuario_id: String(data.vendedor_usuario_id),
    es_principal: Boolean(data.es_principal ?? true),
    nombre_vendedor_cache: data.nombre_vendedor_cache || null,
    ...(data.fecha_inicio || fallbackDate ? { fecha_inicio: data.fecha_inicio ?? fallbackDate } : {})
})

const rawService = {
    getAllAssignments: fetchAllAssignments,

    getAssignmentsByZone: async (zoneId: number): Promise<Allocation[]> => {
        try {
            const allAssignments = await fetchAllAssignments()
            return allAssignments.filter(a => Number(a.zona_id) === Number(zoneId))
        } catch (error) {
            logErrorForDebugging(error, 'AssignmentService.getAssignmentsByZone', { zoneId })
            return []
        }
    },

    assignVendor: async (data: AssignVendorPayload): Promise<{ success: boolean; message?: string }> => {
        try {
            await ApiService.post(ASSIGNMENTS_ENDPOINT, buildPayload(data, new Date().toISOString().split('T')[0]))
            return { success: true, message: 'Vendedor asignado exitosamente' }
        } catch (error: any) {
            logErrorForDebugging(error, 'AssignmentService.assignVendor', { data })
            return { success: false, message: error.message || 'Error al asignar vendedor' }
        }
    },

    updateAssignment: async (id: number, data: AssignVendorPayload): Promise<{ success: boolean; message?: string }> => {
        try {
            await ApiService.put(ASSIGNMENT_BY_ID(id), buildPayload(data))
            return { success: true, message: 'Asignación actualizada correctamente' }
        } catch (error: any) {
            logErrorForDebugging(error, 'AssignmentService.updateAssignment', { id, data })
            return { success: false, message: error.message || 'Error al actualizar asignación' }
        }
    },

    removeAssignment: async (id: number): Promise<{ success: boolean; message?: string }> => {
        try {
            await ApiService.delete(ASSIGNMENT_BY_ID(id))
            return { success: true, message: 'Asignación eliminada correctamente' }
        } catch (error: any) {
            logErrorForDebugging(error, 'AssignmentService.removeAssignment', { id })
            return { success: false, message: error.message || 'Error al eliminar asignación' }
        }
    }
}

export const AssignmentService = createService('AssignmentService', rawService)
