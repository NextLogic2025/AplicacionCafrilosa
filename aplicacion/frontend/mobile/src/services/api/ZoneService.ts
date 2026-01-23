import { ApiService } from './ApiService'
import { createService } from './createService'
import { endpoints } from './endpoints'
import { logErrorForDebugging } from '../../utils/errorMessages'

/** Estado compartido para edición de zonas (evita problemas con params de navegación) */
export const ZoneEditState = {
    tempPolygon: null as LatLng[] | null,
    editingZoneId: null as number | null
}

export interface Zone {
    id: number
    codigo: string
    nombre: string
    ciudad?: string
    macrorregion?: string
    activo: boolean
    poligono_geografico?: {
        type: 'Polygon'
        coordinates: number[][][]
    }
}

export interface LatLng {
    latitude: number
    longitude: number
}

export const ZoneHelpers = {
    parsePolygon: (geoJson?: any): LatLng[] => {
        if (!geoJson) return []

        let coordinates: number[][] | undefined

        if (geoJson.coordinates && Array.isArray(geoJson.coordinates)) {
            if (geoJson.coordinates[0] && Array.isArray(geoJson.coordinates[0])) {
                if (Array.isArray(geoJson.coordinates[0][0])) {
                    coordinates = geoJson.coordinates[0]
                } else {
                    coordinates = geoJson.coordinates
                }
            }
        }

        if (!coordinates || coordinates.length < 3) return []

        const coords = coordinates.map(coord => {
            if (Array.isArray(coord) && coord.length >= 2) {
                return {
                    latitude: Number(coord[1]),
                    longitude: Number(coord[0])
                }
            }
            return null
        }).filter((c): c is LatLng => c !== null && !isNaN(c.latitude) && !isNaN(c.longitude))

        if (coords.length > 2) {
            const first = coords[0]
            const last = coords[coords.length - 1]
            if (first.latitude === last.latitude && first.longitude === last.longitude) {
                coords.pop()
            }
        }

        return coords
    },

    toGeoJson: (coords: LatLng[]): { type: 'Polygon'; coordinates: number[][][] } | null => {
        if (!coords || coords.length < 3) return null

        const closedCoords = [...coords]
        const first = coords[0]
        const last = coords[coords.length - 1]
        if (first.latitude !== last.latitude || first.longitude !== last.longitude) {
            closedCoords.push(first)
        }

        return {
            type: 'Polygon',
            coordinates: [
                closedCoords.map(c => [c.longitude, c.latitude])
            ]
        }
    }
}

export interface CreateZonePayload {
    codigo: string
    nombre: string
    ciudad?: string
    macrorregion?: string
    poligono_geografico?: any
    activo?: boolean
}

export interface UpdateZonePayload {
    codigo?: string
    nombre?: string
    ciudad?: string
    macrorregion?: string
    activo?: boolean
    poligono_geografico?: any
}

const rawService = {
    async getZones(): Promise<Zone[]> {
        try {
            return await ApiService.get<Zone[]>(endpoints.catalog.zonas)
        } catch (error) {
            logErrorForDebugging(error, 'ZoneService.getZones')
            return []
        }
    },

    async createZone(data: CreateZonePayload): Promise<{ success: boolean; data?: Zone; message?: string }> {
        try {
            const response = await ApiService.post<Zone>(endpoints.catalog.zonas, data)
            return { success: true, data: response }
        } catch (error: any) {
            logErrorForDebugging(error, 'ZoneService.createZone', { data })
            return { success: false, message: error.message || 'Error al crear zona' }
        }
    },

    async updateZone(id: number, data: UpdateZonePayload): Promise<{ success: boolean; message?: string }> {
        try {
            await ApiService.put(endpoints.catalog.zonaById(id), data)
            return { success: true, message: 'Zona actualizada correctamente' }
        } catch (error: any) {
            logErrorForDebugging(error, 'ZoneService.updateZone', { id, data })
            return { success: false, message: error.message || 'Error al actualizar zona' }
        }
    },

    async deleteZone(id: number): Promise<{ success: boolean; message?: string }> {
        try {
            await ApiService.delete(endpoints.catalog.zonaById(id))
            return { success: true, message: 'Zona eliminada correctamente' }
        } catch (error: any) {
            logErrorForDebugging(error, 'ZoneService.deleteZone', { id })
            return { success: false, message: error.message || 'Error al eliminar zona' }
        }
    }
}

export const ZoneService = createService('ZoneService', rawService)
