import { useFocusEffect } from '@react-navigation/native'
import * as React from 'react'
import { View, Text } from 'react-native'

import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'
import { DeliveryCard } from '../../../components/ui/DeliveryCard'
import { TransportistaService, type Delivery } from '../../../services/api/TransportistaService'
import { type Order } from '../../../services/api/OrderService'

/**
 * Transportista Orders Screen
 * Shows all orders assigned to the delivery driver
 */
export function TransportistaOrdersScreen() {
    const [orders, setOrders] = React.useState<Order[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    /**
     * Load orders from API
     */
    const loadOrders = async () => {
        try {
            setIsLoading(true)
            const data = await TransportistaService.getOrders()
            setOrders(data)
        } catch (error) {
            console.error('Error loading orders:', error)
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Load orders on screen focus
     */
    useFocusEffect(
        React.useCallback(() => {
            loadOrders()
        }, [])
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                userName="Transportista"
                role="TRANSPORTISTA"
                showNotification={false}
                variant="default"
            />

            <GenericList
                items={orders}
                isLoading={isLoading}
                onRefresh={loadOrders}
                renderItem={(order) => (
                    <View className="bg-white p-4 rounded-xl border border-neutral-200 mb-3 shadow-sm">
                        <View className="flex-row justify-between items-start mb-2">
                            <Text className="font-bold text-neutral-900 text-base flex-1">
                                {order.clientName}
                            </Text>
                            <View className={`px-2 py-1 rounded-full ${
                                order.status === 'shipped' ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                                <Text className={`text-xs font-semibold ${
                                    order.status === 'shipped' ? 'text-blue-700' : 'text-gray-700'
                                }`}>
                                    {order.status === 'shipped' ? 'Enviado' : 'Pendiente'}
                                </Text>
                            </View>
                        </View>
                        <Text className="text-neutral-500 text-sm mb-3">
                            Pedido #{order.id.slice(-6)}
                        </Text>
                        <View className="flex-row justify-between items-center pt-3 border-t border-neutral-100">
                            <Text className="text-neutral-600 text-sm">
                                {order.itemsCount} productos
                            </Text>
                            <Text className="font-bold text-neutral-900">
                                ${order.total.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                )}
                emptyState={{
                    icon: 'cube-outline',
                    title: 'Sin Pedidos',
                    message: 'No hay pedidos asignados en este momento'
                }}
            />
        </View>
    )
}

/**
 * Transportista Deliveries Screen
 * Shows all deliveries with their status
 */
export function TransportistaDeliveriesScreen() {
    const [deliveries, setDeliveries] = React.useState<Delivery[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    /**
     * Load deliveries from API
     */
    const loadDeliveries = async () => {
        try {
            setIsLoading(true)
            const data = await TransportistaService.getDeliveries()
            setDeliveries(data)
        } catch (error) {
            console.error('Error loading deliveries:', error)
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Load deliveries on screen focus
     */
    useFocusEffect(
        React.useCallback(() => {
            loadDeliveries()
        }, [])
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                userName="Transportista"
                role="TRANSPORTISTA"
                showNotification={false}
                variant="default"
            />

            <GenericList
                items={deliveries}
                isLoading={isLoading}
                onRefresh={loadDeliveries}
                renderItem={(delivery) => (
                    <DeliveryCard delivery={delivery} onPress={() => {}} />
                )}
                emptyState={{
                    icon: 'checkmark-circle-outline',
                    title: 'Sin Entregas',
                    message: 'No hay entregas pendientes'
                }}
            />
        </View>
    )
}

/**
 * Transportista Profile Screen
 * Shows driver profile information
 */
export function TransportistaProfileScreen() {
    const [profileData, setProfileData] = React.useState({
        name: 'Juan Pérez',
        email: 'juan.perez@cafrilosa.com',
        phone: '+34 666 777 888',
        vehicle: 'Furgoneta - ABC-1234',
        rating: 4.8,
        totalDeliveries: 245,
        successRate: 98
    })
    const [isLoading, setIsLoading] = React.useState(false)

    /**
     * Load profile data on screen focus
     */
    useFocusEffect(
        React.useCallback(() => {
            // Load profile data from API when ready
        }, [])
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                userName="Transportista"
                role="TRANSPORTISTA"
                showNotification={false}
                variant="default"
            />

            <View className="flex-1 px-5 pt-5">
                {/* Profile Header */}
                <View className="bg-white p-6 rounded-xl border border-neutral-200 mb-6 items-center shadow-sm">
                    <View className="w-24 h-24 rounded-full bg-brand-red items-center justify-center mb-4">
                        <Text className="text-white text-3xl font-bold">
                            {profileData.name.charAt(0)}
                        </Text>
                    </View>
                    <Text className="text-2xl font-bold text-neutral-900 text-center mb-1">
                        {profileData.name}
                    </Text>
                    <View className="flex-row items-center gap-1 mb-4">
                        <Text className="text-amber-500">★</Text>
                        <Text className="font-semibold text-neutral-700">
                            {profileData.rating}
                        </Text>
                    </View>
                </View>

                {/* Contact Info */}
                <View className="bg-white p-4 rounded-xl border border-neutral-200 mb-4 shadow-sm">
                    <Text className="text-sm font-semibold text-neutral-500 mb-3">
                        INFORMACIÓN DE CONTACTO
                    </Text>
                    <View className="gap-3">
                        <View className="flex-row items-center gap-3">
                            <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
                                <Text>📧</Text>
                            </View>
                            <Text className="text-neutral-700 flex-1">{profileData.email}</Text>
                        </View>
                        <View className="flex-row items-center gap-3">
                            <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center">
                                <Text>📱</Text>
                            </View>
                            <Text className="text-neutral-700">{profileData.phone}</Text>
                        </View>
                    </View>
                </View>

                {/* Vehicle Info */}
                <View className="bg-white p-4 rounded-xl border border-neutral-200 mb-4 shadow-sm">
                    <Text className="text-sm font-semibold text-neutral-500 mb-3">
                        VEHÍCULO
                    </Text>
                    <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center">
                            <Text>🚚</Text>
                        </View>
                        <Text className="text-neutral-700">{profileData.vehicle}</Text>
                    </View>
                </View>

                {/* Statistics */}
                <View className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                    <Text className="text-sm font-semibold text-neutral-500 mb-4">
                        ESTADÍSTICAS
                    </Text>
                    <View className="flex-row gap-3">
                        <View className="flex-1 items-center p-3 bg-blue-50 rounded-lg">
                            <Text className="text-2xl font-bold text-brand-red">
                                {profileData.totalDeliveries}
                            </Text>
                            <Text className="text-xs text-neutral-600 text-center mt-1">
                                Entregas Totales
                            </Text>
                        </View>
                        <View className="flex-1 items-center p-3 bg-green-50 rounded-lg">
                            <Text className="text-2xl font-bold text-green-600">
                                {profileData.successRate}%
                            </Text>
                            <Text className="text-xs text-neutral-600 text-center mt-1">
                                Tasa de Éxito
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    )
}

// FAB Screens - Modal screens
export function TransportistaRoutesScreen() {
    const [routes, setRoutes] = React.useState([])
    const [isLoading, setIsLoading] = React.useState(true)

    /**
     * Load routes from API
     */
    const loadRoutes = async () => {
        try {
            setIsLoading(true)
            const data = await TransportistaService.getRoutes()
            setRoutes(data)
        } catch (error) {
            console.error('Error loading routes:', error)
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Load routes on screen focus
     */
    useFocusEffect(
        React.useCallback(() => {
            loadRoutes()
        }, [])
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                userName="Transportista"
                role="TRANSPORTISTA"
                showNotification={false}
                variant="default"
            />

            <GenericList
                items={routes}
                isLoading={isLoading}
                onRefresh={loadRoutes}
                renderItem={(route: any) => (
                    <View className="bg-white p-4 rounded-xl border border-neutral-200 mb-3 shadow-sm">
                        <Text className="font-bold text-neutral-900 text-base mb-2">
                            {route.name}
                        </Text>
                        <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-neutral-100">
                            <View className="flex-row items-center gap-2">
                                <Text className="text-sm text-neutral-600">
                                    {route.startTime} - {route.estimatedEndTime}
                                </Text>
                            </View>
                            <View className="bg-blue-100 px-2 py-1 rounded">
                                <Text className="text-xs font-semibold text-blue-700">
                                    {route.estimatedDuration} min
                                </Text>
                            </View>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-sm text-neutral-600">
                                📍 {route.distance} km
                            </Text>
                            <Text className="text-sm font-semibold text-neutral-700">
                                {route.deliveries?.length || 0} entregas
                            </Text>
                        </View>
                    </View>
                )}
                emptyState={{
                    icon: 'map-outline',
                    title: 'Sin Rutas',
                    message: 'No hay rutas asignadas'
                }}
            />
        </View>
    )
}

export function TransportistaReturnsScreen() {
    const [returns, setReturns] = React.useState([])
    const [isLoading, setIsLoading] = React.useState(true)

    /**
     * Load returns from API
     */
    const loadReturns = async () => {
        try {
            setIsLoading(true)
            const data = await TransportistaService.getReturns()
            setReturns(data)
        } catch (error) {
            console.error('Error loading returns:', error)
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Load returns on screen focus
     */
    useFocusEffect(
        React.useCallback(() => {
            loadReturns()
        }, [])
    )

    const STATUS_COLORS: Record<string, string> = {
        pending: 'bg-yellow-50 border-yellow-200',
        in_process: 'bg-blue-50 border-blue-200',
        completed: 'bg-green-50 border-green-200'
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                userName="Transportista"
                role="TRANSPORTISTA"
                showNotification={false}
                variant="default"
            />

            <GenericList
                items={returns}
                isLoading={isLoading}
                onRefresh={loadReturns}
                renderItem={(returnItem: any) => (
                    <View className={`${STATUS_COLORS[returnItem.status]} p-4 rounded-xl border mb-3`}>
                        <View className="flex-row justify-between items-start mb-2">
                            <Text className="font-bold text-neutral-900">
                                Devolución #{returnItem.id.slice(-4)}
                            </Text>
                            <Text className="text-xs font-semibold text-neutral-600">
                                {returnItem.date}
                            </Text>
                        </View>
                        <Text className="text-sm text-neutral-600 mb-2">
                            Pedido: {returnItem.orderId}
                        </Text>
                        <Text className="text-sm text-neutral-700 mb-2">
                            Motivo: {returnItem.reason}
                        </Text>
                        <View className="pt-2 border-t border-neutral-300">
                            <Text className="text-xs font-semibold text-neutral-600">
                                Estado: {returnItem.status === 'pending' ? 'Pendiente' : returnItem.status === 'in_process' ? 'En Proceso' : 'Completado'}
                            </Text>
                        </View>
                    </View>
                )}
                emptyState={{
                    icon: 'refresh-circle-outline',
                    title: 'Sin Devoluciones',
                    message: 'No hay devoluciones pendientes'
                }}
            />
        </View>
    )
}

export function TransportistaHistoryScreen() {
    const [history, setHistory] = React.useState([])
    const [isLoading, setIsLoading] = React.useState(true)

    /**
     * Load route history from API
     */
    const loadHistory = async () => {
        try {
            setIsLoading(true)
            const data = await TransportistaService.getRouteHistory()
            setHistory(data)
        } catch (error) {
            console.error('Error loading history:', error)
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Load history on screen focus
     */
    useFocusEffect(
        React.useCallback(() => {
            loadHistory()
        }, [])
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                userName="Transportista"
                role="TRANSPORTISTA"
                showNotification={false}
                variant="default"
            />

            <GenericList
                items={history}
                isLoading={isLoading}
                onRefresh={loadHistory}
                renderItem={(route: any) => (
                    <View className="bg-white p-4 rounded-xl border border-neutral-200 mb-3 shadow-sm">
                        <Text className="font-bold text-neutral-900 text-base mb-3">
                            {route.name}
                        </Text>
                        <View className="flex-row justify-between items-center pb-3 border-b border-neutral-100">
                            <View>
                                <Text className="text-sm text-neutral-600 mb-1">
                                    ⏱️ {route.startTime} - {route.estimatedEndTime}
                                </Text>
                                <Text className="text-sm text-neutral-600">
                                    📍 {route.distance} km
                                </Text>
                            </View>
                            <View className="bg-green-100 px-3 py-1 rounded-full">
                                <Text className="text-xs font-semibold text-green-700">
                                    Completada
                                </Text>
                            </View>
                        </View>
                        <View className="mt-3 flex-row justify-between items-center">
                            <Text className="text-sm font-semibold text-neutral-700">
                                Duración: {route.estimatedDuration} minutos
                            </Text>
                            <Text className="text-sm text-neutral-600">
                                {route.deliveries?.length || 0} entregas
                            </Text>
                        </View>
                    </View>
                )}
                emptyState={{
                    icon: 'time-outline',
                    title: 'Sin Historial',
                    message: 'No hay historial de rutas disponible'
                }}
            />
        </View>
    )
}

export function TransportistaNotificationsScreen() {
    const [notifications, setNotifications] = React.useState([])
    const [isLoading, setIsLoading] = React.useState(true)

    /**
     * Load notifications from API
     */
    const loadNotifications = async () => {
        try {
            setIsLoading(true)
            const data = await TransportistaService.getNotifications()
            setNotifications(data)
        } catch (error) {
            console.error('Error loading notifications:', error)
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Load notifications on screen focus
     */
    useFocusEffect(
        React.useCallback(() => {
            loadNotifications()
        }, [])
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                userName="Transportista"
                role="TRANSPORTISTA"
                showNotification={false}
                variant="default"
            />

            <GenericList
                items={notifications}
                isLoading={isLoading}
                onRefresh={loadNotifications}
                renderItem={(notif: any) => (
                    <View className={`${notif.read ? 'bg-neutral-50' : 'bg-blue-50'} p-4 rounded-xl border ${notif.read ? 'border-neutral-200' : 'border-blue-200'} mb-3`}>
                        <View className="flex-row justify-between items-start mb-2">
                            <Text className="font-bold text-neutral-900 flex-1">
                                {notif.title}
                            </Text>
                            {!notif.read && (
                                <View className="w-3 h-3 rounded-full bg-brand-red" />
                            )}
                        </View>
                        <Text className="text-sm text-neutral-600 mb-2">
                            {notif.message}
                        </Text>
                        <Text className="text-xs text-neutral-500">
                            {notif.date}
                        </Text>
                    </View>
                )}
                emptyState={{
                    icon: 'notifications-outline',
                    title: 'Sin Notificaciones',
                    message: 'No hay notificaciones nuevas'
                }}
            />
        </View>
    )
}
