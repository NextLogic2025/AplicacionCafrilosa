import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type Props = {
  zoneName: string
  destinationsCount: number
  onAddMore: () => void
}

export function RouteScheduleZoneSummaryCard({ zoneName, destinationsCount, onAddMore }: Props) {
  return (
    <View className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-2xl border border-indigo-100 mb-6">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-indigo-700 text-xs uppercase font-bold">Paso 1 completado</Text>
        <TouchableOpacity onPress={onAddMore} className="bg-blue-500 px-3 py-1.5 rounded-full flex-row items-center">
          <Ionicons name="add" size={14} color="white" />
          <Text className="text-white text-xs font-bold ml-1">Agregar más</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center mb-2">
        <Ionicons name="map" size={16} color="#4F46E5" />
        <Text className="text-neutral-900 font-medium ml-2">Zona: {zoneName}</Text>
      </View>
      <View className="flex-row items-center">
        <Ionicons name="business" size={16} color="#3B82F6" />
        <Text className="text-neutral-900 font-medium ml-2">{destinationsCount} destino(s) a visitar</Text>
      </View>
    </View>
  )
}


