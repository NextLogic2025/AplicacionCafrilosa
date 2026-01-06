
import React from 'react'
import { View, Text } from 'react-native'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Ionicons } from '@expo/vector-icons'

interface Props {
    currentStep: number // 1, 2, or 3
    totalSteps?: number
    labels?: string[]
}

export function WizardProgress({ currentStep, totalSteps = 3, labels = ['Datos', 'Ubicación', 'Sucursales'] }: Props) {
    const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

    return (
        <View className="flex-row items-center justify-between mb-6 px-4">
            {steps.map((step, index) => {
                const isActive = step === currentStep
                const isCompleted = step < currentStep
                const isLast = index === steps.length - 1

                return (
                    <React.Fragment key={step}>
                        {/* Step Circle */}
                        <View className="items-center">
                            <View
                                className={`w-10 h-10 rounded-full items-center justify-center border-2 mb-1 
                                ${isCompleted ? 'bg-red-500 border-red-500' : isActive ? 'bg-white border-red-500' : 'bg-neutral-100 border-neutral-200'}`}
                            >
                                {isCompleted ? (
                                    <Ionicons name="checkmark" size={20} color="white" />
                                ) : (
                                    <Text className={`font-bold ${isActive ? 'text-red-500' : 'text-neutral-400'}`}>
                                        {step}
                                    </Text>
                                )}
                            </View>
                            <Text className={`text-xs font-medium ${isActive ? 'text-neutral-900' : 'text-neutral-400'}`}>
                                {labels[index]}
                            </Text>
                        </View>

                        {/* Connector Line */}
                        {!isLast && (
                            <View className={`flex-1 h-1 mx-2 rounded-full ${isCompleted ? 'bg-red-500' : 'bg-neutral-200'}`} />
                        )}
                    </React.Fragment>
                )
            })}
        </View>
    )
}
