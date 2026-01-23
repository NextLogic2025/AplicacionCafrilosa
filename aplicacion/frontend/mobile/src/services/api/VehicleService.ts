import { ApiService } from './ApiService'
import { createService } from './createService'
import { env } from '../../config/env'
import { endpoints } from './endpoints'
import { logErrorForDebugging } from '../../utils/errorMessages'

export type VehicleEstado = 'DISPONIBLE' | 'EN_RUTA' | 'MANTENIMIENTO' | 'INACTIVO'

export interface Vehicle {
    id: string
    placa: string
    marca: string | null
    modelo: string | null
    anio: number | null
    capacidad_kg: string | null
    estado: VehicleEstado
    created_at: string
    updated_at: string
    deleted_at: string | null
}

export interface CreateVehicleDto {
    placa: string
    marca?: string
    modelo?: string
    anio?: number
    capacidad_kg?: string
    estado?: VehicleEstado
}

export interface UpdateVehicleDto {
    placa?: string
    marca?: string
    modelo?: string
    anio?: number
    capacidad_kg?: string
    estado?: VehicleEstado
}

export interface VehicleFilters {
    estado?: VehicleEstado
    search?: string
}

export interface VehicleStats {
    total: number
    disponibles: number
    enRuta: number
    mantenimiento: number
    inactivos: number
    capacidadTotal: number
}

export const VEHICLE_ESTADO_COLORS: Record<VehicleEstado, string> = {
    DISPONIBLE: '#10B981',
    EN_RUTA: '#3B82F6',
    MANTENIMIENTO: '#F59E0B',
    INACTIVO: '#6B7280'
}

export const VEHICLE_ESTADO_LABELS: Record<VehicleEstado, string> = {
    DISPONIBLE: 'Disponible',
    EN_RUTA: 'En Ruta',
    MANTENIMIENTO: 'Mantenimiento',
    INACTIVO: 'Inactivo'
}

const logisticsEndpoint = (path: string) => `${env.api.logisticsUrl}${path}`

async function fetchVehiclesFromApi(): Promise<Vehicle[]> {
    return ApiService.get<Vehicle[]>(logisticsEndpoint(endpoints.logistics.vehiculos))
}

function applyFilters(vehicles: Vehicle[], filters?: VehicleFilters): Vehicle[] {
    let result = vehicles

    if (filters?.estado) {
        result = result.filter(v => v.estado === filters.estado)
    }

    if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        result = result.filter(v =>
            v.placa.toLowerCase().includes(searchLower) ||
            (v.marca && v.marca.toLowerCase().includes(searchLower)) ||
            (v.modelo && v.modelo.toLowerCase().includes(searchLower))
        )
    }

    return result.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
}

const rawService = {
    async list(filters?: VehicleFilters): Promise<Vehicle[]> {
        try {
            const vehicles = await fetchVehiclesFromApi()
            return applyFilters(vehicles, filters)
        } catch (error) {
            logErrorForDebugging(error, 'VehicleService.list', { filters })
            throw error
        }
    },

    async getById(id: string): Promise<Vehicle> {
        try {
            return await ApiService.get<Vehicle>(logisticsEndpoint(endpoints.logistics.vehiculoById(id)))
        } catch (error) {
            logErrorForDebugging(error, 'VehicleService.getById', { id })
            throw error
        }
    },

    async create(data: CreateVehicleDto): Promise<Vehicle> {
        try {
            return await ApiService.post<Vehicle>(logisticsEndpoint(endpoints.logistics.vehiculos), data)
        } catch (error) {
            logErrorForDebugging(error, 'VehicleService.create', { data })
            throw error
        }
    },

    async update(id: string, data: UpdateVehicleDto): Promise<Vehicle> {
        try {
            return await ApiService.put<Vehicle>(logisticsEndpoint(endpoints.logistics.vehiculoById(id)), data)
        } catch (error) {
            logErrorForDebugging(error, 'VehicleService.update', { id, data })
            throw error
        }
    },

    async delete(id: string): Promise<void> {
        try {
            await ApiService.delete<void>(logisticsEndpoint(endpoints.logistics.vehiculoById(id)))
        } catch (error) {
            logErrorForDebugging(error, 'VehicleService.delete', { id })
            throw error
        }
    },

    async getDisponibles(): Promise<Vehicle[]> {
        return rawService.list({ estado: 'DISPONIBLE' })
    },

    async getStats(): Promise<VehicleStats> {
        try {
            const vehicles = await rawService.list()
            return {
                total: vehicles.length,
                disponibles: vehicles.filter(v => v.estado === 'DISPONIBLE').length,
                enRuta: vehicles.filter(v => v.estado === 'EN_RUTA').length,
                mantenimiento: vehicles.filter(v => v.estado === 'MANTENIMIENTO').length,
                inactivos: vehicles.filter(v => v.estado === 'INACTIVO').length,
                capacidadTotal: vehicles.reduce((sum, v) => sum + (parseFloat(v.capacidad_kg || '0') || 0), 0)
            }
        } catch (error) {
            logErrorForDebugging(error, 'VehicleService.getStats')
            throw error
        }
    },

    getPlacaDisplay(placa: string): string {
        return placa.toUpperCase()
    },

    getEstadoBadgeColor(estado: VehicleEstado): string {
        return VEHICLE_ESTADO_COLORS[estado] || '#6B7280'
    },

    getEstadoLabel(estado: VehicleEstado): string {
        return VEHICLE_ESTADO_LABELS[estado] || estado
    }
}

export const VehicleService = createService('VehicleService', rawService)
