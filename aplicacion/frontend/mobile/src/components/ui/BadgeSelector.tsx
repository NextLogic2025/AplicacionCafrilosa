import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

export interface BadgeOption {
    id: string
    label: string
    color?: string
    icon?: React.ReactNode
}

interface BadgeSelectorProps<T extends string> {
    options: BadgeOption[]
    selected: T
    onSelect: (value: T) => void
    variant?: 'default' | 'colored'
    size?: 'sm' | 'md' | 'lg'
}

export function BadgeSelector<T extends string>({
    options,
    selected,
    onSelect,
    variant = 'default',
    size = 'md'
}: BadgeSelectorProps<T>) {
    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return 'px-3 py-2'
            case 'lg':
                return 'px-6 py-4'
            default:
                return 'px-4 py-3'
        }
    }

    const getTextSize = () => {
        switch (size) {
            case 'sm':
                return 'text-xs'
            case 'lg':
                return 'text-base'
            default:
                return 'text-sm'
        }
    }

    return (
        <View className="flex-row flex-wrap gap-2">
            {options.map((opt) => {
                const isSelected = selected === opt.id

                let bgColor = 'bg-white'
                let borderColor = 'border-neutral-200'
                let textColor = 'text-neutral-600'

                if (isSelected) {
                    if (variant === 'colored' && opt.color) {
                        bgColor = `bg-${opt.color}-50`
                        borderColor = `border-${opt.color}-500`
                        textColor = `text-${opt.color}-700`
                    } else {
                        bgColor = 'bg-red-50'
                        borderColor = 'border-red-500'
                        textColor = 'text-red-700'
                    }
                }

                return (
                    <TouchableOpacity
                        key={opt.id}
                        onPress={() => onSelect(opt.id as T)}
                        className={`${getSizeStyles()} items-center justify-center rounded-xl border-2 ${bgColor} ${borderColor} ${isSelected ? 'shadow-sm' : ''}`}
                    >
                        <View className="flex-row items-center gap-2">
                            {opt.icon}
                            <Text className={`font-bold ${getTextSize()} ${isSelected ? textColor : 'text-neutral-600'}`}>
                                {opt.label}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )
            })}
        </View>
    )
}
