import React from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { RoutePlan } from '../../../services/api/RouteService'

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

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'ALTA': return 'bg-red-100 text-red-800 border-red-200'
            case 'MEDIA': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'BAJA': return 'bg-green-100 text-green-800 border-green-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    return (
        <ScrollView className="flex-1 bg-neutral-50 p-4">
            {routes.map((item, index) => (
                <View
                    key={item.id || `temp-${index}`}
                    className={`bg-white rounded-xl mb-3 flex-row items-center shadow-sm border ${item.id.startsWith('temp') ? 'border-neutral-200 opacity-80' : 'border-neutral-100'}`}
                >
                    {/* Handle / Index */}
                    <View className="pl-3 pr-2 py-4 items-center justify-center border-r border-neutral-100 bg-neutral-50 rounded-l-xl">
                        <Text className="text-neutral-400 font-bold mb-1">{index + 1}</Text>
                        <Ionicons name="git-commit-outline" size={16} color="#9CA3AF" />
                    </View>

                    {/* Content */}
                    <TouchableOpacity
                        className="flex-1 p-3"
                        onPress={() => onEdit(item)}
                    >
                        {/* Header: Name + Time */}
                        <View className="flex-row justify-between items-start mb-1">
                            {/* Info */}
                            <View className="flex-1 mr-2">
                                <Text className="font-bold text-neutral-800 text-base" numberOfLines={1}>
                                    {item._cliente?.nombre_comercial || 'Cliente sin nombre'}
                                </Text>

                                {/* Owner / Legal Name */}
                                {item._cliente?.razon_social && item._cliente.razon_social !== item._cliente.nombre_comercial && (
                                    <Text className="text-neutral-500 text-xs mb-0.5" numberOfLines={1}>
                                        <Ionicons name="person-outline" size={10} /> {item._cliente?.razon_social}
                                    </Text>
                                )}

                                {/* Address / ID */}
                                <Text className="text-neutral-400 text-[10px]" numberOfLines={1}>
                                    {item._cliente?.identificacion ? `ID: ${item._cliente.identificacion} • ` : ''}
                                    {item._cliente?.direccion || 'Sin dirección'}
                                </Text>
                            </View>
                            {item.hora_estimada_arribo && (
                                <View className="flex-row items-center bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                    <Ionicons name="time-outline" size={10} color="#2563EB" />
                                    <Text className="text-blue-700 text-[10px] font-bold ml-1">{item.hora_estimada_arribo}</Text>
                                </View>
                            )}
                        </View>

                        {/* Subheader: Badges */}
                        <View className="flex-row flex-wrap gap-2 mt-1">
                            {/* Priority Badge */}
                            <View className={`px-2 py-0.5 rounded border ${getPriorityColor(item.prioridad_visita).replace('text-', '').replace('bg-', '')} bg-opacity-20`}>
                                <Text className={`text-[10px] font-bold ${getPriorityColor(item.prioridad_visita).split(' ')[1]}`}>
                                    {item.prioridad_visita}
                                </Text>
                            </View>

                            {/* Frequency Badge */}
                            <View className="px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200">
                                <Text className="text-neutral-600 text-[10px] font-bold">
                                    {item.frecuencia.substring(0, 3)}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Reorder Actions */}
                    <View className="flex-col items-center justify-between p-2 gap-1 border-l border-neutral-100">
                        <TouchableOpacity
                            onPress={() => index > 0 && onReorder(index, index - 1)}
                            className={`p-1 rounded-full ${index === 0 ? 'opacity-20' : 'bg-neutral-50 active:bg-neutral-200'}`}
                            disabled={index === 0}
                        >
                            <Ionicons name="chevron-up" size={18} color="#4B5563" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => index < routes.length - 1 && onReorder(index, index + 1)}
                            className={`p-1 rounded-full ${index === routes.length - 1 ? 'opacity-20' : 'bg-neutral-50 active:bg-neutral-200'}`}
                            disabled={index === routes.length - 1}
                        >
                            <Ionicons name="chevron-down" size={18} color="#4B5563" />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
            <View className="h-20" />
        </ScrollView>
    )
}
