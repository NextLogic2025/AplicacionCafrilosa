import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Conductor } from '../../services/api/ConductorService'

interface ConductorCardProps {
    conductor: Conductor
    onPress?: () => void
    onEdit?: () => void
    onDelete?: () => void
    showActions?: boolean
}

/**
 * Card component para mostrar información de un conductor
 */
export function ConductorCard({
    conductor,
    onPress,
    onEdit,
    onDelete,
    showActions = true
}: ConductorCardProps) {
    // Obtener iniciales para avatar
    const getInitials = () => {
        const parts = conductor.nombre_completo.trim().split(' ')
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase()
        }
        return conductor.nombre_completo.substring(0, 2).toUpperCase()
    }

    const initials = getInitials()
    const estadoColor = conductor.activo ? '#10B981' : '#6B7280'
    const estadoBg = conductor.activo ? '#D1FAE5' : '#F3F4F6'
    const estadoLabel = conductor.activo ? 'Activo' : 'Inactivo'

    return (
        <Pressable
            onPress={onPress}
            className="bg-white rounded-2xl border border-neutral-100 overflow-hidden mb-3"
            style={{ elevation: 2 }}
        >
            <View className="p-4">
                {/* Header con avatar y estado */}
                <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                        {/* Avatar con iniciales */}
                        <View
                            className="w-14 h-14 rounded-full items-center justify-center mr-3"
                            style={{ backgroundColor: `${estadoColor}20` }}
                        >
                            <Text
                                className="text-lg font-bold"
                                style={{ color: estadoColor }}
                            >
                                {initials}
                            </Text>
                        </View>

                        {/* Nombre y estado */}
                        <View className="flex-1">
                            <Text
                                className="text-base font-bold text-neutral-900"
                                numberOfLines={1}
                            >
                                {conductor.nombre_completo}
                            </Text>
                            <View className="flex-row items-center mt-1">
                                <View
                                    className="px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: estadoBg }}
                                >
                                    <Text
                                        className="text-xs font-semibold"
                                        style={{ color: estadoColor }}
                                    >
                                        {estadoLabel}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Información de contacto */}
                <View className="space-y-2">
                    {/* Cédula */}
                    <View className="flex-row items-center">
                        <Ionicons name="id-card-outline" size={16} color="#6B7280" />
                        <Text className="text-sm text-neutral-600 ml-2">
                            Cédula: <Text className="font-semibold text-neutral-900">{conductor.cedula}</Text>
                        </Text>
                    </View>

                    {/* Teléfono */}
                    {conductor.telefono && (
                        <View className="flex-row items-center mt-1">
                            <Ionicons name="call-outline" size={16} color="#6B7280" />
                            <Text className="text-sm text-neutral-600 ml-2">
                                {conductor.telefono}
                            </Text>
                        </View>
                    )}

                    {/* Licencia */}
                    {conductor.licencia && (
                        <View className="flex-row items-center mt-1">
                            <Ionicons name="card-outline" size={16} color="#6B7280" />
                            <Text className="text-sm text-neutral-600 ml-2">
                                Licencia: <Text className="font-semibold text-neutral-900">{conductor.licencia}</Text>
                            </Text>
                        </View>
                    )}

                    {!conductor.licencia && (
                        <View className="flex-row items-center mt-1">
                            <Ionicons name="alert-circle-outline" size={16} color="#F59E0B" />
                            <Text className="text-sm text-amber-600 ml-2">
                                Sin licencia registrada
                            </Text>
                        </View>
                    )}
                </View>

                {/* Botones de acción */}
                {showActions && (
                    <View className="flex-row items-center justify-end mt-4 pt-3 border-t border-neutral-100">
                        {onEdit && (
                            <Pressable
                                onPress={onEdit}
                                className="flex-row items-center px-3 py-2 mr-2 bg-neutral-100 rounded-lg active:bg-neutral-200"
                            >
                                <Ionicons name="create-outline" size={18} color="#374151" />
                                <Text className="text-sm font-semibold text-neutral-700 ml-1">
                                    Editar
                                </Text>
                            </Pressable>
                        )}

                        {onDelete && (
                            <Pressable
                                onPress={onDelete}
                                className="flex-row items-center px-3 py-2 bg-red-50 rounded-lg active:bg-red-100"
                            >
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                <Text className="text-sm font-semibold text-red-600 ml-1">
                                    Eliminar
                                </Text>
                            </Pressable>
                        )}
                    </View>
                )}
            </View>
        </Pressable>
    )
}
