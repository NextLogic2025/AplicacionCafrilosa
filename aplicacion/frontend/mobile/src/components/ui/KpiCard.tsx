/// <reference types="nativewind/types" />
import React from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface KpiCardProps {
    label: string
    value: string | number
    icon: string
    color: string
    fullWidth?: boolean
    columns?: 2 | 3
}

export function KpiCard({ label, value, icon, color, fullWidth = false, columns = 2 }: KpiCardProps) {
    const widthClass = fullWidth ? 'w-full' : columns === 3 ? 'w-[31%]' : 'w-[48%]'

    return (
        <View
            className={`bg-white p-4 rounded-xl border border-neutral-200 mb-3 shadow-sm ${widthClass}`}
        >
            <View className="flex-row justify-between items-start mb-2">
                <View className="p-2 rounded-lg bg-neutral-50" style={{ backgroundColor: `${color}15` }}>
                    <Ionicons name={icon as any} size={20} color={color} />
                </View>
            </View>
            <Text className="text-2xl font-bold text-neutral-900 mb-1">{value}</Text>
            <Text className="text-xs text-neutral-500 font-medium">{label}</Text>
        </View>
    )
}
