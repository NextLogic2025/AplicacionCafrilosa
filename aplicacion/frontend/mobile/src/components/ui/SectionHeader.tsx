import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface SectionHeaderProps {
    title: string
    subtitle?: string
    icon?: keyof typeof Ionicons.glyphMap
    iconColor?: string
    action?: {
        label: string
        onPress: () => void
        icon?: keyof typeof Ionicons.glyphMap
    }
    variant?: 'default' | 'large' | 'compact'
}

export function SectionHeader({
    title,
    subtitle,
    icon,
    iconColor = '#6B7280',
    action,
    variant = 'default'
}: SectionHeaderProps) {
    const getTitleSize = () => {
        switch (variant) {
            case 'large':
                return 'text-xl'
            case 'compact':
                return 'text-xs'
            default:
                return 'text-sm'
        }
    }

    return (
        <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center flex-1">
                {icon && (
                    <View className="mr-2">
                        <Ionicons name={icon} size={variant === 'large' ? 24 : 18} color={iconColor} />
                    </View>
                )}
                <View className="flex-1">
                    <Text className={`font-bold text-neutral-900 ${getTitleSize()} uppercase tracking-wide`}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text className="text-xs text-neutral-500 mt-0.5">
                            {subtitle}
                        </Text>
                    )}
                </View>
            </View>

            {action && (
                <TouchableOpacity
                    onPress={action.onPress}
                    className="flex-row items-center bg-red-50 px-3 py-2 rounded-lg border border-red-200"
                >
                    {action.icon && (
                        <Ionicons name={action.icon} size={14} color="#DC2626" style={{ marginRight: 4 }} />
                    )}
                    <Text className="text-red-600 font-bold text-xs">
                        {action.label}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    )
}
