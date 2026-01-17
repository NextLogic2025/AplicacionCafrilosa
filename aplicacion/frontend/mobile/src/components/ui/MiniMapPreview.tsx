import React, { useMemo } from 'react'
import { View, TouchableOpacity } from 'react-native'
import MapView, { Polygon, PROVIDER_GOOGLE, Marker } from 'react-native-maps'
import { BRAND_COLORS } from '../../shared/types'

type LatLng = { latitude: number; longitude: number }

type Props = {
    polygon?: LatLng[]
    center?: LatLng
    marker?: LatLng
    height?: number
    onPress?: () => void
}

const FALLBACK_REGION = {
    latitude: -0.1807,
    longitude: -78.4678,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
}

export function MiniMapPreview({ polygon, center, marker, height = 180, onPress }: Props) {
    const region = useMemo(() => {
        if (polygon && polygon.length > 0) {
            const first = polygon[0]
            return { ...FALLBACK_REGION, latitude: first.latitude, longitude: first.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
        }
        if (center) {
            return { ...FALLBACK_REGION, latitude: center.latitude, longitude: center.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
        }
        return FALLBACK_REGION
    }, [polygon, center])

    return (
        <TouchableOpacity activeOpacity={onPress ? 0.9 : 1} onPress={onPress} style={{ height, borderRadius: 16, overflow: 'hidden' }}>
            <MapView
                pointerEvents="none"
                provider={PROVIDER_GOOGLE}
                style={{ flex: 1 }}
                initialRegion={region}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
            >
                {polygon && polygon.length > 0 && (
                    <Polygon
                        coordinates={polygon}
                        strokeColor={BRAND_COLORS.red}
                        fillColor="rgba(239,68,68,0.25)"
                        strokeWidth={2}
                    />
                )}
                {marker && (
                    <Marker coordinate={marker} pinColor={BRAND_COLORS.red} />
                )}
            </MapView>
            <View style={{ position: 'absolute', inset: 0, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' }} />
        </TouchableOpacity>
    )
}
