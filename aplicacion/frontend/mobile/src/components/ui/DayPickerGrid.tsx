import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../shared/types'

export type Day = {
  id: number
  label: string
  short: string
}

type Props = {
  days: Day[]
  selectedDays: number[]
  onToggleDay: (dayId: number) => void
  summaryText?: string
  title?: string | React.ReactNode
  activeColor?: string
}

export function DayPickerGrid({
  days,
  selectedDays,
  onToggleDay,
  summaryText,
  title,
  activeColor = BRAND_COLORS.red,
}: Props) {
  return (
    <View className="mb-6">
      {title && (
        typeof title === 'string'
          ? <Text className="text-lg font-bold text-neutral-900 mb-3">{title}</Text>
          : <View className="mb-3">{title}</View>
      )}

      <View className="flex-row justify-between">
        {days.map(day => {
          const isSelected = selectedDays.includes(day.id)
          return (
            <TouchableOpacity
              key={day.id}
              onPress={() => onToggleDay(day.id)}
              className={`flex-1 mx-1 py-4 rounded-2xl items-center border-2 ${
                isSelected ? '' : 'bg-white border-neutral-200'
              }`}
              style={{
                backgroundColor: isSelected ? activeColor : 'white',
                borderColor: isSelected ? activeColor : '#E5E7EB',
              }}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: isSelected ? `${activeColor}40` : '#9CA3AF' }}
              >
                {day.short}
              </Text>
              <Text
                className="font-bold text-sm mt-1"
                style={{ color: isSelected ? 'white' : '#404040' }}
              >
                {day.label.substring(0, 3)}
              </Text>
              {isSelected && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color="white"
                  style={{ marginTop: 4 }}
                />
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      {summaryText && selectedDays.length > 0 && (
        <Text className="text-green-600 text-xs mt-2 text-center font-medium">
          {summaryText}
        </Text>
      )}
    </View>
  )
}
