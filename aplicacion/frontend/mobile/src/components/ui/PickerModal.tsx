import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { GenericModal } from './GenericModal'

export type PickerOption = {
  id: string
  label: string
  description?: string
  icon?: keyof typeof Ionicons.glyphMap
  color?: string
}

type Props = {
  visible: boolean
  title: string
  options: PickerOption[]
  selectedId?: string
  onSelect: (id: string) => void
  onClose: () => void
  infoText?: string
  infoIcon?: keyof typeof Ionicons.glyphMap
  infoColor?: string
}

export function PickerModal({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
  infoText,
  infoIcon = 'information-circle',
  infoColor = '#6366F1',
}: Props) {
  const getInfoBgColor = () => {
    if (infoColor === '#6366F1') return '#EEF2FF' // indigo-50
    if (infoColor === '#F59E0B') return '#FFFBEB' // amber-50
    if (infoColor === '#EF4444') return '#FEF2F2' // red-50
    if (infoColor === '#22C55E') return '#F0FDF4' // green-50
    if (infoColor === '#3B82F6') return '#EFF6FF' // blue-50
    return '#F3F4F6' // neutral-100
  }

  return (
    <GenericModal visible={visible} title={title} onClose={onClose}>
      <View>
        {infoText && (
          <View
            className="p-3 rounded-xl mb-4 flex-row items-center"
            style={{ backgroundColor: getInfoBgColor() }}
          >
            <Ionicons name={infoIcon} size={20} color={infoColor} />
            <Text className="text-sm ml-2 flex-1" style={{ color: infoColor }}>
              {infoText}
            </Text>
          </View>
        )}

        <View className="gap-3">
          {options.map(option => {
            const isSelected = selectedId === option.id
            const optionColor = option.color || infoColor

            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => onSelect(option.id)}
                className={`p-4 rounded-2xl border-2 flex-row items-center ${
                  isSelected ? 'border-opacity-100' : 'bg-white border-neutral-200'
                }`}
                style={{
                  backgroundColor: isSelected ? `${optionColor}10` : 'white',
                  borderColor: isSelected ? optionColor : '#E5E7EB',
                }}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-4"
                  style={{
                    backgroundColor: isSelected ? optionColor : '#E5E7EB',
                  }}
                >
                  <Ionicons
                    name={option.icon || 'ellipse'}
                    size={20}
                    color={isSelected ? 'white' : '#6B7280'}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="font-bold text-base"
                    style={{ color: isSelected ? optionColor : '#404040' }}
                  >
                    {option.label}
                  </Text>
                  {option.description && (
                    <Text className="text-neutral-500 text-xs">{option.description}</Text>
                  )}
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={24} color={optionColor} />}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </GenericModal>
  )
}
