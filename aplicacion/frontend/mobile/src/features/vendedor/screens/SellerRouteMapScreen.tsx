import React, { useEffect, useState, useRef } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Pressable, ScrollView } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps'
import { useNavigation } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { RouteService, type RoutePlan } from '../../../services/api/RouteService'
import { ClientService, type Client } from '../../../services/api/ClientService'

// Interfaz para cliente con datos del rutero combinados
interface RouteClientMarker {
    cliente: Client
    rutero: RoutePlan
}

export function SellerRouteMapScreen() {
    const navigation = useNavigation()
    const mapRef = useRef<MapView>(null)
    const [loading, setLoading] = useState(true)
    const [markers, setMarkers] = useState<RouteClientMarker[]>([])
    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay())

    // Cargar datos del rutero y clientes
    useEffect(() => {
        loadRouteMap()
    }, [selectedDay])

    const loadRouteMap = async () => {
        setLoading(true)
        try {
            // 1. Obtener rutero del vendedor
            const routePlans = await RouteService.getMyRoute()
            console.log('📍 Rutero cargado:', routePlans.length, 'planes')

            // 2. Filtrar por día seleccionado y solo activos
            const todayPlans = routePlans.filter(
                (plan) => plan.activo && plan.dia_semana === selectedDay
            )
            console.log(`📍 Planes para día ${selectedDay}:`, todayPlans.length)

            // 3. Cargar datos de cada cliente en paralelo
            const markersData = await Promise.all(
                todayPlans.map(async (plan) => {
                    try {
                        const cliente = await ClientService.getClient(plan.cliente_id)
                        console.log(`📍 Cliente ${cliente.razon_social}:`, cliente.ubicacion_gps ? 'CON GPS' : 'SIN GPS')
                        return { cliente, rutero: plan }
                    } catch (error) {
                        console.error(`❌ Error cargando cliente ${plan.cliente_id}:`, error)
                        return null
                    }
                })
            )

            // 4. Filtrar nulls y clientes sin ubicación GPS
            const validMarkers = markersData.filter(
                (m): m is RouteClientMarker =>
                    m !== null &&
                    m.cliente.ubicacion_gps?.coordinates !== undefined &&
                    Array.isArray(m.cliente.ubicacion_gps.coordinates) &&
                    m.cliente.ubicacion_gps.coordinates.length === 2
            )

            console.log(`📍 Markers válidos con GPS: ${validMarkers.length} de ${markersData.length}`)
            setMarkers(validMarkers)

            // 5. Ajustar la cámara del mapa para mostrar todos los markers
            if (validMarkers.length > 0 && mapRef.current) {
                const coordinates = validMarkers.map(m => ({
                    latitude: m.cliente.ubicacion_gps!.coordinates[1],
                    longitude: m.cliente.ubicacion_gps!.coordinates[0]
                }))

                console.log('📍 Ajustando cámara a coordenadas:', coordinates)

                setTimeout(() => {
                    mapRef.current?.fitToCoordinates(coordinates, {
                        edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
                        animated: true
                    })
                }, 500)
            }
        } catch (error) {
            console.error('❌ Error cargando mapa del rutero:', error)
        } finally {
            setLoading(false)
        }
    }

    // Obtener color del marker según prioridad
    const getMarkerColor = (prioridad: string): string => {
        switch (prioridad) {
            case 'ALTA':
                return '#DC2626' // Rojo
            case 'MEDIA':
                return '#F59E0B' // Ámbar
            case 'BAJA':
            case 'NORMAL':
            default:
                return '#10B981' // Verde
        }
    }

    // Días de la semana para el selector
    const daysOfWeek = [
        { num: 1, label: 'Lun' },
        { num: 2, label: 'Mar' },
        { num: 3, label: 'Mié' },
        { num: 4, label: 'Jue' },
        { num: 5, label: 'Vie' },
        { num: 6, label: 'Sáb' },
        { num: 0, label: 'Dom' }
    ]

    if (loading) {
        return (
            <View style={styles.container}>
                <Header title="Mapa del Rutero" variant="standard" onBackPress={() => navigation.goBack()} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                    <Text style={styles.loadingText}>Cargando mapa...</Text>
                </View>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Header title="Mapa del Rutero" variant="standard" onBackPress={() => navigation.goBack()} />

            {/* Selector de día */}
            <View style={styles.daySelectorContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.daySelectorContent}
                >
                    {daysOfWeek.map((day) => {
                        const isToday = day.num === new Date().getDay()
                        const isSelected = day.num === selectedDay
                        return (
                            <Pressable
                                key={day.num}
                                style={[
                                    styles.dayButton,
                                    isSelected && styles.dayButtonSelected,
                                    isToday && !isSelected && styles.dayButtonToday
                                ]}
                                onPress={() => setSelectedDay(day.num)}
                            >
                                <Text style={[
                                    styles.dayButtonText,
                                    isSelected && styles.dayButtonTextSelected
                                ]}>
                                    {day.label}
                                </Text>
                                {isToday && (
                                    <View style={styles.todayIndicator} />
                                )}
                            </Pressable>
                        )
                    })}
                </ScrollView>
            </View>

            {/* Mapa */}
            {markers.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="map-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>No hay visitas para mostrar</Text>
                    <Text style={styles.emptySubtext}>
                        {loading ? 'Cargando...' : 'No hay visitas programadas para este día o los clientes no tienen ubicación GPS configurada'}
                    </Text>
                </View>
            ) : (
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={{
                        latitude: markers[0]?.cliente.ubicacion_gps?.coordinates[1] || -2.1894,
                        longitude: markers[0]?.cliente.ubicacion_gps?.coordinates[0] || -79.8851,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05
                    }}
                    showsUserLocation
                    showsMyLocationButton
                >
                    {markers.map((marker, index) => {
                        const [lng, lat] = marker.cliente.ubicacion_gps!.coordinates
                        const prioridad = marker.rutero.prioridad_visita || 'NORMAL'

                        return (
                            <Marker
                                key={marker.cliente.id}
                                coordinate={{ latitude: lat, longitude: lng }}
                                pinColor={getMarkerColor(prioridad)}
                                title={marker.cliente.nombre_comercial || marker.cliente.razon_social}
                                description={`Orden: ${marker.rutero.orden_sugerido || 'N/A'} | Hora: ${marker.rutero.hora_estimada_arribo || 'N/A'}`}
                            >
                                <View style={styles.customMarker}>
                                    <View style={[
                                        styles.markerCircle,
                                        { backgroundColor: getMarkerColor(prioridad) }
                                    ]}>
                                        <Text style={styles.markerText}>
                                            {marker.rutero.orden_sugerido || (index + 1)}
                                        </Text>
                                    </View>
                                    <View style={[
                                        styles.markerTriangle,
                                        { borderTopColor: getMarkerColor(prioridad) }
                                    ]} />
                                </View>

                                <Callout
                                    onPress={() => {
                                        // @ts-ignore
                                        navigation.navigate('SellerClientDetail', { clientId: marker.cliente.id })
                                    }}
                                >
                                    <View style={styles.calloutContainer}>
                                        <Text style={styles.calloutTitle}>
                                            {marker.cliente.nombre_comercial || marker.cliente.razon_social}
                                        </Text>
                                        <View style={styles.calloutRow}>
                                            <Ionicons name="time-outline" size={14} color="#6B7280" />
                                            <Text style={styles.calloutText}>
                                                {marker.rutero.hora_estimada_arribo || 'Sin hora'}
                                            </Text>
                                        </View>
                                        <View style={styles.calloutRow}>
                                            <Ionicons name="flag-outline" size={14} color="#6B7280" />
                                            <Text style={styles.calloutText}>
                                                Prioridad: {prioridad}
                                            </Text>
                                        </View>
                                        <View style={styles.calloutRow}>
                                            <Ionicons name="location-outline" size={14} color="#6B7280" />
                                            <Text style={styles.calloutText}>
                                                {marker.cliente.direccion_texto || 'Sin dirección'}
                                            </Text>
                                        </View>
                                        <Text style={styles.calloutLink}>Toca para ver detalles</Text>
                                    </View>
                                </Callout>
                            </Marker>
                        )
                    })}
                </MapView>
            )}

            {/* Info footer */}
            <View style={styles.footer}>
                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
                        <Text style={styles.legendText}>Alta</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                        <Text style={styles.legendText}>Media</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                        <Text style={styles.legendText}>Baja/Normal</Text>
                    </View>
                </View>
                <Text style={styles.footerCount}>{markers.length} visita(s) programada(s)</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280'
    },
    daySelectorContainer: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingVertical: 8
    },
    daySelectorContent: {
        paddingHorizontal: 16,
        gap: 8
    },
    dayButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        minWidth: 60,
        alignItems: 'center',
        position: 'relative'
    },
    dayButtonSelected: {
        backgroundColor: BRAND_COLORS.red
    },
    dayButtonToday: {
        borderWidth: 2,
        borderColor: BRAND_COLORS.red
    },
    dayButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151'
    },
    dayButtonTextSelected: {
        color: 'white'
    },
    todayIndicator: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: BRAND_COLORS.red
    },
    map: {
        flex: 1
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
        textAlign: 'center'
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20
    },
    customMarker: {
        alignItems: 'center'
    },
    markerCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5
    },
    markerText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14
    },
    markerTriangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        marginTop: -2
    },
    calloutContainer: {
        width: 220,
        padding: 8
    },
    calloutTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 6
    },
    calloutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 4
    },
    calloutText: {
        fontSize: 12,
        color: '#6B7280'
    },
    calloutLink: {
        fontSize: 11,
        color: BRAND_COLORS.red,
        marginTop: 6,
        fontWeight: '600'
    },
    footer: {
        backgroundColor: 'white',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB'
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 6
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5
    },
    legendText: {
        fontSize: 12,
        color: '#6B7280'
    },
    footerCount: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        fontWeight: '600'
    }
})
