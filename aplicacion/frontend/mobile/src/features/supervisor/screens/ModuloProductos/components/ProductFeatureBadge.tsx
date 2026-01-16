import React from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../../shared/types'

type Props = {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  active: boolean
}

export function ProductFeatureBadge({ icon, label, active }: Props) {
  return (
    <View className="flex-row items-center px-3 py-2 rounded-xl mr-2 mb-2" style={active ? { backgroundColor: BRAND_COLORS.red } : { backgroundColor: '#F3F4F6' }}>
      <Ionicons name={icon} size={16} color={active ? 'white' : '#9CA3AF'} />
      <Text className={`text-xs font-semibold ml-1.5 ${active ? 'text-white' : 'text-neutral-400'}`}>{label}</Text>
    </View>
  )
}

