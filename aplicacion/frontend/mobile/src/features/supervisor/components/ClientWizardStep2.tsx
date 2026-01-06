
import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, Dimensions } from 'react-native'
import MapView, { Marker, Polygon, PROVIDER_GOOGLE, MapPressEvent } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Zone, ZoneHelpers } from '../../../services/api/ZoneService'

interface Props {
    clientData: any
    setClientData: (data: any) => void
    zones: Zone[]
    onNext: () => void
    onBack: () => void
}

export function ClientWizardStep2({ clientData, setClientData, zones, onNext, onBack }: Props) {
    // 1. Get Selected Zone Polygon
    const selectedZone = zones.find(z => z.id === clientData.zona_comercial_id)
    const zonePolygon = selectedZone ? ZoneHelpers.parsePolygon(selectedZone.poligono_geografico) : []

    // 2. Initial Map Region
    const [region, setRegion] = useState({
        latitude: -3.99313,
        longitude: -79.20422,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02
    })

    // 3. Pin Location (from clientData or default)
    const [markerCoord, setMarkerCoord] = useState<{ latitude: number, longitude: number } | null>(null)

    useEffect(() => {
        // Init region based on zone
        if (zonePolygon.length > 0) {
            setRegion({
                latitude: zonePolygon[0].latitude,
                longitude: zonePolygon[0].longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015
            })
        }

        // Init marker if exists
        // clientData.ubicacion_gps might be GeoJSON { type: 'Point', coordinates: [lng, lat] }
        if (clientData.ubicacion_gps && clientData.ubicacion_gps.coordinates) {
            setMarkerCoord({
                longitude: clientData.ubicacion_gps.coordinates[0],
                latitude: clientData.ubicacion_gps.coordinates[1]
            })
        }
    }, [])

    const handleMapPress = (e: MapPressEvent) => {
        const coord = e.nativeEvent.coordinate
        setMarkerCoord(coord)
        // Save to parent state in GeoJSON format
        setClientData({
            ...clientData,
            ubicacion_gps: {
                type: 'Point',
                coordinates: [coord.longitude, coord.latitude]
            }
        })
    }

    return (
        <View className="flex-1 bg-white">

            {/* Header Instructions */}
            <View className="px-5 py-4 bg-white border-b border-neutral-100">
                <Text className="text-lg font-bold text-neutral-900 mb-1">Ubicación Principal</Text>
                <Text className="text-neutral-500 text-sm">
                    Arrastra el pin o toca en el mapa para definir la ubicación exacta del cliente dentro de la zona <Text className="font-bold text-red-500">{selectedZone?.nombre}</Text>.
                </Text>
            </View>

            {/* Address Input Overlay */}
            <View className="px-5 py-3 bg-neutral-50 border-b border-neutral-200">
                <Text className="text-neutral-500 font-medium mb-1">Dirección Escrita</Text>
                <TextInput
                    className="bg-white border border-neutral-200 rounded-xl p-3 text-neutral-900 shadow-sm"
                    value={clientData.direccion_texto}
                    onChangeText={t => setClientData({ ...clientData, direccion_texto: t })}
                    placeholder="Ej. Calle A y Calle B, Casa 123"
                    multiline
                />
            </View>

            {/* Full Screen Map */}
            <View className="flex-1 relative">
                <MapView
                    provider={PROVIDER_GOOGLE}
                    style={{ flex: 1, width: Dimensions.get('window').width }}
                    region={region}
                    onRegionChangeComplete={setRegion}
                    onPress={handleMapPress}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                >
                    {/* Zone Boundary */}
                    {zonePolygon.length > 0 && (
                        <Polygon
                            coordinates={zonePolygon}
                            strokeColor={BRAND_COLORS.red}
                            fillColor="rgba(239, 68, 68, 0.1)"
                            strokeWidth={2}
                        />
                    )}

                    {/* Draggable Marker */}
                    {markerCoord && (
                        <Marker
                            coordinate={markerCoord}
                            draggable
                            onDragEnd={(e) => handleMapPress(e as any)}
                            title="Ubicación del Cliente"
                            description={clientData.direccion_texto || "Sin dirección"}
                        >
                            <Ionicons name="location" size={40} color={BRAND_COLORS.red} />
                        </Marker>
                    )}
                </MapView>

                {/* Instruction Overlay (Moved outside MapView) */}
                {!markerCoord && (
                    <View className="absolute bottom-32 left-0 right-0 items-center px-4 pointer-events-none">
                        <View className="bg-neutral-900/80 px-4 py-3 rounded-full shadow-lg flex-row items-center">
                            <Ionicons name="hand-right-outline" size={20} color="white" />
                            <Text className="text-white ml-2 font-bold text-sm text-center">
                                Toca cualquier punto del mapa para fijar la ubicación
                            </Text>
                        </View>
                    </View>
                )}

                {/* Floating Navigation Buttons */}
                <View className="absolute bottom-8 left-5 right-5 flex-row justify-between gap-4">
                    <TouchableOpacity
                        className="flex-1 bg-white border border-neutral-200 py-4 rounded-xl items-center shadow-lg"
                        onPress={onBack}
                    >
                        <Text className="text-neutral-700 font-bold text-lg">Atrás</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`flex-1 py-4 rounded-xl items-center shadow-lg ${!markerCoord ? 'bg-neutral-300' : 'bg-red-600'}`}
                        style={markerCoord ? { backgroundColor: BRAND_COLORS.red } : {}}
                        onPress={onNext}
                        disabled={!markerCoord}
                    >
                        <Text className="text-white font-bold text-lg">Siguiente</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}
