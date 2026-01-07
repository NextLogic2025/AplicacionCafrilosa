import React from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary'
export type BadgeSize = 'sm' | 'md' | 'lg'

interface StatusBadgeProps {
    label: string
    variant?: BadgeVariant
    size?: BadgeSize
    icon?: keyof typeof Ionicons.glyphMap
    outline?: boolean
}

export function StatusBadge({
    label,
    variant = 'neutral',
    size = 'md',
    icon,
    outline = false
}: StatusBadgeProps) {
    const getVariantStyles = () => {
        const styles = {
            success: outline
                ? 'bg-white border-green-500 text-green-700'
                : 'bg-green-100 border-green-200 text-green-800',
            warning: outline
                ? 'bg-white border-yellow-500 text-yellow-700'
                : 'bg-yellow-100 border-yellow-200 text-yellow-800',
            error: outline
                ? 'bg-white border-red-500 text-red-700'
                : 'bg-red-100 border-red-200 text-red-800',
            info: outline
                ? 'bg-white border-blue-500 text-blue-700'
                : 'bg-blue-100 border-blue-200 text-blue-800',
            primary: outline
                ? 'bg-white border-red-500 text-red-700'
                : 'bg-red-50 border-red-200 text-red-700',
            neutral: outline
                ? 'bg-white border-neutral-400 text-neutral-700'
                : 'bg-neutral-100 border-neutral-200 text-neutral-700'
        }
        return styles[variant]
    }

    const getIconColor = () => {
        const colors = {
            success: '#15803D',
            warning: '#A16207',
            error: '#DC2626',
            info: '#2563EB',
            primary: '#DC2626',
            neutral: '#4B5563'
        }
        return colors[variant]
    }

    const getSizeStyles = () => {
        const styles = {
            sm: { padding: 'px-2 py-0.5', text: 'text-[10px]', icon: 10 },
            md: { padding: 'px-3 py-1', text: 'text-xs', icon: 12 },
            lg: { padding: 'px-4 py-2', text: 'text-sm', icon: 14 }
        }
        return styles[size]
    }

    const sizeConfig = getSizeStyles()

    return (
        <View className={`flex-row items-center ${sizeConfig.padding} rounded-full border ${getVariantStyles()}`}>
            {icon && (
                <Ionicons
                    name={icon}
                    size={sizeConfig.icon}
                    color={getIconColor()}
                    style={{ marginRight: 4 }}
                />
            )}
            <Text className={`font-bold ${sizeConfig.text} ${getVariantStyles().split(' ').find(c => c.startsWith('text-'))}`}>
                {label}
            </Text>
        </View>
    )
}
