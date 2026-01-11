import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native'
import MapView, { Polygon, Marker, PROVIDER_GOOGLE, MapPressEvent } from 'react-native-maps'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../../components/ui/Header'
import { ZoneService, Zone, ZoneHelpers, LatLng, ZoneEditState } from '../../../../services/api/ZoneService'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { AssignmentService } from '../../../../services/api/AssignmentService'
import { UserService } from '../../../../services/api/UserService'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'

// Extended Zone interface for map display
interface ZoneWithVendor extends Zone {
    vendorName?: string
}

export function SupervisorZoneMapScreen() {
    const navigation = useNavigation()
    const route = useRoute<any>()

    // Simple Params
    const mode = route.params?.mode || 'view'
    const isEditMode = mode === 'edit'

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

    // Initial Region (Loja, Ecuador)
    const [region, setRegion] = useState({
        latitude: -3.99313,
        longitude: -79.20422,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05
    })

    // --- 1. Initial Load ---
    useEffect(() => {
        loadMapData()
    }, [])

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
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={{ flex: 1, width: Dimensions.get('window').width }}
                    initialRegion={region}
                    showsUserLocation={false} /* Disabled as requested */
                    showsMyLocationButton={false}
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
