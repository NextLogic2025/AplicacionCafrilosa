import React, { useMemo } from 'react'
import { View, StyleSheet, Text, Dimensions } from 'react-native'
import MapView, { Marker, Polyline, Polygon, PROVIDER_GOOGLE } from 'react-native-maps'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { RoutePlan } from '../../../services/api/RouteService'

interface Props {
    routes: RoutePlan[]
    zonePolygon?: any // GeoJSON or array of points
}

// Pseudo-random number generator for stable coordinates based on ID
const pseudoRandom = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
    }
    const x = Math.sin(hash) * 10000;
    return x - Math.floor(x);
}

export function RoutePlanningMap({ routes, zonePolygon }: Props) {

    // Initial region (Loja fallback)
    const initialRegion = {
        latitude: -3.99313,
        longitude: -79.20422,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    }

    const markers = useMemo(() => {
        return routes.map((r, i) => {
            let lat = -3.99313
            let lng = -79.20422

            // 1. Try Real GPS
            if (r._cliente?.ubicacion_gps?.coordinates) {
                // PostGIS uses [lon, lat]
                const [lon, latitude] = r._cliente.ubicacion_gps.coordinates
                lat = latitude
                lng = lon
            }
            // 2. Deterministic Fallback (Stable Random)
            else {
                // Use client ID or temp ID to generate stable offset
                const seedLat = pseudoRandom(r.cliente_id + 'lat')
                const seedLng = pseudoRandom(r.cliente_id + 'lng')

                lat = -3.99313 + (seedLat * 0.02 - 0.01)
                lng = -79.20422 + (seedLng * 0.02 - 0.01)
            }

            return {
                ...r,
                coordinate: {
                    latitude: lat,
                    longitude: lng
                }
            }
        })
    }, [routes]) // Only re-calc if routes list actually changes

    const orderedCoordinates = markers.map(m => m.coordinate)

    // Parse Polygon if GeoJSON
    let polygonCoords = []
    if (zonePolygon) {
        if (Array.isArray(zonePolygon)) {
            polygonCoords = zonePolygon
        } else if (zonePolygon.coordinates && zonePolygon.coordinates[0]) {
            // GeoJSON Polygon geometry: [[[lon, lat], ...]]
            polygonCoords = zonePolygon.coordinates[0].map((pt: number[]) => ({
                latitude: pt[1],
                longitude: pt[0]
            }))
        }
    }

    return (
        <View style={styles.container}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={initialRegion}
            >
                {/* Zone Polygon */}
                {polygonCoords.length > 2 && (
                    <Polygon
                        coordinates={polygonCoords}
                        strokeColor={BRAND_COLORS.red}
                        fillColor="rgba(239, 68, 68, 0.1)" // Red with low opacity
                        strokeWidth={2}
                    />
                )}

                {/* Route Line */}
                {orderedCoordinates.length > 1 && (
                    <Polyline
                        coordinates={orderedCoordinates}
                        strokeColor="#2563EB" // Blue
                        strokeWidth={4}
                        lineDashPattern={[0]}
                    />
                )}

                {/* Markers */}
                {markers.map((marker, index) => (
                    <Marker
                        key={marker.cliente_id} // Stable Key!
                        coordinate={marker.coordinate}
                        title={marker._cliente?.nombre_comercial}
                        description={`Orden: ${index + 1}`}
                    >
                        <View style={styles.markerContainer}>
                            <Text style={styles.markerText}>{index + 1}</Text>
                        </View>
                    </Marker>
                ))}
            </MapView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e5e5e5',
        overflow: 'hidden',
        borderRadius: 16,
        margin: 16,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    markerContainer: {
        backgroundColor: BRAND_COLORS.red,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    markerText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    }
})
