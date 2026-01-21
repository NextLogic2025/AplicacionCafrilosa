/**
 * Polygon geometry utilities for zone overlap detection
 */

export interface LatLng {
    lat: number
    lng: number
}

/**
 * Parse GeoJSON polygon to array of LatLng coordinates
 */
export function parsePolygonCoordinates(geoJson: any): LatLng[] {
    if (!geoJson) return []

    // If already an array of LatLng
    if (Array.isArray(geoJson) && geoJson.every((p: any) => typeof p?.lat === 'number' && typeof p?.lng === 'number')) {
        return geoJson as LatLng[]
    }

    // If GeoJSON format
    if (typeof geoJson === 'object' && geoJson !== null && 'coordinates' in geoJson) {
        const coordinates = geoJson.coordinates?.[0]
        if (Array.isArray(coordinates)) {
            return coordinates
                .map((pair: any) => {
                    if (!Array.isArray(pair) || pair.length < 2) return null
                    const [lng, lat] = pair
                    if (typeof lat !== 'number' || typeof lng !== 'number') return null
                    return { lat, lng }
                })
                .filter(Boolean) as LatLng[]
        }
    }

    return []
}

/**
 * Check if two line segments intersect
 * Uses the cross product method
 */
function doLineSegmentsIntersect(p1: LatLng, p2: LatLng, p3: LatLng, p4: LatLng): boolean {
    const ccw = (A: LatLng, B: LatLng, C: LatLng) => {
        return (C.lng - A.lng) * (B.lat - A.lat) > (B.lng - A.lng) * (C.lat - A.lat)
    }

    const a = ccw(p1, p3, p4)
    const b = ccw(p2, p3, p4)
    const c = ccw(p1, p2, p3)
    const d = ccw(p1, p2, p4)

    return a !== b && c !== d
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
    if (polygon.length < 3) return false

    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lng
        const yi = polygon[i].lat
        const xj = polygon[j].lng
        const yj = polygon[j].lat

        const intersect = ((yi > point.lat) !== (yj > point.lat)) &&
            (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi)

        if (intersect) inside = !inside
    }

    return inside
}

/**
 * Check if two polygons intersect or overlap
 * Returns true if polygons share any area
 */
export function doPolygonsIntersect(poly1: LatLng[], poly2: LatLng[]): boolean {
    if (poly1.length < 3 || poly2.length < 3) return false

    // Check if any edges of poly1 intersect with edges of poly2
    for (let i = 0; i < poly1.length; i++) {
        const p1 = poly1[i]
        const p2 = poly1[(i + 1) % poly1.length]

        for (let j = 0; j < poly2.length; j++) {
            const p3 = poly2[j]
            const p4 = poly2[(j + 1) % poly2.length]

            if (doLineSegmentsIntersect(p1, p2, p3, p4)) {
                return true
            }
        }
    }

    // Check if poly1 is completely inside poly2
    if (isPointInPolygon(poly1[0], poly2)) {
        return true
    }

    // Check if poly2 is completely inside poly1
    if (isPointInPolygon(poly2[0], poly1)) {
        return true
    }

    return false
}

/**
 * Find zones that overlap with the given polygon
 */
export function findOverlappingZones(
    currentPolygon: any,
    allZones: Array<{ id: number; nombre: string; poligono_geografico: any }>,
    excludeZoneId?: number
): Array<{ id: number; nombre: string }> {
    const currentCoords = parsePolygonCoordinates(currentPolygon)
    if (currentCoords.length < 3) return []

    const overlapping: Array<{ id: number; nombre: string }> = []

    for (const zone of allZones) {
        // Skip the zone being edited
        if (excludeZoneId && zone.id === excludeZoneId) continue

        const zoneCoords = parsePolygonCoordinates(zone.poligono_geografico)
        if (zoneCoords.length < 3) continue

        if (doPolygonsIntersect(currentCoords, zoneCoords)) {
            overlapping.push({ id: zone.id, nombre: zone.nombre })
        }
    }

    return overlapping
}
