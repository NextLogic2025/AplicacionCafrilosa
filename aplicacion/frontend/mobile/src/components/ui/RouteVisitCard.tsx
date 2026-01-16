import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface RouteVisitCardProps {
    clientName: string
    ownerName?: string | null
    address?: string
    time?: string
    dayOfWeek: number
    priority: 'ALTA' | 'MEDIA' | 'BAJA' | 'NORMAL'
    frequency: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'
    order?: number
    onPress: () => void
    isToday?: boolean
}

export function RouteVisitCard({
    clientName,
    ownerName,
    address,
    time,
    dayOfWeek,
    priority,
    frequency,
    order,
    onPress,
    isToday = false
}: RouteVisitCardProps) {

    const getDayName = (day: number): string => {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        return days[day] || 'Día desconocido'
    }

    const getPriorityColor = () => {
        switch (priority) {
            case 'ALTA':
                return { bg: '#FEE2E2', text: '#DC2626', icon: '#EF4444' }
            case 'MEDIA':
                return { bg: '#FEF3C7', text: '#D97706', icon: '#F59E0B' }
            case 'BAJA':
                return { bg: '#DBEAFE', text: '#1D4ED8', icon: '#3B82F6' }
            default:
                return { bg: '#F3F4F6', text: '#6B7280', icon: '#9CA3AF' }
        }
    }

    const priorityColors = getPriorityColor()

    return (
        <TouchableOpacity
            className={`bg-white rounded-2xl mb-3 border shadow-sm ${isToday ? 'border-2 border-red-600 bg-yellow-50' : 'border border-gray-200'}`}
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 3,
                overflow: 'visible'
            }}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View className="flex-row justify-between items-center px-4 pt-3 pb-2">
                <View className="flex-row items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg min-w-[50px]">
                    <Ionicons name="list" size={12} color="#6B7280" />
                    <Text className="text-[11px] font-bold text-gray-700">#{order || 0}</Text>
                </View>

                <View className="flex-row items-center gap-2">
                    <View
                        className="flex-row items-center gap-1 px-2 py-1 rounded-lg"
                        style={{ backgroundColor: priorityColors.bg }}
                    >
                        <Ionicons name="flag" size={10} color={priorityColors.icon} />
                        <Text className="text-[10px] font-bold" style={{ color: priorityColors.text }}>
                            {priority}
                        </Text>
                    </View>

                    {isToday && (
                        <View
                            className="bg-red-600 px-2 py-0.5 rounded-lg shadow-sm"
                            style={{
                                shadowColor: '#DC2626',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.3,
                                shadowRadius: 2,
                                elevation: 3
                            }}
                        >
                            <Text className="text-[9px] font-extrabold text-white tracking-wider">HOY</Text>
                        </View>
                    )}
                </View>
            </View>

            <View className="px-4 py-3 gap-2 border-b border-gray-100">
                <View className="flex-row items-start gap-3 mb-1">
                    <View className="w-9 h-9 rounded-full bg-red-100 justify-center items-center">
                        <Ionicons name="business" size={18} color="#DC2626" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-base font-bold text-gray-900 mb-1" numberOfLines={1}>
                            {clientName}
                        </Text>
                        {ownerName && (
                            <View className="flex-row items-center gap-1 mt-0.5">
                                <Ionicons name="person-outline" size={12} color="#9CA3AF" />
                                <Text className="text-xs font-medium text-gray-400 flex-1" numberOfLines={1}>
                                    {ownerName}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <View className="flex-row items-center gap-2">
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                    <Text className="text-[13px] font-medium text-gray-700 flex-1">{getDayName(dayOfWeek)}</Text>
                </View>

                {time && (
                    <View className="flex-row items-center gap-2">
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text className="text-[13px] font-medium text-gray-700 flex-1">
                            {time.substring(0, 5)} hrs
                        </Text>
                    </View>
                )}

                <View className="flex-row items-center gap-2">
                    <Ionicons name="repeat-outline" size={14} color="#6B7280" />
                    <Text className="text-[13px] font-medium text-gray-700 flex-1">
                        {frequency}
                    </Text>
                </View>
            </View>

            <View className="flex-row justify-between items-center px-4 py-3 bg-gray-50">
                <Text className="text-sm font-bold text-red-600">Ver detalles del cliente</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
        </TouchableOpacity>
    )
}
