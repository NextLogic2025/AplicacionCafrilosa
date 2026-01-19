import React from 'react'
import { View, Text } from 'react-native'
import { DAYS, FREQUENCIES } from '../routeSchedule.constants'
import type { DestinationConfig } from '../routeSchedule.types'

type Props = {
  zoneName: string
  destinationConfigs: DestinationConfig[]
  selectedDays: number[]
  totalRoutes: number
}

export function RouteScheduleSummaryCard({ zoneName, destinationConfigs, selectedDays, totalRoutes }: Props) {
  if (selectedDays.length === 0) return null

  const freqCounts = destinationConfigs.reduce((acc, c) => {
    acc[c.frecuencia] = (acc[c.frecuencia] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const freqText = Object.entries(freqCounts)
    .map(([f, count]) => `${count} ${FREQUENCIES.find(fr => fr.id === f)?.label?.toLowerCase() || f}`)
    .join(', ')

  return (
    <View className="bg-neutral-900 p-5 rounded-2xl mb-6">
      <Text className="text-white font-bold text-lg mb-3">Resumen final</Text>
      <View className="space-y-2">
        <View className="flex-row mt-1">
          <Text className="text-neutral-400 w-24">Zona:</Text>
          <Text className="text-white font-medium flex-1">{zoneName}</Text>
        </View>
        <View className="flex-row mt-1">
          <Text className="text-neutral-400 w-24">Destinos:</Text>
          <Text className="text-white font-medium flex-1">{destinationConfigs.length}</Text>
        </View>
        <View className="flex-row mt-1">
          <Text className="text-neutral-400 w-24">Días:</Text>
          <Text className="text-white font-medium flex-1">{selectedDays.map(d => DAYS.find(day => day.id === d)?.label).join(', ')}</Text>
        </View>
        <View className="flex-row mt-1">
          <Text className="text-neutral-400 w-24">Frecuencias:</Text>
          <Text className="text-white font-medium flex-1">{freqText}</Text>
        </View>
        <View className="border-t border-neutral-700 pt-3 mt-3">
          <Text className="text-white font-bold text-center">Total: {totalRoutes} ruta(s) a crear</Text>
        </View>
      </View>
    </View>
  )
}


