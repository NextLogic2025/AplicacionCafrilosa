import { env } from '../../config/env'
import { ApiService } from './ApiService'
import { endpoints } from './endpoints'
import { createService } from './createService'

export interface Conductor {
    id: string
    usuario_id: string | null
    nombre_completo: string
    cedula: string
    telefono: string | null
    licencia: string | null
    activo: boolean
    created_at: string
    updated_at: string
    deleted_at: string | null
}

export interface CreateConductorDto {
    usuario_id?: string
    nombre_completo: string
    cedula: string
    telefono?: string
    licencia?: string
    activo?: boolean
}

export type UpdateConductorDto = Partial<CreateConductorDto>

export interface ConductorFilters {
    activo?: boolean
    search?: string
}

export interface ConductorStats {
    total: number
    activos: number
    inactivos: number
    conLicencia: number
    sinLicencia: number
    vinculados: number
}

const logisticsEndpoint = (path: string) => `${env.api.logisticsUrl}${path}`

function normalizeText(value?: string): string {
    return (value ?? '').toLowerCase()
}

function applyFilters(conductores: Conductor[], filters?: ConductorFilters): Conductor[] {
    let result = conductores

    if (filters?.activo !== undefined) {
        result = result.filter(c => c.activo === filters.activo)
    }

    if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        result = result.filter(c =>
            normalizeText(c.nombre_completo).includes(searchLower) ||
            normalizeText(c.cedula).includes(searchLower)
        )
    }

    return result
}

function sortByCreation(conductores: Conductor[]): Conductor[] {
    return [...conductores].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
}

async function fetchAndFilter(filters?: ConductorFilters): Promise<Conductor[]> {
    const conductores = await ApiService.get<Conductor[]>(logisticsEndpoint(endpoints.logistics.conductores))
    const filtered = applyFilters(conductores, filters)
    return sortByCreation(filtered)
}

const rawService = {
    list: fetchAndFilter,

    getById: async (id: string): Promise<Conductor> => {
        return await ApiService.get<Conductor>(logisticsEndpoint(endpoints.logistics.conductorById(id)))
    },

    create: async (data: CreateConductorDto): Promise<Conductor> => {
        return await ApiService.post<Conductor>(logisticsEndpoint(endpoints.logistics.conductores), data)
    },

    update: async (id: string, data: UpdateConductorDto): Promise<Conductor> => {
        return await ApiService.put<Conductor>(logisticsEndpoint(endpoints.logistics.conductorById(id)), data)
    },

    delete: async (id: string): Promise<void> => {
        await ApiService.delete<void>(logisticsEndpoint(endpoints.logistics.conductorById(id)))
    },

    getActivos: async (): Promise<Conductor[]> => {
        return await fetchAndFilter({ activo: true })
    },

    getDisponibles: async (): Promise<Conductor[]> => {
        const activos = await fetchAndFilter({ activo: true })
        return activos.filter(c => !c.usuario_id)
    },

    getStats: async (): Promise<ConductorStats> => {
        const conductores = await fetchAndFilter()
        return {
            total: conductores.length,
            activos: conductores.filter(c => c.activo).length,
            inactivos: conductores.filter(c => !c.activo).length,
            conLicencia: conductores.filter(c => Boolean(c.licencia)).length,
            sinLicencia: conductores.filter(c => !c.licencia).length,
            vinculados: conductores.filter(c => Boolean(c.usuario_id)).length
        }
    },

    getInitials: (nombreCompleto: string): string => {
        return nombreCompleto
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(word => word.charAt(0).toUpperCase())
            .join('')
    }
}

export const ConductorService = createService('ConductorService', rawService)
