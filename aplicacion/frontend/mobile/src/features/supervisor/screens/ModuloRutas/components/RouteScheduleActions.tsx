import React from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../../shared/types'

type Props = {
  canSave: boolean
  loading: boolean
  onHome: () => void
  onSave: () => void
}

export function RouteScheduleActions({ canSave, loading, onHome, onSave }: Props) {
  return (
    <View className="flex-row gap-3">
      <TouchableOpacity onPress={onHome} className="flex-1 py-5 rounded-2xl items-center border-2 border-neutral-300 bg-white">
        <View className="flex-row items-center">
          <Ionicons name="home" size={18} color="#525252" />
          <Text className="text-neutral-700 font-bold text-base ml-2">Inicio</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSave}
        disabled={!canSave || loading}
        className="flex-2 py-5 rounded-2xl items-center shadow-lg px-8"
        style={{ backgroundColor: canSave && !loading ? BRAND_COLORS.red : '#D1D5DB' }}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <View className="flex-row items-center">
            <Ionicons name="save" size={18} color="white" />
            <Text className="text-white font-bold text-base ml-2">Guardar</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  )
}


