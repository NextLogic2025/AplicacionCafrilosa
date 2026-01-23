import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Vehicle, VehicleEstado, VEHICLE_ESTADO_COLORS, VEHICLE_ESTADO_LABELS } from '../../services/api/VehicleService'
import { BRAND_COLORS } from '../../shared/types'

interface VehicleCardProps {
    vehicle: Vehicle
    onPress?: () => void
    onEdit?: () => void
    onDelete?: () => void
    showActions?: boolean
}

export function VehicleCard({ vehicle, onPress, onEdit, onDelete, showActions = true }: VehicleCardProps) {
    const estadoColor = VEHICLE_ESTADO_COLORS[vehicle.estado] || '#6B7280'
    const estadoLabel = VEHICLE_ESTADO_LABELS[vehicle.estado] || vehicle.estado

    const getIconForEstado = (estado: VehicleEstado): keyof typeof Ionicons.glyphMap => {
        switch (estado) {
            case 'DISPONIBLE':
                return 'checkmark-circle'
            case 'EN_RUTA':
                return 'navigate-circle'
            case 'MANTENIMIENTO':
                return 'construct'
            case 'INACTIVO':
                return 'ban'
            default:
                return 'car'
        }
    }

    return (
        <Pressable
            onPress={onPress}
            className="bg-white rounded-2xl p-4 mb-3 border border-neutral-100 active:bg-neutral-50"
            style={{ elevation: 2 }}
        >
            <View className="flex-row items-center">
                <View
                    className="w-14 h-14 rounded-full items-center justify-center mr-4"
                    style={{ backgroundColor: `${estadoColor}15` }}
                >
                    <Ionicons name="car-sport" size={28} color={estadoColor} />
                </View>

                <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                        <Text className="text-lg font-bold text-neutral-900 mr-2">
                            {vehicle.placa.toUpperCase()}
                        </Text>
                        <View
                            className="px-2.5 py-1 rounded-full flex-row items-center"
                            style={{ backgroundColor: `${estadoColor}15` }}
                        >
                            <Ionicons
                                name={getIconForEstado(vehicle.estado)}
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

                    <View className="flex-row items-center">
                        {vehicle.marca && (
                            <Text className="text-sm text-neutral-600 mr-2">
                                {vehicle.marca}
                            </Text>
                        )}
                        {vehicle.modelo && (
                            <Text className="text-sm text-neutral-500">
                                {vehicle.modelo}
                            </Text>
                        )}
                    </View>

                    <View className="flex-row items-center mt-1">
                        {vehicle.anio && (
                            <View className="flex-row items-center mr-3">
                                <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                                <Text className="text-xs text-neutral-500 ml-1">{vehicle.anio}</Text>
                            </View>
                        )}
                        {vehicle.capacidad_kg && (
                            <View className="flex-row items-center">
                                <Ionicons name="cube-outline" size={14} color="#9CA3AF" />
                                <Text className="text-xs text-neutral-500 ml-1">
                                    {parseFloat(vehicle.capacidad_kg).toFixed(0)} kg
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {showActions && (
                    <View className="flex-row gap-2">
                        {onEdit && (
                            <Pressable
                                onPress={onEdit}
                                className="w-10 h-10 rounded-xl items-center justify-center active:opacity-70"
                                style={{ backgroundColor: '#3B82F615' }}
                            >
                                <Ionicons name="create-outline" size={20} color="#3B82F6" />
                            </Pressable>
                        )}
                        {onDelete && (
                            <Pressable
                                onPress={onDelete}
                                className="w-10 h-10 rounded-xl items-center justify-center active:opacity-70"
                                style={{ backgroundColor: '#EF444415' }}
                            >
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </Pressable>
                        )}
                    </View>
                )}
            </View>
        </Pressable>
    )
}
