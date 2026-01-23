import React, { useState, useEffect, useRef, useMemo } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native'
import MapView, { Polygon, Marker, PROVIDER_GOOGLE, MapPressEvent } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../../components/ui/Header'
import { ZoneService, Zone, ZoneHelpers, LatLng, ZoneEditState } from '../../../../services/api/ZoneService'
import { BRAND_COLORS } from '../../../../shared/types'
import { AssignmentService } from '../../../../services/api/AssignmentService'
import { UserService } from '../../../../services/api/UserService'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { ECUADOR_LOCATIONS } from '../../../../data/ecuadorLocations'
import { GenericModal } from '../../../../components/ui/GenericModal'
import { GenericList } from '../../../../components/ui/GenericList'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { SupervisorZoneStackParamList } from './zoneStack.types'

// Extended Zone interface for map display
interface ZoneWithVendor extends Zone {
    vendorName?: string
}

type Props = NativeStackScreenProps<SupervisorZoneStackParamList, 'SupervisorZoneMap'>

export function SupervisorZoneMapScreen({ navigation, route }: Props) {
    // Simple Params
    const mode = route.params?.mode || 'view'
    const isEditMode = mode === 'edit'
    const centerHint = route.params?.centerHint as LatLng | undefined

    const [loading, setLoading] = useState(false)

    // Map Data
    const [zones, setZones] = useState<ZoneWithVendor[]>([])

    // Edit State (initialized from Shared Object)
    const [currentPolygon, setCurrentPolygon] = useState<LatLng[]>(() => {
        if (isEditMode && ZoneEditState.tempPolygon) {
            return ZoneEditState.tempPolygon
        }
        return []
    })

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean
        type: FeedbackType
        title: string
        message: string
        showCancel?: boolean
        onConfirm?: () => void
        confirmText?: string
        cancelText?: string
    }>({
        visible: false,
        type: 'info',
        title: '',
        message: ''
    })

    const showModal = (
        type: FeedbackType,
        title: string,
        message: string,
        onConfirm?: () => void,
        showCancel = false
    ) => {
        setModalConfig({
            visible: true,
            type,
            title,
            message,
            onConfirm: () => {
                setModalConfig(prev => ({ ...prev, visible: false }))
                if (onConfirm) onConfirm()
            },
            showCancel,
            confirmText: showCancel ? 'Aceptar' : 'Entendido',
            cancelText: 'Cancelar'
        })
    }

    // Track ID to filter from ghost view
    const editingZoneId = (isEditMode && ZoneEditState.editingZoneId) ? ZoneEditState.editingZoneId : null

    const mapRef = useRef<MapView>(null)

    const defaultRegion = { latitude: -3.99313, longitude: -79.20422, latitudeDelta: 0.05, longitudeDelta: 0.05 }

    // Initial Region (Loja by default, overridden by selection)
    const [region, setRegion] = useState(() => {
        const base = centerHint || defaultRegion
        return {
            latitude: base.latitude ?? defaultRegion.latitude,
            longitude: base.longitude ?? defaultRegion.longitude,
            latitudeDelta: base.latitudeDelta ?? defaultRegion.latitudeDelta,
            longitudeDelta: base.longitudeDelta ?? defaultRegion.longitudeDelta
        }
    })

    const [selectedProvince, setSelectedProvince] = useState<string>('Loja')
    const [selectedCity, setSelectedCity] = useState<string>('Loja')
    const availableCities = useMemo(
        () => (ECUADOR_LOCATIONS.find(p => p.province === selectedProvince)?.cities || []),
        [selectedProvince]
    )
    const [showProvinceModal, setShowProvinceModal] = useState(false)
    const [showCityModal, setShowCityModal] = useState(false)

    // --- 1. Initial Load ---
    useEffect(() => { loadMapData() }, [])
    useEffect(() => {
        const unsub = navigation.addListener('focus', loadMapData)
        return unsub
    }, [navigation])

    // --- 2. Load Data ---
    const loadMapData = async () => {
        setLoading(true)
        try {
            const [allZones, allAssignments, allVendors] = await Promise.all([
                ZoneService.getZones(),
                AssignmentService.getAllAssignments(),
                UserService.getVendors()
            ])

            // Map assignments
            const mappedZones = allZones
                .filter(z => z.activo) // Verify it is active
                .map(z => {
                    const assignment = allAssignments.find(a =>
                        Number(a.zona_id) === z.id &&
                        (a.es_principal === true || String(a.es_principal) === 'true') &&
                        !a.fecha_fin
                    )

                    let vendorName = 'Sin Asignar'
                    if (assignment) {
                        const vendor = allVendors.find(v => v.id === assignment.vendedor_usuario_id)
                        vendorName = vendor ? vendor.name : (assignment.nombre_vendedor_cache || `Id: ${assignment.vendedor_usuario_id}`)
                    }

                    return { ...z, vendorName }
                })
            setZones(mappedZones)

            // If we have an initial polygon, center on it
            if (isEditMode && ZoneEditState.tempPolygon && ZoneEditState.tempPolygon.length > 0) {
                const first = ZoneEditState.tempPolygon[0]
                setRegion({
                    latitude: first.latitude,
                    longitude: first.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02
                })
            } else if (centerHint) {
                const safeHint = {
                    latitude: centerHint.latitude ?? defaultRegion.latitude,
                    longitude: centerHint.longitude ?? defaultRegion.longitude,
                    latitudeDelta: 0.04,
                    longitudeDelta: 0.04
                }
                setRegion(safeHint)
                if (mapRef.current) {
                    mapRef.current.animateToRegion(safeHint, 300)
                }
            }

        } catch (error) {
            console.error('Map Data Error', error)
            showModal('error', 'Error', 'No se pudieron cargar los datos del mapa.')
        } finally {
            setLoading(false)
        }
    }

    // --- 3. Map Controls ---

    const handleMapPress = (e: MapPressEvent) => {
        if (!isEditMode) return
        const newCoord = e.nativeEvent.coordinate
        setCurrentPolygon(prev => [...prev, newCoord])
    }

    const handleUndo = () => setCurrentPolygon(prev => prev.slice(0, -1))

    const handleClearLocal = () => setCurrentPolygon([])

    const handleSave = () => {
        if (currentPolygon.length < 3) {
            showModal('warning', 'Polígono Incompleto', 'Se requieren al menos 3 puntos para conformar una zona cerrada.')
            return
        }
        ZoneEditState.tempPolygon = currentPolygon
        ZoneEditState.editingZoneId = null
        navigation.goBack()
    }

    const goToRegion = (lat: number, lng: number) => {
        const target = { latitude: lat, longitude: lng, latitudeDelta: 0.04, longitudeDelta: 0.04 }
        setRegion(target)
        mapRef.current?.animateToRegion(target, 300)
    }

    const handleSelectProvince = (province: string) => {
        setSelectedProvince(province)
        const cities = ECUADOR_LOCATIONS.find(p => p.province === province)?.cities || []
        const firstCity = cities[0]
        if (firstCity) {
            setSelectedCity(firstCity.name)
            goToRegion(firstCity.lat, firstCity.lng)
        }
        setShowProvinceModal(false)
    }

    const handleSelectCity = (name: string) => {
        const city = availableCities.find(c => c.name === name)
        setSelectedCity(name)
        if (city) goToRegion(city.lat, city.lng)
        setShowCityModal(false)
    }

    const handleDeleteFromDB = () => {
        showModal(
            'warning',
            'Limpiar Zona Real',
            '¿Estás seguro? Esta acción borrará el dibujo de la zona DIRECTAMENTE en la base de datos.',
            async () => {
                try {
                    setLoading(true)
                    if (editingZoneId) {
                        await ZoneService.updateZone(editingZoneId, { poligono_geografico: null })
                        setCurrentPolygon([])
                        ZoneEditState.tempPolygon = []

                        setTimeout(() => {
                            showModal('success', 'Éxito', 'Dibujo eliminado de la base de datos.')
                        }, 500)
                    }
                } catch (error) {
                    showModal('error', 'Error', 'No se pudo eliminar el dibujo.')
                } finally {
                    setLoading(false)
                }
            },
            true
        )
    }

    // --- Render ---
    return (
        <View className="flex-1 bg-white">
            <Header
                title={isEditMode ? 'Editando Zona' : 'Mapa General'}
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            <View className="flex-1 relative">
                <View className="absolute top-3 left-4 right-4 z-30 bg-white rounded-2xl shadow-md border border-neutral-100 px-3 py-2 flex-row items-center gap-2">
                    <TouchableOpacity
                        onPress={() => setShowProvinceModal(true)}
                        className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 flex-row items-center justify-between"
                    >
                        <Text className="font-semibold text-neutral-800" numberOfLines={1}>{selectedProvince}</Text>
                        <Ionicons name="chevron-down" size={16} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setShowCityModal(true)}
                        className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 flex-row items-center justify-between"
                    >
                        <Text className="font-semibold text-neutral-800" numberOfLines={1}>{selectedCity}</Text>
                        <Ionicons name="chevron-down" size={16} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={{ flex: 1, width: Dimensions.get('window').width }}
                    initialRegion={region}
                    region={region}
                    showsUserLocation={false} /* Disabled as requested */
                    showsMyLocationButton={false}
                    onRegionChangeComplete={setRegion}
                    onPress={handleMapPress}
                    mapType="standard"
                    userInterfaceStyle="light"
                    customMapStyle={[]}
                    loadingEnabled={false}
                >
                    {/* 1. Ghost Zones */}
                    {zones.map((z, i) => {
                        if (isEditMode && editingZoneId && z.id === editingZoneId) return null

                        const coords = ZoneHelpers.parsePolygon(z.poligono_geografico)
                        if (coords.length === 0) return null

                        const isGhost = isEditMode
                        const stroke = isGhost ? '#D4AF37' : BRAND_COLORS.red
                        const fill = isGhost ? 'rgba(212, 175, 55, 0.2)' : 'rgba(239, 68, 68, 0.25)'

                        return (
                            <Polygon
                                key={`zone-${z.id}-${i}`}
                                coordinates={coords}
                                strokeColor={stroke}
                                fillColor={fill}
                                strokeWidth={isGhost ? 1 : 2}
                                zIndex={1}
                                tappable={!isEditMode}
                                onPress={() => {
                                    if (!isEditMode) {
                                        showModal('info', z.nombre, `\nResponsable Actual:\n${z.vendorName}`)
                                    }
                                }}
                            />
                        )
                    })}

                    {/* 2. Current Polygon */}
                    {isEditMode && currentPolygon.length > 0 && (
                        <>
                            <Polygon
                                coordinates={currentPolygon}
                                strokeColor="#2563EB"
                                fillColor="rgba(37, 99, 235, 0.25)"
                                strokeWidth={3}
                                zIndex={10}
                            />
                            {currentPolygon.map((p, idx) => (
                                <Marker
                                    key={`pt-${idx}`}
                                    coordinate={p}
                                    anchor={{ x: 0.5, y: 0.5 }}
                                >
                                    <View className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white" />
                                </Marker>
                            ))}
                        </>
                    )}
                </MapView>

                {/* Edit Controls */}
                {isEditMode && (
                    <View className="absolute bottom-6 left-4 right-4 bg-white p-4 rounded-3xl shadow-xl flex-col z-20 border border-neutral-100">
                        <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={handleUndo}
                                    disabled={currentPolygon.length === 0}
                                    className="w-12 h-12 bg-neutral-100 rounded-full items-center justify-center"
                                >
                                    <Ionicons name="arrow-undo" size={24} color={currentPolygon.length === 0 ? "#9CA3AF" : "#4B5563"} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        if (editingZoneId) {
                                            handleDeleteFromDB()
                                        } else {
                                            handleClearLocal()
                                        }
                                    }}
                                    disabled={currentPolygon.length === 0 && !editingZoneId}
                                    className="w-12 h-12 bg-red-50 rounded-full items-center justify-center border border-red-100"
                                >
                                    <Ionicons name="trash-outline" size={24} color="#EF4444" />
                                </TouchableOpacity>
                            </View>

                            <View className="flex-1 items-end">
                                <TouchableOpacity
                                    onPress={handleSave}
                                    className="bg-blue-600 px-6 py-3 rounded-2xl shadow-blue-200 shadow-lg"
                                >
                                    <Text className="text-white font-bold text-base">Guardar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="flex-row justify-between items-center px-1">
                            <Text className="text-xs text-neutral-400 font-medium">
                                Puntos: {currentPolygon.length}
                            </Text>

                            {editingZoneId ? (
                                <Text className="text-xs text-red-400 font-medium">Zona Existente</Text>
                            ) : (
                                <Text className="text-xs text-blue-400 font-medium">Nueva Zona</Text>
                            )}
                        </View>
                    </View>
                )}

                {loading && (
                    <View className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-sm z-50">
                        <ActivityIndicator size="small" color={BRAND_COLORS.red} />
                    </View>
                )}

                <GenericModal visible={showProvinceModal} title="Provincia" onClose={() => setShowProvinceModal(false)}>
                    <View className="h-80">
                        <GenericList
                            items={ECUADOR_LOCATIONS}
                            isLoading={false}
                            onRefresh={() => { }}
                            renderItem={(item) => {
                                const isSelected = item.province === selectedProvince
                                return (
                                    <TouchableOpacity
                                        className={`p-3 mb-2 rounded-xl flex-row items-center justify-between border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-neutral-100'}`}
                                        onPress={() => handleSelectProvince(item.province)}
                                    >
                                        <Text className={`font-bold ${isSelected ? 'text-blue-900' : 'text-neutral-800'}`}>{item.province}</Text>
                                        {isSelected && <Ionicons name="checkmark-circle" size={22} color="#2563EB" />}
                                    </TouchableOpacity>
                                )
                            }}
                            emptyState={{ icon: 'map', title: 'Sin provincias', message: 'No hay provincias cargadas.' }}
                        />
                    </View>
                </GenericModal>

                <GenericModal visible={showCityModal} title={`Ciudades de ${selectedProvince}`} onClose={() => setShowCityModal(false)}>
                    <View className="h-80">
                        <GenericList
                            items={availableCities}
                            isLoading={false}
                            onRefresh={() => { }}
                            renderItem={(city) => {
                                const isSelected = city.name === selectedCity
                                return (
                                    <TouchableOpacity
                                        className={`p-3 mb-2 rounded-xl flex-row items-center justify-between border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-neutral-100'}`}
                                        onPress={() => handleSelectCity(city.name)}
                                    >
                                        <View>
                                            <Text className={`font-bold ${isSelected ? 'text-blue-900' : 'text-neutral-800'}`}>{city.name}</Text>
                                            <Text className="text-xs text-neutral-500">Lat {city.lat.toFixed(3)} · Lng {city.lng.toFixed(3)}</Text>
                                        </View>
                                        {isSelected && <Ionicons name="checkmark-circle" size={22} color="#2563EB" />}
                                    </TouchableOpacity>
                                )
                            }}
                            emptyState={{ icon: 'location', title: 'Sin ciudades', message: 'Selecciona una provincia.' }}
                        />
                    </View>
                </GenericModal>

                <FeedbackModal
                    visible={modalConfig.visible}
                    type={modalConfig.type}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                    onConfirm={modalConfig.onConfirm}
                    confirmText={modalConfig.confirmText}
                    cancelText={modalConfig.cancelText}
                    showCancel={modalConfig.showCancel}
                />
            </View>
        </View>
    )
}
