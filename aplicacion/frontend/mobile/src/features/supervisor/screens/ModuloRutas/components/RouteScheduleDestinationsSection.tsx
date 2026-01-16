import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { FREQUENCIES, PRIORITIES } from '../routeSchedule.constants'
import type { DestinationConfig } from '../routeSchedule.types'

type Props = {
  zoneId: number | string
  destinationConfigs: DestinationConfig[]
  sortedConfigs: DestinationConfig[]
  onRemoveDestination: (index: number) => void
  onOpenTimePicker: (index: number) => void
  onOpenPriorityPicker: (index: number) => void
  onOpenFrequencyPicker: (index: number) => void
}

export function RouteScheduleDestinationsSection({
  zoneId,
  destinationConfigs,
  sortedConfigs,
  onRemoveDestination,
  onOpenTimePicker,
  onOpenPriorityPicker,
  onOpenFrequencyPicker,
}: Props) {
  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold text-neutral-900">
          <Text className="text-red-500">1.</Text> Configurar destinos
        </Text>
        <View className="bg-blue-100 px-2 py-1 rounded-full">
          <Text className="text-blue-700 text-[10px] font-bold">Orden automático</Text>
        </View>
      </View>

      <Text className="text-neutral-500 text-xs mb-3">
        Asigna hora, prioridad y frecuencia a cada destino. Se ordenan automáticamente.
      </Text>

      {sortedConfigs.map((config, displayIndex) => {
        const originalIndex = destinationConfigs.findIndex(c => c.destino.id === config.destino.id)
        const priorityInfo = PRIORITIES.find((p) => p.id === config.prioridad)
        const isOtherZone = config.destino.zoneId !== zoneId
        const borderColor = (priorityInfo?.color || '#F59E0B') + '40'
        const headerBg = (priorityInfo?.color || '#F59E0B') + '10'

        return (
          <View key={config.destino.id} className="bg-white rounded-2xl mb-3 border overflow-hidden" style={{ borderColor }}>
            <View className="px-4 py-3 flex-row items-center" style={{ backgroundColor: headerBg }}>
              <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: priorityInfo?.color || '#F59E0B' }}>
                <Text className="text-white font-bold">{displayIndex + 1}</Text>
              </View>

              <View className="flex-1">
                <View className="flex-row items-center">
                  <Ionicons name={config.destino.type === 'branch' ? 'storefront' : 'business'} size={14} color="#525252" />
                  <Text className="text-neutral-900 font-bold ml-1.5" numberOfLines={1}>
                    {config.destino.name}
                  </Text>
                </View>
                {config.destino.type === 'branch' && <Text className="text-neutral-500 text-xs">De: {config.destino.clientName}</Text>}
              </View>

              {isOtherZone && (
                <View className="bg-purple-100 px-2 py-0.5 rounded-full mr-2">
                  <Text className="text-purple-700 text-[10px]">Otra zona</Text>
                </View>
              )}

              <TouchableOpacity onPress={() => onRemoveDestination(originalIndex)} className="p-1">
                <Ionicons name="close-circle" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <View className="px-4 py-3">
              <View className="flex-row gap-3 mb-2">
                <TouchableOpacity
                  onPress={() => onOpenTimePicker(originalIndex)}
                  className={`flex-1 p-3 rounded-xl border flex-row items-center ${config.hora ? 'bg-green-50 border-green-200' : 'bg-neutral-50 border-neutral-200'
                    }`}
                >
                  <Ionicons name="time" size={18} color={config.hora ? '#22C55E' : '#9CA3AF'} />
                  <View className="ml-2 flex-1">
                    <Text className="text-[10px] text-neutral-400">HORA</Text>
                    <Text className={`font-bold ${config.hora ? 'text-green-700' : 'text-neutral-400'}`}>{config.hora || 'Asignar'}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onOpenPriorityPicker(originalIndex)}
                  className="flex-1 p-3 rounded-xl border flex-row items-center"
                  style={{ backgroundColor: headerBg, borderColor }}
                >
                  <View className="w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: priorityInfo?.color || '#F59E0B' }}>
                    <Ionicons name={priorityInfo?.icon || 'time'} size={12} color="white" />
                  </View>
                  <View className="ml-2 flex-1">
                    <Text className="text-[10px] text-neutral-400">PRIORIDAD</Text>
                    <Text className="font-bold" style={{ color: priorityInfo?.color || '#F59E0B' }}>
                      {config.prioridad}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => onOpenFrequencyPicker(originalIndex)}
                className="p-3 rounded-xl border bg-indigo-50 border-indigo-200 flex-row items-center"
              >
                <Ionicons name="repeat" size={18} color="#6366F1" />
                <View className="ml-2 flex-1">
                  <Text className="text-[10px] text-neutral-400">FRECUENCIA</Text>
                  <Text className="font-bold text-indigo-700">
                    {FREQUENCIES.find((f) => f.id === config.frecuencia)?.label || config.frecuencia}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        )
      })}

      <View className="bg-blue-50 p-3 rounded-xl flex-row items-start">
        <Ionicons name="information-circle" size={18} color="#3B82F6" />
        <Text className="text-blue-700 text-xs ml-2 flex-1">
          El orden de visita se calcula automáticamente: primero prioridad ALTA, luego MEDIA, luego BAJA. Dentro de la misma prioridad, se ordena por hora.
        </Text>
      </View>
    </View>
  )
}

