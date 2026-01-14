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
}

export function KpiCard({ label, value, icon, color, fullWidth = false }: KpiCardProps) {
    return (
        <View
            className={`bg-white p-4 rounded-xl border border-neutral-200 mb-3 shadow-sm ${fullWidth ? 'w-full' : 'w-[48%]'}`}
        >
            <View className="flex-row justify-between items-start mb-2">
                <View className="p-2 rounded-lg bg-neutral-50" style={{ backgroundColor: `${color}15` }}>
                    <Ionicons name={icon as any} size={20} color={color} />
                </View>
                {/* Optional Badge */}
            </View>
            <Text className="text-2xl font-bold text-neutral-900 mb-1">{value}</Text>
            <Text className="text-xs text-neutral-500 font-medium">{label}</Text>
        </View>
    )
}
