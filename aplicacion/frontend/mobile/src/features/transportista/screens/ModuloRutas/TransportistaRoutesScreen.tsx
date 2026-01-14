import { useFocusEffect, useNavigation } from '@react-navigation/native'
import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../shared/types'

import { Header } from '../../../../components/ui/Header'
import { GenericList } from '../../../../components/ui/GenericList'
import { TransportistaService, type Route } from '../../../../services/api/TransportistaService'

export function TransportistaRoutesScreen() {
    const navigation = useNavigation()
    const [routes, setRoutes] = useState<Route[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadRoutes = async () => {
        try {
            setIsLoading(true)
            const data = await TransportistaService.getRoutes()
            setRoutes(data)
        } catch (error) {
            console.error('Error loading routes', error)
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(useCallback(() => { loadRoutes() }, []))

    const handleStartRoute = (routeId: string) => {
        Alert.alert('Iniciar Ruta', '¿Estás seguro de iniciar esta ruta? Se notificará a los clientes.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Iniciar', onPress: () => console.log('Starting route', routeId) }
        ])
    }

    const renderItem = (route: Route) => (
        <View className="bg-white rounded-xl border border-neutral-200 mb-4 overflow-hidden shadow-sm">
            {/* Map Placeholder */}
            <View className="h-32 bg-neutral-100 items-center justify-center border-b border-neutral-100">
                <Ionicons name="map" size={48} color="#9CA3AF" />
                <Text className="text-neutral-400 text-xs mt-2">Visualización de Mapa</Text>
            </View>

            <View className="p-4">
                <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-lg font-bold text-neutral-900">{route.name}</Text>
                    {route.status === 'active' ? (
                        <View className="bg-green-100 px-2 py-1 rounded">
                            <Text className="text-green-700 text-xs font-bold">EN CURSO</Text>
                        </View>
                    ) : (
                        <View className="bg-neutral-100 px-2 py-1 rounded">
                            <Text className="text-neutral-600 text-xs font-bold">PENDIENTE</Text>
                        </View>
                    )}
                </View>

                <View className="flex-row gap-4 mb-4">
                    <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={16} color="gray" />
                        <Text className="text-sm text-neutral-600 ml-1">{route.estimatedDuration} min</Text>
                    </View>
                    <View className="flex-row items-center">
                        <Ionicons name="navigate-outline" size={16} color="gray" />
                        <Text className="text-sm text-neutral-600 ml-1">{route.distance} km</Text>
                    </View>
                </View>

                {/* Stops / Deliveries Preview */}
                <View className="mb-4">
                    <Text className="text-xs font-bold text-neutral-500 mb-2 uppercase">Orden de Paradas Sugerido</Text>
                    {route.deliveries.length > 0 ? (
                        route.deliveries.map((delivery, index) => (
                            <View key={delivery.id} className="flex-row items-center mb-2">
                                <View className="w-6 h-6 bg-brand-red rounded-full items-center justify-center mr-2">
                                    <Text className="text-white text-xs font-bold">{index + 1}</Text>
                                </View>
                                <Text className="text-neutral-800 flex-1" numberOfLines={1}>{delivery.clientName}</Text>
                            </View>
                        ))
                    ) : (
                        <Text className="text-neutral-400 text-sm italic">No hay paradas asignadas.</Text>
                    )}
                </View>

                {route.status !== 'active' && route.deliveries.length > 0 && (
                    <TouchableOpacity
                        className="bg-brand-red py-3 rounded-xl flex-row justify-center items-center"
                        onPress={() => handleStartRoute(route.id)}
                    >
                        <Ionicons name="play" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold">Iniciar Ruta</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title="Mis Rutas"
                variant="standard"
                showNotification={false}
                onBackPress={() => navigation.goBack()}
            />
            <GenericList
                items={routes}
                isLoading={isLoading}
                onRefresh={loadRoutes}
                renderItem={renderItem}
                emptyState={{
                    icon: 'map-outline',
                    title: 'Sin Rutas Asignadas',
                    message: 'No tienes rutas programadas para hoy.'
                }}
            />
        </View>
    )
}
