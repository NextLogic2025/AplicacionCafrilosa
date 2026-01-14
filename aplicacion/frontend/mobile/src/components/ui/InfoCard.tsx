import React from 'react'
import { View, Text, ViewStyle } from 'react-native'

interface InfoCardProps {
    label: string
    value?: string | number
    children?: React.ReactNode
    variant?: 'default' | 'highlighted' | 'subtle'
    className?: string
}

export function InfoCard({ label, value, children, variant = 'default', className = '' }: InfoCardProps) {
    const getVariantStyles = () => {
        switch (variant) {
            case 'highlighted':
                return 'bg-red-50 border-red-200'
            case 'subtle':
                return 'bg-neutral-50 border-neutral-100'
            default:
                return 'bg-white border-neutral-200'
        }
    }

    return (
        <View className={`p-4 rounded-xl border ${getVariantStyles()} ${className}`}>
            <Text className="text-xs font-bold text-neutral-500 uppercase mb-2 tracking-wide">
                {label}
            </Text>
            {value !== undefined ? (
                <Text className="text-base font-semibold text-neutral-900">
                    {value}
                </Text>
            ) : (
                children
            )}
        </View>
    )
}
