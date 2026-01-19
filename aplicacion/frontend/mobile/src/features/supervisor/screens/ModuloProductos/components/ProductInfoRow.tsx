import React from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type Props = {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: string
  valueColor?: string
}

export function ProductInfoRow({ icon, label, value, valueColor = 'text-neutral-900' }: Props) {
  return (
    <View className="flex-row items-center py-3 border-b border-neutral-100">
      <View className="w-9 h-9 rounded-lg bg-neutral-100 items-center justify-center mr-3">
        <Ionicons name={icon} size={18} color="#6B7280" />
      </View>
      <View className="flex-1">
        <Text className="text-neutral-500 text-xs mb-0.5">{label}</Text>
        <Text className={`font-semibold text-sm ${valueColor}`}>{value || 'No especificado'}</Text>
      </View>
    </View>
  )
}

