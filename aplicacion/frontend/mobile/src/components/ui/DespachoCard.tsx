import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Despacho, DespachoEstadoViaje, DESPACHO_ESTADO_COLORS, DESPACHO_ESTADO_LABELS, DespachosService } from '../../services/api/DespachosService'
import { BRAND_COLORS } from '../../shared/types'

interface DespachoCardProps {
    despacho: Despacho
    onPress?: () => void
    onEdit?: () => void
    onDelete?: () => void
    showActions?: boolean
}

export function DespachoCard({ despacho, onPress, onEdit, onDelete, showActions = true }: DespachoCardProps) {
    const estadoColor = DESPACHO_ESTADO_COLORS[despacho.estado_viaje]
    const estadoLabel = DESPACHO_ESTADO_LABELS[despacho.estado_viaje]
    const codigoManifiesto = DespachosService.formatCodigoManifiesto(despacho.codigo_manifiesto)

    const getIconForEstado = (estado: DespachoEstadoViaje): keyof typeof Ionicons.glyphMap => {
        switch (estado) {
            case 'PLANIFICACION':
                return 'calendar-outline'
            case 'CONFIRMADO':
                return 'checkmark-circle-outline'
            case 'EN_RUTA':
                return 'navigate-circle-outline'
            case 'COMPLETADO':
                return 'checkmark-done-circle'
            case 'CANCELADO':
                return 'close-circle-outline'
            default:
                return 'document-outline'
        }
    }

    return (
        <Pressable
            onPress={onPress}
            className="bg-white rounded-2xl p-4 mb-3 border border-neutral-100 active:bg-neutral-50"
            style={{ elevation: 2 }}
        >
            <View className="flex-row items-center mb-3">
                <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: `${estadoColor}15` }}
                >
                    <Ionicons name="document-text" size={24} color={estadoColor} />
                </View>

                <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                        <Text className="text-lg font-bold text-neutral-900 mr-2">
                            {codigoManifiesto}
                        </Text>
                        <View
                            className="px-2 py-0.5 rounded-full flex-row items-center"
                            style={{ backgroundColor: `${estadoColor}15` }}
                        >
                            <Ionicons
                                name={getIconForEstado(despacho.estado_viaje)}
                                size={12}
                                color={estadoColor}
                                style={{ marginRight: 4 }}
                            />
                            <Text
                                className="text-xs font-bold"
                                style={{ color: estadoColor }}
                            >
                                {estadoLabel}
                            </Text>
                        </View>
                    </View>

                    {despacho.fecha_programada && (
                        <View className="flex-row items-center">
                            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                            <Text className="text-xs text-neutral-500 ml-1">
                                {new Date(despacho.fecha_programada).toLocaleDateString('es-EC', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </Text>
                        </View>
                    )}
                </View>

                {showActions && (
                    <View className="flex-row gap-2">
                        {onEdit && (
                            <Pressable
                                onPress={onEdit}
                                className="w-9 h-9 rounded-xl items-center justify-center active:opacity-70"
                                style={{ backgroundColor: '#3B82F615' }}
                            >
                                <Ionicons name="create-outline" size={18} color="#3B82F6" />
                            </Pressable>
                        )}
                        {onDelete && (
                            <Pressable
                                onPress={onDelete}
                                className="w-9 h-9 rounded-xl items-center justify-center active:opacity-70"
                                style={{ backgroundColor: '#EF444415' }}
                            >
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </Pressable>
                        )}
                    </View>
                )}
            </View>

            <View className="border-t border-neutral-100 pt-3">
                <View className="flex-row justify-between">
                    {despacho.vehiculo || despacho.vehiculo_id ? (
                        <View className="flex-1 mr-2">
                            <View className="flex-row items-center mb-1">
                                <Ionicons name="car-sport-outline" size={14} color="#6B7280" />
                                <Text className="text-xs text-neutral-500 ml-1">Vehículo</Text>
                            </View>
                            <Text className="text-sm font-medium text-neutral-900">
                                {despacho.vehiculo?.placa || 'Asignado'}
                            </Text>
                        </View>
                    ) : (
                        <View className="flex-1 mr-2">
                            <Text className="text-xs text-neutral-400 italic">Sin vehículo</Text>
                        </View>
                    )}

                    {despacho.conductor || despacho.conductor_id ? (
                        <View className="flex-1">
                            <View className="flex-row items-center mb-1">
                                <Ionicons name="person-outline" size={14} color="#6B7280" />
                                <Text className="text-xs text-neutral-500 ml-1">Conductor</Text>
                            </View>
                            <Text className="text-sm font-medium text-neutral-900 numberOfLines={1}">
                                {despacho.conductor?.nombre_completo || 'Asignado'}
                            </Text>
                        </View>
                    ) : (
                        <View className="flex-1">
                            <Text className="text-xs text-neutral-400 italic">Sin conductor</Text>
                        </View>
                    )}
                </View>

                {parseFloat(despacho.peso_total_kg) > 0 && (
                    <View className="flex-row items-center mt-2">
                        <Ionicons name="cube-outline" size={14} color="#6B7280" />
                        <Text className="text-xs text-neutral-600 ml-1">
                            Peso total: <Text className="font-semibold">{parseFloat(despacho.peso_total_kg).toFixed(0)} kg</Text>
                        </Text>
                    </View>
                )}
            </View>
        </Pressable>
    )
}
