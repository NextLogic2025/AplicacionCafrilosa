
import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps'
import { BRAND_COLORS } from '../../../../shared/types'
import { ClientService, type ClientBranch, type CommercialZone } from '../../../../services/api/ClientService'
import { ZoneHelpers } from '../../../../services/api/ZoneService'
import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'

// # Definición de tipos de navegación
type RouteParams = {
    ClientDetallesSucursales: {
        branchId: string
    }
}

export function ClientDetallesSucursalesScreen() {
    const navigation = useNavigation()
    const route = useRoute<RouteProp<RouteParams, 'ClientDetallesSucursales'>>()
    const { branchId } = route.params

    const [branch, setBranch] = useState<ClientBranch | null>(null)
    const [zone, setZone] = useState<CommercialZone | null>(null)
    const [loading, setLoading] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)

    // Modal State
    const [modalVisible, setModalVisible] = useState(false)
    const [modalConfig, setModalConfig] = useState<{
        type: FeedbackType
        title: string
        message: string
        showCancel?: boolean
        onConfirm?: () => void
        confirmText?: string
        cancelText?: string
    }>({
        type: 'info',
        title: '',
        message: ''
    })

    // # Cargar detalles de la sucursal y su zona
    useEffect(() => {
        loadData()
    }, [branchId])

    const loadData = async () => {
        try {
            // 1. Obtener detalle fresco de la sucursal (usando endpoint específico para manejar activas/inactivas)
            const branchData = await ClientService.getClientBranchById(branchId)

            if (branchData) {
                setBranch(branchData)

                // 2. Si tiene zona asignada, obtener detalles de la zona (para el polígono)
                if (branchData.zona_id) {
                    try {
                        const zoneData = await ClientService.getCommercialZoneById(branchData.zona_id, true) // silent=true
                        setZone(zoneData)
                    } catch (e) {
                        console.log('No se pudo cargar la zona asociada')
                    }
                }
            }
        } catch (error) {
            console.error('Error loading branch details:', error)
        } finally {
            setLoading(false)
        }
    }

    // # Calcular polígono de la zona para el mapa
    const zonePolygon = useMemo(() => zone ? ZoneHelpers.parsePolygon(zone.poligono_geografico) : [], [zone])

    // # Acción de Desactivar Sucursal
    const handleDeactivate = () => {
        if (!branch) return

        // Configuración del modal para confirmar desactivación
        setModalConfig({
            type: 'warning',
            title: 'Desactivar Sucursal',
            message: '¿Estás seguro de que deseas desactivar esta sucursal? Dejará de aparecer en tus opciones de entrega.',
            showCancel: true,
            confirmText: 'Desactivar',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                setModalVisible(false) // Cerrar modal de confirmación
                setIsProcessing(true)
                try {
                    // Llamada al servicio para desactivar
                    const updated = await ClientService.updateClientBranch(branch.id, { activo: false })
                    setBranch(updated)

                    // Mostrar modal de éxito
                    setTimeout(() => {
                        setModalConfig({
                            type: 'success',
                            title: 'Éxito',
                            message: 'La sucursal ha sido desactivada correctamente.',
                            showCancel: false,
                            onConfirm: () => setModalVisible(false)
                        })
                        setModalVisible(true)
                    }, 300)
                } catch (error) {
                    // Mostrar modal de error
                    setTimeout(() => {
                        setModalConfig({
                            type: 'error',
                            title: 'Error',
                            message: 'No se pudo desactivar la sucursal. Inténtalo de nuevo.',
                            showCancel: false,
                            onConfirm: () => setModalVisible(false)
                        })
                        setModalVisible(true)
                    }, 300)
                } finally {
                    setIsProcessing(false)
                }
            }
        })
        setModalVisible(true)
    }

    // # Acción de Activar Sucursal
    const handleActivate = async () => {
        if (!branch) return

        setIsProcessing(true)
        try {
            const updated = await ClientService.updateClientBranch(branch.id, { activo: true })
            setBranch(updated)
            setModalConfig({
                type: 'success',
                title: 'Éxito',
                message: 'La sucursal ha sido reactivada.',
                showCancel: false,
                onConfirm: () => setModalVisible(false)
            })
            setModalVisible(true)
        } catch (error) {
            setModalConfig({
                type: 'error',
                title: 'Error',
                message: 'No se pudo activar la sucursal.',
                showCancel: false,
                onConfirm: () => setModalVisible(false)
            })
            setModalVisible(true)
        } finally {
            setIsProcessing(false)
        }
    }

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-neutral-50">
                <ActivityIndicator size="large" color={BRAND_COLORS.red} />
            </View>
        )
    }

    if (!branch) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header title="Detalle Sucursal" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 justify-center items-center p-4">
                    <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
                    <Text className="text-neutral-500 mt-4 text-center">No se encontró la información de la sucursal.</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mt-8 bg-neutral-900 px-6 py-3 rounded-xl">
                        <Text className="text-white font-bold">Volver</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    // # Coordenadas para el mapa
    const coordinates = branch.ubicacion_gps ? {
        latitude: branch.ubicacion_gps.coordinates[1],
        longitude: branch.ubicacion_gps.coordinates[0]
    } : {
        latitude: -0.180653,
        longitude: -78.467834
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Detalle Sucursal" variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
                {/* # Mapa Interactivo con Polígono */}
                <View className="h-64 w-full relative bg-neutral-200">
                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={{ width: '100%', height: '100%' }}
                        initialRegion={{
                            ...coordinates,
                            latitudeDelta: 0.008,
                            longitudeDelta: 0.008,
                        }}
                        scrollEnabled={true}  // Habilitar movimiento del mapa por solicitud
                        zoomEnabled={true}    // Permitir zoom
                    >
                        {/* Marcador de la sucursal */}
                        {branch.ubicacion_gps && (
                            <Marker
                                coordinate={coordinates}
                                pinColor={branch.activo ? BRAND_COLORS.red : '#9CA3AF'}
                                title={branch.nombre_sucursal}
                            />
                        )}

                        {/* Polígono de la zona (si existe) */}
                        {zonePolygon.length > 0 && (
                            <Polygon
                                coordinates={zonePolygon}
                                strokeColor={BRAND_COLORS.red}
                                fillColor="rgba(220, 38, 38, 0.05)"
                                strokeWidth={2}
                            />
                        )}
                    </MapView>

                    {/* Badge de Estado */}
                    <View className="absolute top-4 right-4">
                        <View className={`px-3 py-1.5 rounded-full shadow-sm border ${branch.activo ? 'bg-green-100 border-green-200' : 'bg-neutral-100 border-neutral-300'
                            }`}>
                            <Text className={`text-xs font-bold ${branch.activo ? 'text-green-700' : 'text-neutral-600'
                                }`}>
                                {branch.activo ? 'ACTIVO' : 'INACTIVO'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Contenido */}
                <View className="px-4 -mt-6">
                    <View className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 mb-6">
                        {/* Cabecera Info */}
                        <View className="flex-row items-center mb-6">
                            <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 shadow-sm ${branch.activo ? 'bg-red-50' : 'bg-neutral-100'
                                }`}>
                                <Ionicons
                                    name="storefront"
                                    size={28}
                                    color={branch.activo ? BRAND_COLORS.red : '#9CA3AF'}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-2xl font-bold text-neutral-800 leading-tight">
                                    {branch.nombre_sucursal}
                                </Text>
                            </View>
                        </View>

                        <View className="space-y-6">
                            {/* Información de Zona */}
                            {zone && (
                                <View>
                                    <Text className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Zona Comercial</Text>
                                    <View className="flex-row items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
                                        <Ionicons name="map" size={20} color="#2563EB" style={{ marginRight: 10 }} />
                                        <View>
                                            <Text className="text-blue-900 font-bold">{zone.nombre}</Text>
                                            <Text className="text-blue-500 text-xs">{zone.codigo}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Dirección */}
                            <View>
                                <Text className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Información de Entrega</Text>
                                <View className="flex-row items-start bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                                    <Ionicons name="location" size={20} color="#EF4444" style={{ marginTop: 2, marginRight: 10 }} />
                                    <View className="flex-1">
                                        <Text className="text-neutral-500 text-xs mb-0.5">Dirección</Text>
                                        <Text className="text-neutral-800 text-base font-medium leading-6">{branch.direccion_entrega}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Contactos */}
                            <View>
                                <Text className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Detalles de Contacto</Text>
                                <View className="bg-neutral-50 rounded-xl border border-neutral-100 overflow-hidden">
                                    <View className="flex-row items-center p-3 border-b border-neutral-100">
                                        <Ionicons name="person" size={16} color="#4B5563" style={{ marginRight: 12 }} />
                                        <View>
                                            <Text className="text-neutral-500 text-xs">Persona de Contacto</Text>
                                            <Text className="text-neutral-800 font-medium">{branch.contacto_nombre || 'No registrado'}</Text>
                                        </View>
                                    </View>
                                    <View className="flex-row items-center p-3">
                                        <Ionicons name="call" size={16} color="#4B5563" style={{ marginRight: 12 }} />
                                        <View>
                                            <Text className="text-neutral-500 text-xs">Teléfono</Text>
                                            <Text className="text-neutral-800 font-medium">{branch.contacto_telefono || 'No registrado'}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* # Botón de Acción (Editar y Desactivar/Activar) */}
                        <View className="mt-8 pt-6 border-t border-neutral-100">
                            {branch.activo && (
                                <TouchableOpacity
                                    onPress={() => (navigation as any).navigate('CrearClienteSucursales', { branchId: branch.id })}
                                    className="flex-row items-center justify-center bg-red-600 p-4 rounded-xl shadow-md active:bg-red-700 mb-6"
                                >
                                    <Ionicons name="pencil" size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text className="text-white font-bold">Editar Sucursal</Text>
                                </TouchableOpacity>
                            )}
                            {branch.activo ? (
                                <TouchableOpacity
                                    onPress={handleDeactivate}
                                    disabled={isProcessing}
                                    className="flex-row items-center justify-center bg-white border border-red-200 p-4 rounded-xl shadow-sm active:bg-red-50"
                                >
                                    {isProcessing ? (
                                        <ActivityIndicator color={BRAND_COLORS.red} />
                                    ) : (
                                        <>
                                            <Ionicons name="close-circle-outline" size={20} color={BRAND_COLORS.red} style={{ marginRight: 8 }} />
                                            <Text className="text-red-600 font-bold">Desactivar Sucursal</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={handleActivate}
                                    disabled={isProcessing}
                                    className="flex-row items-center justify-center bg-neutral-900 p-4 rounded-xl shadow-md active:bg-neutral-800"
                                >
                                    {isProcessing ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Ionicons name="refresh-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />
                                            <Text className="text-white font-bold">Reactivar Sucursal</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}

                            <Text className="text-center text-neutral-400 text-xs mt-3 px-4 leading-4">
                                {branch.activo
                                    ? "Al desactivar la sucursal, no podrás seleccionarla para nuevos pedidos."
                                    : "Reactiva la sucursal para volver a utilizarla en tus pedidos."
                                }
                            </Text>
                        </View>

                    </View>
                </View>
            </ScrollView>
            <FeedbackModal
                visible={modalVisible}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                onClose={() => setModalVisible(false)}
                showCancel={modalConfig.showCancel}
                onConfirm={modalConfig.onConfirm}
                confirmText={modalConfig.confirmText}
                cancelText={modalConfig.cancelText}
            />
        </View>
    )
}
