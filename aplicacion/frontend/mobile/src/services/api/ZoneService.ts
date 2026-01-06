
import { apiRequest } from './client'

// Shared State for Zone Editing (Avoids Navigation Params issues)
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

// Helpers for GeoJSON <-> Google Maps
export const ZoneHelpers = {
    // GeoJSON Polygon [[[lng, lat], ...]] -> [{latitude, longitude}, ...]
    parsePolygon: (geoJson?: { type: string, coordinates: number[][][] }): LatLng[] => {
        if (!geoJson || !geoJson.coordinates || !geoJson.coordinates[0]) return []
        const coords = geoJson.coordinates[0].map(coord => ({
            latitude: coord[1],
            longitude: coord[0]
        }))
        // Remove closing point if identical to first (standard GeoJSON)
        if (coords.length > 2) {
            const first = coords[0]
            const last = coords[coords.length - 1]
            if (first.latitude === last.latitude && first.longitude === last.longitude) {
                coords.pop()
            }
        }
        return coords
    },

    // [{latitude, longitude}, ...] -> GeoJSON Polygon [[[lng, lat], ...]]
    toGeoJson: (coords: LatLng[]): { type: 'Polygon', coordinates: number[][][] } | null => {
        if (!coords || coords.length < 3) return null
        // Ensure closed loop
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

export const ZoneService = {
    getZones: async (): Promise<Zone[]> => {
        try {
            return await apiRequest<Zone[]>('/api/zonas')
        } catch (error) {
            console.error('Error fetching zones:', error)
            return []
        }
    },

    createZone: async (data: CreateZonePayload): Promise<{ success: boolean; data?: Zone; message?: string }> => {
        try {
            const response = await apiRequest<Zone>('/api/zonas', {
                method: 'POST',
                body: JSON.stringify(data)
            })
            return { success: true, data: response }
        } catch (error: any) {
            console.error('Error creating zone:', error)
            return { success: false, message: error.message || 'Error al crear zona' }
        }
    },

    updateZone: async (id: number, data: UpdateZonePayload): Promise<{ success: boolean; message?: string }> => {
        try {
            await apiRequest(`/api/zonas/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            })
            return { success: true, message: 'Zona actualizada correctamente' }
        } catch (error: any) {
            console.error('Error updating zone:', error)
            return { success: false, message: error.message || 'Error al actualizar zona' }
        }
    },

    deleteZone: async (id: number): Promise<{ success: boolean; message?: string }> => {
        try {
            await apiRequest(`/api/zonas/${id}`, {
                method: 'DELETE'
            })
            return { success: true, message: 'Zona eliminada correctamente' }
        } catch (error: any) {
            console.error('Error deleting zone:', error)
            return { success: false, message: error.message || 'Error al eliminar zona' }
        }
    }
}
