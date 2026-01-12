import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { RouteService, RoutePlan } from '../../../../services/api/RouteService'
import { ClientService, Client } from '../../../../services/api/ClientService'

interface RoutePlanWithClient extends RoutePlan {
    cliente?: {
        razon_social: string
        nombre_comercial: string | null
        identificacion: string
    }
    sucursal?: {
        nombre_sucursal: string
    }
}

const DAYS = [
    { id: 1, label: 'Lunes', short: 'Lun' },
    { id: 2, label: 'Martes', short: 'Mar' },
    { id: 3, label: 'Miércoles', short: 'Mié' },
    { id: 4, label: 'Jueves', short: 'Jue' },
    { id: 5, label: 'Viernes', short: 'Vie' },
]

export function SupervisorRoutesInactiveScreen() {
    const navigation = useNavigation()

    const [routes, setRoutes] = useState<RoutePlanWithClient[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [reactivatingId, setReactivatingId] = useState<string | null>(null)
    const [feedbackModal, setFeedbackModal] = useState({
        visible: false,
        type: 'info' as FeedbackType,
        title: '',
        message: ''
    })

    const loadInactiveRoutes = useCallback(async () => {
        try {
            // Obtener rutas desactivadas
            const inactiveRoutes = await RouteService.getInactive()
            
            // Cargar info de clientes
            const clientIds = [...new Set(inactiveRoutes.map(r => r.cliente_id))]
            const clientsMap = new Map<string, Client>()
            
            await Promise.all(
                clientIds.map(async (id) => {
                    try {
                        const client = await ClientService.getClient(id)
                        clientsMap.set(id, client)
                    } catch (err) {
                        console.error(`Error loading client ${id}:`, err)
                    }
                })
            )

            // Enriquecer rutas con datos de cliente
            const enrichedRoutes: RoutePlanWithClient[] = inactiveRoutes.map(route => {
                const client = clientsMap.get(route.cliente_id)
                return {
                    ...route,
                    cliente: client ? {
                        razon_social: client.razon_social,
                        nombre_comercial: client.nombre_comercial || null,
                        identificacion: client.identificacion
                    } : undefined
                }
            })

            setRoutes(enrichedRoutes)
        } catch (error) {
            console.error('Error loading inactive routes:', error)
            showFeedback('error', 'Error', 'No se pudieron cargar las rutas desactivadas')
        } finally {
            setLoading(false)
        }
    }, [])

    useFocusEffect(
        useCallback(() => {
            loadInactiveRoutes()
        }, [loadInactiveRoutes])
    )

    const onRefresh = async () => {
        setRefreshing(true)
        await loadInactiveRoutes()
        setRefreshing(false)
    }

    const showFeedback = (type: FeedbackType, title: string, message: string) => {
        setFeedbackModal({ visible: true, type, title, message })
    }

    const handleReactivate = async (route: RoutePlanWithClient) => {
        setReactivatingId(route.id)
        try {
            await RouteService.reactivate(route.id)
            showFeedback('success', 'Ruta Reactivada', `La ruta de ${route.cliente?.nombre_comercial || 'cliente'} ha sido reactivada correctamente`)
            await loadInactiveRoutes()
        } catch (error) {
            console.error('Error reactivating route:', error)
            showFeedback('error', 'Error', 'No se pudo reactivar la ruta')
        } finally {
            setReactivatingId(null)
        }
    }

    const getFrequencyLabel = (freq: string) => {
        switch (freq) {
            case 'SEMANAL': return 'Semanal'
            case 'QUINCENAL': return 'Quincenal'
            case 'MENSUAL': return 'Mensual'
            default: return freq
        }
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header 
                title="Rutas Desactivadas" 
                variant="standard" 
                onBackPress={() => navigation.goBack()} 
            />

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                    <Text className="text-neutral-500 mt-3">Cargando rutas...</Text>
                </View>
            ) : routes.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                    <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-4">
                        <Ionicons name="checkmark-circle" size={40} color="#22C55E" />
                    </View>
                    <Text className="text-neutral-900 font-bold text-xl mb-2">Sin rutas desactivadas</Text>
                    <Text className="text-neutral-500 text-center">
                        Todas las rutas están activas. Las rutas que desactives aparecerán aquí.
                    </Text>
                </View>
            ) : (
                <ScrollView 
                    className="flex-1 px-4 pt-4"
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND_COLORS.red]} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {/* Info Banner */}
                    <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex-row items-start">
                        <Ionicons name="information-circle" size={20} color="#F59E0B" />
                        <Text className="text-amber-800 text-sm ml-2 flex-1">
                            Las rutas desactivadas no aparecen en la planificación. Puedes reactivarlas en cualquier momento.
                        </Text>
                    </View>

                    {/* Contador */}
                    <Text className="text-neutral-500 text-sm mb-3">
                        {routes.length} ruta(s) desactivada(s)
                    </Text>

                    {/* Lista de rutas */}
                    {routes.map((route) => (
                        <View 
                            key={route.id}
                            className="bg-white rounded-xl border border-neutral-200 mb-3 overflow-hidden"
                        >
                            <View className="p-4">
                                {/* Header */}
                                <View className="flex-row items-start justify-between mb-2">
                                    <View className="flex-1">
                                        <View className="flex-row items-center">
                                            <Ionicons name="business-outline" size={16} color="#737373" />
                                            <Text className="text-neutral-900 font-bold ml-2" numberOfLines={1}>
                                                {route.cliente?.nombre_comercial || 'Cliente desconocido'}
                                            </Text>
                                        </View>
                                        <Text className="text-neutral-400 text-xs mt-0.5">
                                            {route.cliente?.identificacion}
                                        </Text>
                                    </View>
                                    <View className="bg-neutral-100 px-2 py-1 rounded-full">
                                        <Text className="text-neutral-500 text-xs font-medium">Desactivada</Text>
                                    </View>
                                </View>

                                {/* Detalles */}
                                <View className="flex-row flex-wrap gap-2 mt-2">
                                    <View className="bg-blue-50 px-2 py-1 rounded-full flex-row items-center">
                                        <Ionicons name="calendar" size={12} color="#3B82F6" />
                                        <Text className="text-blue-700 text-xs ml-1">
                                            {DAYS.find(d => d.id === route.dia_semana)?.label}
                                        </Text>
                                    </View>
                                    {route.hora_estimada_arribo && (
                                        <View className="bg-green-50 px-2 py-1 rounded-full flex-row items-center">
                                            <Ionicons name="time" size={12} color="#22C55E" />
                                            <Text className="text-green-700 text-xs ml-1">
                                                {route.hora_estimada_arribo}
                                            </Text>
                                        </View>
                                    )}
                                    <View className="bg-purple-50 px-2 py-1 rounded-full flex-row items-center">
                                        <Ionicons name="repeat" size={12} color="#8B5CF6" />
                                        <Text className="text-purple-700 text-xs ml-1">
                                            {getFrequencyLabel(route.frecuencia)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Botón Reactivar */}
                            <TouchableOpacity
                                onPress={() => handleReactivate(route)}
                                disabled={reactivatingId === route.id}
                                className="bg-green-50 border-t border-green-100 py-3 flex-row items-center justify-center"
                            >
                                {reactivatingId === route.id ? (
                                    <ActivityIndicator size="small" color="#22C55E" />
                                ) : (
                                    <>
                                        <Ionicons name="refresh" size={18} color="#22C55E" />
                                        <Text className="text-green-600 font-semibold ml-2">Reactivar Ruta</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    ))}

                    <View className="h-8" />
                </ScrollView>
            )}

            <FeedbackModal
                visible={feedbackModal.visible}
                type={feedbackModal.type}
                title={feedbackModal.title}
                message={feedbackModal.message}
                onClose={() => setFeedbackModal(prev => ({ ...prev, visible: false }))}
            />
        </View>
    )
}
