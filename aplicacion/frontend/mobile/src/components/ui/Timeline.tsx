import React from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../shared/types'

export interface TimelineStep {
    title: string
    description?: string
    status: 'completed' | 'current' | 'pending'
    date?: string
}

interface TimelineProps {
    steps: TimelineStep[]
}

export function Timeline({ steps }: TimelineProps) {
    return (
        <View className="py-2">
            {steps.map((step, index) => {
                const isLast = index === steps.length - 1
                let iconName: keyof typeof Ionicons.glyphMap = 'radio-button-off'
                let color = '#D1D5DB' // gray-300

                if (step.status === 'completed') {
                    iconName = 'checkmark-circle'
                    color = '#059669' // green-600
                } else if (step.status === 'current') {
                    iconName = 'radio-button-on'
                    color = BRAND_COLORS.red
                }

                return (
                    <View key={index} className="flex-row">
                        <View className="items-center mr-4 w-6">
                            <Ionicons name={iconName} size={24} color={color} />
                            {!isLast && (
                                <View
                                    className={`w-0.5 flex-1 my-1 ${step.status === 'completed' ? 'bg-green-600' : 'bg-neutral-200'}`}
                                />
                            )}
                        </View>
                        <View className="flex-1 pb-8">
                            <Text className={`text-base font-bold ${step.status === 'pending' ? 'text-neutral-400' : 'text-neutral-900'}`}>
                                {step.title}
                            </Text>
                            {step.description && (
                                <Text className="text-neutral-500 text-xs mt-0.5">
                                    {step.description}
                                </Text>
                            )}
                            {step.date && (
                                <Text className="text-neutral-400 text-[10px] mt-1">
                                    {step.date}
                                </Text>
                            )}
                        </View>
                    </View>
                )
            })}
        </View>
    )
}
