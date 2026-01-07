import React from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { RoutePlan } from '../../../services/api/RouteService'
import { StatusBadge } from '../../../components/ui/StatusBadge'

interface Props {
    routes: RoutePlan[]
    onReorder: (fromIndex: number, toIndex: number) => void
    onEdit: (item: RoutePlan) => void
    onRemove?: (item: RoutePlan) => void
}

export function RoutePlanningList({ routes, onReorder, onEdit, onRemove }: Props) {
    if (routes.length === 0) {
        return (
            <View className="flex-1 items-center justify-center p-8 bg-white min-h-[300px]">
                <Ionicons name="map-outline" size={48} color="#9CA3AF" />
                <Text className="text-neutral-500 mt-4 text-center">
                    No hay clientes asignados a esta ruta. Selecciona una zona y día para comenzar.
                </Text>
            </View>
        )
    }

    const getPriorityVariant = (p: string): 'error' | 'warning' | 'success' => {
        switch (p) {
            case 'ALTA': return 'error'
            case 'MEDIA': return 'warning'
            case 'BAJA': return 'success'
            default: return 'warning'
        }
    }

    const getFrequencyIcon = (f: string): keyof typeof Ionicons.glyphMap => {
        switch (f) {
            case 'SEMANAL': return 'calendar'
            case 'QUINCENAL': return 'calendar-outline'
            case 'MENSUAL': return 'calendar-clear-outline'
            default: return 'calendar'
        }
    }

    return (
        <ScrollView className="flex-1 bg-neutral-50 p-4">
            {routes.map((item, index) => (
                <View
                    key={item.id || `temp-${index}`}
                    className={`bg-white rounded-2xl mb-4 overflow-hidden shadow-md border ${item.id.startsWith('temp') ? 'border-dashed border-neutral-300 opacity-90' : 'border-neutral-100'}`}
                >
                    {/* Header Section with Order Number */}
                    <View className="bg-red-50 px-4 py-3 border-b border-neutral-100">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
                                <View className="w-10 h-10 rounded-full bg-red-500 items-center justify-center mr-3 shadow-sm">
                                    <Text className="text-white font-bold text-lg">{index + 1}</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="font-bold text-neutral-900 text-base" numberOfLines={1}>
                                        {item._cliente?.nombre_comercial || 'Cliente sin nombre'}
                                    </Text>
                                    {item._cliente?.razon_social && item._cliente.razon_social !== item._cliente.nombre_comercial && (
                                        <Text className="text-neutral-500 text-xs mt-0.5" numberOfLines={1}>
                                            {item._cliente?.razon_social}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            {item.hora_estimada_arribo && (
                                <View className="bg-blue-500 px-3 py-1.5 rounded-full shadow-sm ml-2">
                                    <View className="flex-row items-center">
                                        <Ionicons name="time" size={12} color="white" />
                                        <Text className="text-white text-xs font-bold ml-1">
                                            {item.hora_estimada_arribo}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Content Section */}
                    <TouchableOpacity
                        onPress={() => onEdit(item)}
                        className="px-4 py-3"
                        activeOpacity={0.7}
                    >
                        {/* Address Section */}
                        <View className="flex-row items-start mb-3">
                            <Ionicons name="location" size={16} color="#DC2626" style={{ marginTop: 2 }} />
                            <View className="flex-1 ml-2">
                                <Text className="text-neutral-700 text-sm" numberOfLines={2}>
                                    {item._cliente?.direccion || 'Sin dirección registrada'}
                                </Text>
                                {item._cliente?.identificacion && (
                                    <Text className="text-neutral-400 text-xs mt-1">
                                        ID: {item._cliente.identificacion}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Badges Section */}
                        <View className="flex-row flex-wrap gap-2 mb-2">
                            <StatusBadge
                                label={item.prioridad_visita}
                                variant={getPriorityVariant(item.prioridad_visita)}
                                size="sm"
                                icon="flag"
                            />
                            <StatusBadge
                                label={item.frecuencia}
                                variant="info"
                                size="sm"
                                icon={getFrequencyIcon(item.frecuencia)}
                            />
                            {item.id.startsWith('temp') && (
                                <StatusBadge
                                    label="Sin guardar"
                                    variant="neutral"
                                    size="sm"
                                    icon="alert-circle"
                                    outline
                                />
                            )}
                        </View>

                        {/* Edit Hint */}
                        <View className="flex-row items-center justify-center py-2 mt-1 border-t border-neutral-100">
                            <Ionicons name="create-outline" size={14} color="#9CA3AF" />
                            <Text className="text-neutral-400 text-xs ml-1 font-medium">
                                Toca para editar detalles
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Reorder Controls */}
                    <View className="flex-row border-t border-neutral-100 bg-neutral-50">
                        <TouchableOpacity
                            onPress={() => index > 0 && onReorder(index, index - 1)}
                            className={`flex-1 py-3 items-center border-r border-neutral-100 ${index === 0 ? 'opacity-30' : 'active:bg-neutral-200'}`}
                            disabled={index === 0}
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="arrow-up" size={16} color={index === 0 ? '#D1D5DB' : '#DC2626'} />
                                <Text className={`text-xs font-bold ml-1 ${index === 0 ? 'text-neutral-300' : 'text-red-600'}`}>
                                    Subir
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => index < routes.length - 1 && onReorder(index, index + 1)}
                            className={`flex-1 py-3 items-center ${index === routes.length - 1 ? 'opacity-30' : 'active:bg-neutral-200'}`}
                            disabled={index === routes.length - 1}
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="arrow-down" size={16} color={index === routes.length - 1 ? '#D1D5DB' : '#DC2626'} />
                                <Text className={`text-xs font-bold ml-1 ${index === routes.length - 1 ? 'text-neutral-300' : 'text-red-600'}`}>
                                    Bajar
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
            <View className="h-20" />
        </ScrollView>
    )
}
