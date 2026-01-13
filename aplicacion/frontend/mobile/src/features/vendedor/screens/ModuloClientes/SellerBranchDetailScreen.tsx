import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, Alert, Linking, RefreshControl } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Header } from '../../../../components/ui/Header'
import { LoadingScreen } from '../../../../components/ui/LoadingScreen'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { ClientService, type ClientBranch } from '../../../../services/api/ClientService'

/**
 * SellerBranchDetailScreen - Detalle de Sucursal
 * 
 * Muestra información completa de una sucursal:
 * - Nombre y estado
 * - Dirección de entrega
 * - Contacto (nombre y teléfono)
 * - Ubicación GPS (con botón para navegar)
 * - Zona comercial
 */
export function SellerBranchDetailScreen() {
    const navigation = useNavigation()
    const route = useRoute()
    // @ts-ignore
    const { branch: branchParam, clientName } = route.params || {}

    const [branch, setBranch] = useState<ClientBranch | null>(branchParam || null)
    const [refreshing, setRefreshing] = useState(false)
    const [zoneName, setZoneName] = useState<string>('')

    useEffect(() => {
        if (branchParam) {
            setBranch(branchParam)
            loadZoneName(branchParam.zona_id)
        }
    }, [branchParam])

    const loadZoneName = async (zonaId?: number) => {
        if (!zonaId) return
        try {
            const zones = await ClientService.getCommercialZones()
            const zone = zones.find(z => z.id === zonaId)
            setZoneName(zone?.nombre || '')
        } catch (error) {
            console.error('Error loading zone:', error)
        }
    }

    const handleRefresh = () => {
        setRefreshing(true)
        // Como recibimos la sucursal por params, solo recargamos la zona
        if (branch?.zona_id) {
            loadZoneName(branch.zona_id)
        }
        setRefreshing(false)
    }

    const openMap = (lat: number, lng: number, name: string) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir el mapa'))
    }

    const makeCall = (phone: string) => {
        Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Error', 'No se pudo realizar la llamada'))
    }

    if (!branch) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header title="Detalle Sucursal" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 items-center justify-center p-8">
                    <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
                    <Text className="text-lg font-semibold text-neutral-600 mt-4">Sucursal no encontrada</Text>
                </View>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header 
                title="Detalle Sucursal" 
                variant="standard" 
                onBackPress={() => navigation.goBack()} 
            />

            <ScrollView 
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[BRAND_COLORS.red]}
                        tintColor={BRAND_COLORS.red}
                    />
                }
            >
                {/* Header Card - Información Principal */}
                <View className="bg-white m-4 rounded-2xl border border-neutral-100 overflow-hidden" style={{ elevation: 2 }}>
                    {/* Encabezado */}
                    <View className="p-5 border-b border-neutral-100">
                        <View className="flex-row items-start justify-between">
                            <View className="flex-row items-center flex-1 mr-3">
                                <View className="w-14 h-14 rounded-xl bg-blue-50 items-center justify-center mr-4">
                                    <Ionicons name="storefront" size={28} color="#2563EB" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-lg font-bold text-neutral-900" numberOfLines={2}>
                                        {branch.nombre_sucursal}
                                    </Text>
                                    {clientName && (
                                        <Text className="text-sm text-neutral-500 mt-0.5">
                                            {clientName}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <StatusBadge
                                label={branch.activo ? 'Activa' : 'Inactiva'}
                                variant={branch.activo ? 'success' : 'neutral'}
                                icon={branch.activo ? 'checkmark-circle' : 'close-circle'}
                            />
                        </View>
                    </View>

                    {/* Información de ubicación */}
                    <View className="p-5">
                        {/* Dirección */}
                        {branch.direccion_entrega && (
                            <View className="flex-row items-start mb-4">
                                <View className="w-10 h-10 rounded-lg bg-neutral-100 items-center justify-center mr-3">
                                    <Ionicons name="location" size={20} color="#6B7280" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs text-neutral-500 font-semibold uppercase mb-1">Dirección de Entrega</Text>
                                    <Text className="text-sm text-neutral-900">{branch.direccion_entrega}</Text>
                                </View>
                            </View>
                        )}

                        {/* Zona */}
                        {(branch.zona_id || zoneName) && (
                            <View className="flex-row items-start mb-4">
                                <View className="w-10 h-10 rounded-lg bg-neutral-100 items-center justify-center mr-3">
                                    <Ionicons name="map" size={20} color="#6B7280" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs text-neutral-500 font-semibold uppercase mb-1">Zona Comercial</Text>
                                    <Text className="text-sm text-neutral-900">{zoneName || `Zona ${branch.zona_id}`}</Text>
                                </View>
                            </View>
                        )}

                        {/* Fecha de creación */}
                        {branch.created_at && (
                            <View className="flex-row items-start">
                                <View className="w-10 h-10 rounded-lg bg-neutral-100 items-center justify-center mr-3">
                                    <Ionicons name="calendar" size={20} color="#6B7280" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs text-neutral-500 font-semibold uppercase mb-1">Registrada</Text>
                                    <Text className="text-sm text-neutral-900">
                                        {new Date(branch.created_at).toLocaleDateString('es-EC', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Información de Contacto */}
                {(branch.contacto_nombre || branch.contacto_telefono) && (
                    <View className="bg-white mx-4 mb-4 rounded-2xl border border-neutral-100 overflow-hidden" style={{ elevation: 2 }}>
                        <View className="p-4 border-b border-neutral-100 bg-neutral-50">
                            <Text className="text-sm font-bold text-neutral-900">Información de Contacto</Text>
                        </View>
                        <View className="p-5">
                            {/* Nombre del contacto */}
                            {branch.contacto_nombre && (
                                <View className="flex-row items-center mb-4">
                                    <View className="w-10 h-10 rounded-lg bg-green-50 items-center justify-center mr-3">
                                        <Ionicons name="person" size={20} color="#10B981" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-xs text-neutral-500 font-semibold uppercase mb-1">Nombre</Text>
                                        <Text className="text-base font-semibold text-neutral-900">{branch.contacto_nombre}</Text>
                                    </View>
                                </View>
                            )}

                            {/* Teléfono del contacto */}
                            {branch.contacto_telefono && (
                                <Pressable 
                                    className="flex-row items-center active:bg-neutral-50 -mx-2 px-2 py-2 rounded-xl"
                                    onPress={() => makeCall(branch.contacto_telefono!)}
                                >
                                    <View className="w-10 h-10 rounded-lg bg-blue-50 items-center justify-center mr-3">
                                        <Ionicons name="call" size={20} color="#2563EB" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-xs text-neutral-500 font-semibold uppercase mb-1">Teléfono</Text>
                                        <Text className="text-base font-semibold text-blue-600">{branch.contacto_telefono}</Text>
                                    </View>
                                    <View className="bg-blue-50 p-2 rounded-lg">
                                        <Ionicons name="call-outline" size={18} color="#2563EB" />
                                    </View>
                                </Pressable>
                            )}
                        </View>
                    </View>
                )}

                {/* Botones de Acción */}
                <View className="px-4 gap-3">
                    {/* Botón Cómo Llegar */}
                    {branch.ubicacion_gps?.coordinates && (
                        <Pressable
                            className="bg-red-600 p-4 rounded-xl flex-row items-center justify-center active:bg-red-700"
                            style={{ elevation: 2 }}
                            onPress={() => {
                                const [lng, lat] = branch.ubicacion_gps!.coordinates
                                openMap(lat, lng, branch.nombre_sucursal)
                            }}
                        >
                            <Ionicons name="navigate" size={20} color="white" />
                            <Text className="text-white font-bold ml-2">Cómo Llegar</Text>
                        </Pressable>
                    )}

                    {/* Botón Llamar */}
                    {branch.contacto_telefono && (
                        <Pressable
                            className="bg-white p-4 rounded-xl flex-row items-center justify-center border border-neutral-200 active:bg-neutral-50"
                            style={{ elevation: 1 }}
                            onPress={() => makeCall(branch.contacto_telefono!)}
                        >
                            <Ionicons name="call" size={20} color={BRAND_COLORS.red} />
                            <Text className="text-red-600 font-bold ml-2">Llamar a {branch.contacto_nombre || 'Contacto'}</Text>
                        </Pressable>
                    )}
                </View>

                {/* Info adicional si no hay ubicación ni contacto */}
                {!branch.ubicacion_gps?.coordinates && !branch.contacto_telefono && !branch.contacto_nombre && (
                    <View className="mx-4 mt-4 p-6 bg-neutral-100 rounded-xl items-center">
                        <Ionicons name="information-circle-outline" size={40} color="#9CA3AF" />
                        <Text className="text-sm text-neutral-500 text-center mt-2">
                            Esta sucursal no tiene información de contacto o ubicación registrada
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    )
}
