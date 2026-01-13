
import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { ClientService, type ClientBranch } from '../../../../services/api/ClientService'
import { Header } from '../../../../components/ui/Header'

const { width } = Dimensions.get('window')

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
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadBranchDetails()
    }, [branchId])

    const loadBranchDetails = async () => {
        try {
            // Note: We might not have a direct endpoint for getBranchById in ClientService for CLIENT role 
            // if it's nested under cliente/id/sucursales.
            // But usually getClientBranches returns everything. 
            // Or we can filter from list if no direct ID endpoint. 
            // However, let's assume valid data retrieval. 
            // If getClientBranches is the only way, we must fetch all and find.
            // Creating a helper here to reuse getClientBranches logic since we don't have api/sucursales/:id exposed yet maybe?
            // Let's assume we can fetch all and find one for safety.
            const clientData = await ClientService.getMyClientData()
            if (clientData) {
                const branches = await ClientService.getClientBranches(clientData.id)
                const found = branches.find(b => b.id === branchId)
                setBranch(found || null)
            }
        } catch (error) {
            console.error('Error loading branch:', error)
        } finally {
            setLoading(false)
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

    // Default coordinates if branch has no GPS (fallback)
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

            <ScrollView className="flex-1">
                {/* Map Header */}
                <View className="h-64 w-full relative">
                    {branch.ubicacion_gps ? (
                        <MapView
                            provider={PROVIDER_GOOGLE}
                            style={{ width: '100%', height: '100%' }}
                            initialRegion={{
                                ...coordinates,
                                latitudeDelta: 0.005,
                                longitudeDelta: 0.005,
                            }}
                            scrollEnabled={false}
                            zoomEnabled={false}
                            rotateEnabled={false}
                            pitchEnabled={false}
                        >
                            <Marker
                                coordinate={coordinates}
                                pinColor={BRAND_COLORS.red}
                            />
                        </MapView>
                    ) : (
                        <View className="w-full h-full bg-neutral-200 items-center justify-center">
                            <Ionicons name="map-outline" size={48} color="#9CA3AF" />
                            <Text className="text-neutral-500 mt-2 font-medium">Sin ubicación GPS</Text>
                        </View>
                    )}

                    {/* Status Badge Overlay */}
                    <View className="absolute top-4 right-4">
                        <View className={`px - 3 py - 1.5 rounded - full shadow - sm border ${branch.activo ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'} `}>
                            <Text className={`text - xs font - bold ${branch.activo ? 'text-green-700' : 'text-red-700'} `}>
                                {branch.activo ? 'ACTIVO' : 'INACTIVO'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Content */}
                <View className="px-4 -mt-6">
                    <View className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 mb-6">
                        <View className="flex-row items-center mb-6">
                            <View className="w-14 h-14 bg-red-50 rounded-2xl items-center justify-center mr-4 shadow-sm">
                                <Ionicons name="storefront" size={28} color={BRAND_COLORS.red} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-2xl font-bold text-neutral-800 leading-tight">{branch.nombre_sucursal}</Text>
                                <Text className="text-neutral-400 text-sm mt-1">ID: {branch.id.slice(0, 8)}...</Text>
                            </View>
                        </View>

                        <View className="space-y-6">
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

                            <View>
                                <Text className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Detalles de Contacto</Text>
                                <View className="bg-neutral-50 rounded-xl border border-neutral-100 overflow-hidden">
                                    <View className="flex-row items-center p-3 border-b border-neutral-100">
                                        <View className="w-8 h-8 rounded-full bg-white items-center justify-center mr-3 shadow-sm">
                                            <Ionicons name="person" size={16} color="#4B5563" />
                                        </View>
                                        <View>
                                            <Text className="text-neutral-500 text-xs">Persona de Contacto</Text>
                                            <Text className="text-neutral-800 font-medium">{branch.contacto_nombre || 'No registrado'}</Text>
                                        </View>
                                    </View>
                                    <View className="flex-row items-center p-3">
                                        <View className="w-8 h-8 rounded-full bg-white items-center justify-center mr-3 shadow-sm">
                                            <Ionicons name="call" size={16} color="#4B5563" />
                                        </View>
                                        <View>
                                            <Text className="text-neutral-500 text-xs">Teléfono</Text>
                                            <Text className="text-neutral-800 font-medium">{branch.contacto_telefono || 'No registrado'}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {branch.ubicacion_gps && (
                                <View>
                                    <Text className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Datos Técnicos</Text>
                                    <View className="flex-row gap-3">
                                        <View className="flex-1 bg-neutral-50 p-2 rounded-lg border border-neutral-100 items-center">
                                            <Text className="text-neutral-400 text-[10px] uppercase">Latitud</Text>
                                            <Text className="text-neutral-800 font-mono text-xs">{branch.ubicacion_gps.coordinates[1].toFixed(5)}</Text>
                                        </View>
                                        <View className="flex-1 bg-neutral-50 p-2 rounded-lg border border-neutral-100 items-center">
                                            <Text className="text-neutral-400 text-[10px] uppercase">Longitud</Text>
                                            <Text className="text-neutral-800 font-mono text-xs">{branch.ubicacion_gps.coordinates[0].toFixed(5)}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}
