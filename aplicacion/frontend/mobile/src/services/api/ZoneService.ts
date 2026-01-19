import { apiRequest } from './client'

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

/** Helpers para conversión GeoJSON <-> Google Maps */
export const ZoneHelpers = {
    /** Convierte GeoJSON Polygon a array de LatLng para Google Maps */
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

    /** Convierte array de LatLng a GeoJSON Polygon */
    toGeoJson: (coords: LatLng[]): { type: 'Polygon', coordinates: number[][][] } | null => {
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
