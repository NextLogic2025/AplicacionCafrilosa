import React, { useState, useCallback } from 'react'
import { View, Text, Switch, TouchableOpacity, Alert, LayoutAnimation, Platform, UIManager } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

import { Header } from '../../../../components/ui/Header'
import { GenericList } from '../../../../components/ui/GenericList'
import { SupervisorService, type SupervisorOrder } from '../../../../services/api/SupervisorService'

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export function SupervisorOrdersScreen() {
    const [orders, setOrders] = useState<SupervisorOrder[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

    const loadOrders = async () => {
        try {
            setIsLoading(true)
            const data = await SupervisorService.getOrders()
            setOrders(data)
        } catch (error) {
            console.error('Error loading orders', error)
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(useCallback(() => { loadOrders() }, []))

    const toggleExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        const newExpanded = new Set(expandedIds)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedIds(newExpanded)
    }

    const handleAction = (orderId: string, action: 'review' | 'escalate') => {
        Alert.alert(
            action === 'review' ? 'Revisión Solicitada' : 'Incidencia Escalada',
            `Se ha ${action === 'review' ? 'marcado para revisión' : 'escalado'} el pedido #${orderId}`,
            [{ text: 'OK' }]
        )
    }

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'pending_validation': return { color: 'bg-yellow-100', text: 'text-yellow-700', label: 'Validación' }
            case 'billing': return { color: 'bg-blue-100', text: 'text-blue-700', label: 'Facturación' }
            case 'in_route': return { color: 'bg-purple-100', text: 'text-purple-700', label: 'En Ruta' }
            case 'delivered': return { color: 'bg-green-100', text: 'text-green-700', label: 'Entregado' }
            case 'rejected': return { color: 'bg-red-100', text: 'text-red-700', label: 'Rechazado' }
            default: return { color: 'bg-gray-100', text: 'text-gray-700', label: status }
        }
    }

    const renderTimelineItem = (label: string, time?: string, isLast = false, completed = false) => (
        <View className="flex-row items-start h-10">
            <View className="items-center mr-2 w-4">
                <View className={`w-2.5 h-2.5 rounded-full ${completed ? 'bg-green-500' : 'bg-neutral-300'}`} />
                {!isLast && <View className={`w-0.5 flex-1 ${completed ? 'bg-green-300' : 'bg-neutral-200'}`} />}
            </View>
            <View className="flex-1 flex-row justify-between">
                <Text className={`text-xs ${completed ? 'text-neutral-700 font-medium' : 'text-neutral-400'}`}>{label}</Text>
                {time && <Text className="text-xs text-neutral-500">{time}</Text>}
            </View>
        </View>
    )

    const renderItem = (item: SupervisorOrder) => {
        const isExpanded = expandedIds.has(item.id)
        const status = getStatusInfo(item.status)

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => toggleExpand(item.id)}
                className="bg-white rounded-xl border border-neutral-200 mb-3 shadow-sm overflow-hidden"
            >
                <View className="p-4">
                    <View className="flex-row justify-between items-start mb-2">
                        <View>
                            <Text className="font-bold text-neutral-900 text-base">{item.id}</Text>
                            <Text className="text-xs text-neutral-500">Creado por: {item.createdBy}</Text>
                        </View>
                        <View className={`${status.color} px-2 py-1 rounded`}>
                            <Text className={`${status.text} text-xs font-bold uppercase`}>{status.label}</Text>
                        </View>
                    </View>

                    <Text className="text-neutral-800 font-medium mb-1">{item.clientName}</Text>
                    <View className="flex-row justify-between items-center">
                        <Text className="text-neutral-500 text-sm">{item.date}</Text>
                        <Text className="font-bold text-lg text-brand-red">${item.total.toFixed(2)}</Text>
                    </View>
                </View>

                {isExpanded && (
                    <View className="bg-neutral-50 p-4 border-t border-neutral-100">
                        <Text className="font-bold text-xs text-neutral-500 mb-3 uppercase">Línea de Tiempo</Text>
                        <View className="mb-4">
                            {renderTimelineItem('Creación', item.timeline.created, false, true)}
                            {renderTimelineItem('Validación', item.timeline.validated, false, !!item.timeline.validated)}
                            {renderTimelineItem('Facturación', item.timeline.billed, false, !!item.timeline.billed)}
                            {renderTimelineItem('En Ruta', item.timeline.inRoute, false, !!item.timeline.inRoute)}
                            {renderTimelineItem('Entregado', item.timeline.delivered, true, !!item.timeline.delivered)}
                        </View>

                        {item.observations.length > 0 && (
                            <View className="mb-4">
                                <Text className="font-bold text-xs text-neutral-500 mb-2 uppercase">Observaciones</Text>
                                {item.observations.map((obs, idx) => (
                                    <View key={idx} className="bg-white p-2 rounded border border-neutral-200 mb-1">
                                        <View className="flex-row justify-between mb-1">
                                            <Text className="text-xs font-bold text-neutral-700">{obs.role}</Text>
                                            <Text className="text-[10px] text-neutral-400">{obs.date}</Text>
                                        </View>
                                        <Text className="text-xs text-neutral-600 italic">"{obs.note}"</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View className="flex-row gap-3 pt-2">
                            <TouchableOpacity
                                className="flex-1 bg-white border border-neutral-300 py-2 rounded-lg items-center"
                                onPress={() => handleAction(item.id, 'review')}
                            >
                                <Text className="text-neutral-700 font-bold text-xs">Solicitar Revisión</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 bg-red-50 border border-red-200 py-2 rounded-lg items-center"
                                onPress={() => handleAction(item.id, 'escalate')}
                            >
                                <Text className="text-red-700 font-bold text-xs">Escalar Incidencia</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Pedidos" variant="standard" showNotification={false} />
            <GenericList
                items={orders}
                isLoading={isLoading}
                onRefresh={loadOrders}
                renderItem={renderItem}
                emptyState={{
                    icon: 'cart-outline',
                    title: 'Sin Pedidos',
                    message: 'No hay pedidos para mostrar hoy.'
                }}
            />
        </View>
    )
}
