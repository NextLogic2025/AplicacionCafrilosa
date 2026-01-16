import React from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../shared/types'

export type Step = {
  id: number
  label: string
}

type Props = {
  steps: Step[]
  currentStep: number
  helperText?: string
  completedColor?: string
  activeColor?: string
}

export function StepIndicator({
  steps,
  currentStep,
  helperText,
  completedColor = '#22C55E',
  activeColor = BRAND_COLORS.red,
}: Props) {
  return (
    <View className="bg-white rounded-2xl p-4 mb-6 border border-neutral-100">
      <View className="flex-row items-center justify-center mb-3">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id
          const isLast = index === steps.length - 1

          return (
            <React.Fragment key={step.id}>
              <View className="items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isCompleted
                      ? completedColor
                      : isActive
                        ? activeColor
                        : '#E5E7EB',
                  }}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={20} color="white" />
                  ) : (
                    <Text
                      className="font-bold"
                      style={{ color: isActive ? 'white' : '#6B7280' }}
                    >
                      {step.id}
                    </Text>
                  )}
                </View>
                <Text
                  className="text-xs font-medium mt-1"
                  style={{
                    color: isCompleted
                      ? completedColor
                      : isActive
                        ? activeColor
                        : '#9CA3AF',
                  }}
                >
                  {step.label}
                </Text>
              </View>

              {!isLast && (
                <View
                  className="w-12 h-1 mx-3"
                  style={{
                    backgroundColor: isCompleted ? activeColor : '#E5E7EB',
                  }}
                />
              )}
            </React.Fragment>
          )
        })}
      </View>

      {helperText && (
        <Text className="text-center text-neutral-600 text-sm">{helperText}</Text>
      )}
    </View>
  )
}
