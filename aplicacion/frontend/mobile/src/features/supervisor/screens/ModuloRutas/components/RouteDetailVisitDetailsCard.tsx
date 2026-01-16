import React from 'react'
import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { RoutePlan } from '../../../../../services/api/RouteService'
import { DAYS, FREQUENCIES, PRIORITIES, type FrequencyType, type PriorityType } from '../routeSchedule.constants'

type Props = {
  isEditMode: boolean
  routeData: RoutePlan
  selectedDay: number
  setSelectedDay: (day: number) => void
  frequency: FrequencyType
  setFrequency: (freq: FrequencyType) => void
  priority: PriorityType
  setPriority: (prio: PriorityType) => void
  timeEstimate: string
  setTimeEstimate: (value: string) => void
  order: string
  setOrder: (value: string) => void
  priorityLabel: string
  priorityColor: string
  priorityIcon: any
}

export function RouteDetailVisitDetailsCard({
  isEditMode,
  routeData,
  selectedDay,
  setSelectedDay,
  frequency,
  setFrequency,
  priority,
  setPriority,
  timeEstimate,
  setTimeEstimate,
  order,
  setOrder,
  priorityLabel,
  priorityColor,
  priorityIcon,
}: Props) {
  const dayLabel = DAYS.find(d => d.id === routeData.dia_semana)?.label || ''
  const frequencyLabel = FREQUENCIES.find(f => f.id === routeData.frecuencia)?.label || routeData.frecuencia

  return (
    <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4 mb-5">
      <Text className="text-lg font-bold text-neutral-900 mb-4">Detalles de visita</Text>

      <View className="mb-4">
        <Text className="text-neutral-500 text-sm font-medium mb-2">Día de visita</Text>
        {isEditMode ? (
          <View className="flex-row justify-between">
            {DAYS.map(day => (
              <TouchableOpacity
                key={day.id}
                onPress={() => setSelectedDay(day.id)}
                className={`flex-1 mx-1 py-3 rounded-xl items-center ${selectedDay === day.id ? 'bg-red-500' : 'bg-neutral-100'}`}
              >
                <Text className={`text-xs font-bold ${selectedDay === day.id ? 'text-white' : 'text-neutral-600'}`}>{day.short}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="flex-row items-center">
            <View className="bg-red-100 px-4 py-2 rounded-xl">
              <Text className="text-red-700 font-bold">{dayLabel}</Text>
            </View>
          </View>
        )}
      </View>

      <View className="mb-4">
        <Text className="text-neutral-500 text-sm font-medium mb-2">Frecuencia</Text>
        {isEditMode ? (
          <View className="flex-row">
            {FREQUENCIES.map(freq => (
              <TouchableOpacity
                key={freq.id}
                onPress={() => setFrequency(freq.id)}
                className={`flex-1 mx-1 py-3 rounded-xl items-center flex-row justify-center ${
                  frequency === freq.id ? 'bg-blue-500' : 'bg-neutral-100'
                }`}
              >
                <Ionicons name={freq.icon} size={16} color={frequency === freq.id ? 'white' : '#6B7280'} />
                <Text className={`text-xs font-medium ml-1 ${frequency === freq.id ? 'text-white' : 'text-neutral-600'}`}>{freq.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="flex-row items-center">
            <View className="bg-blue-100 px-4 py-2 rounded-xl flex-row items-center">
              <Ionicons name="repeat" size={16} color="#3B82F6" />
              <Text className="text-blue-700 font-medium ml-2">{frequencyLabel}</Text>
            </View>
          </View>
        )}
      </View>

      <View className="mb-4">
        <Text className="text-neutral-500 text-sm font-medium mb-2">Prioridad</Text>
        {isEditMode ? (
          <View className="flex-row">
            {PRIORITIES.map(prio => {
              const isSelected = priority === prio.id
              return (
                <TouchableOpacity
                  key={prio.id}
                  onPress={() => setPriority(prio.id)}
                  className="flex-1 mx-1 py-3 rounded-xl items-center border-2"
                  style={isSelected ? { backgroundColor: prio.color + '20', borderColor: prio.color } : { backgroundColor: '#F5F5F5', borderColor: 'transparent' }}
                >
                  <Ionicons name={prio.icon} size={20} color={prio.color} />
                  <Text className="text-xs font-medium mt-1" style={{ color: prio.color }}>
                    {prio.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        ) : (
          <View className="flex-row items-center">
            <View className="px-4 py-2 rounded-xl flex-row items-center" style={{ backgroundColor: priorityColor + '20' }}>
              <Ionicons name={priorityIcon} size={16} color={priorityColor} />
              <Text className="font-medium ml-2" style={{ color: priorityColor }}>
                {priorityLabel}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View className="mb-4">
        <Text className="text-neutral-500 text-sm font-medium mb-2">Hora estimada de arribo</Text>
        {isEditMode ? (
          <TextInput
            value={timeEstimate}
            onChangeText={setTimeEstimate}
            placeholder="Ej: 09:00"
            className="bg-neutral-100 rounded-xl px-4 py-3 text-neutral-900"
            placeholderTextColor="#9CA3AF"
          />
        ) : (
          <View className="flex-row items-center">
            <View className="bg-green-100 px-4 py-2 rounded-xl flex-row items-center">
              <Ionicons name="time" size={16} color="#22C55E" />
              <Text className="text-green-700 font-medium ml-2">{routeData.hora_estimada_arribo || 'No especificada'}</Text>
            </View>
          </View>
        )}
      </View>

      <View>
        <Text className="text-neutral-500 text-sm font-medium mb-2">Orden en la ruta</Text>
        {isEditMode ? (
          <TextInput
            value={order}
            onChangeText={setOrder}
            placeholder="1"
            keyboardType="numeric"
            className="bg-neutral-100 rounded-xl px-4 py-3 text-neutral-900 w-24"
            placeholderTextColor="#9CA3AF"
          />
        ) : (
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-red-500 items-center justify-center">
              <Text className="text-white font-bold text-lg">{routeData.orden_sugerido || '?'}</Text>
            </View>
            <Text className="text-neutral-500 text-sm ml-3">Posición en el recorrido del día</Text>
          </View>
        )}
      </View>
    </View>
  )
}


