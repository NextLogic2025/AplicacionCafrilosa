import React from 'react'
import { View, Text, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface DashboardCardProps {
    label: string
    value: string | number
    icon: string
    color: string
    style?: ViewStyle
    fullWidth?: boolean
    columns?: 2 | 3
}

export function DashboardCard({
    label,
    value,
    icon,
    color,
    style,
    fullWidth = false,
    columns
}: DashboardCardProps) {
    // If specific columns prop is provided or fullWidth, calculate width, otherwise default to flex-1 (for row layouts)
    let widthClass = 'flex-1'

    if (fullWidth) {
        widthClass = 'w-full'
    } else if (columns === 3) {
        widthClass = 'w-[31%]'
    } else if (columns === 2) {
        widthClass = 'w-[48%]'
    }

    return (
        <View
            className={`bg-white p-3 rounded-xl items-center shadow-sm border border-neutral-100 ${widthClass} mx-1.5`}
            style={style}
        >
            <View
                className="p-2 rounded-full mb-2"
                style={{ backgroundColor: `${color}15` }}
            >
                <Ionicons name={icon as any} size={20} color={color} />
            </View>
            <Text className="text-2xl font-bold text-neutral-900">{value}</Text>
            <Text className="text-[10px] text-neutral-400 uppercase font-medium text-center">{label}</Text>
        </View>
    )
}
