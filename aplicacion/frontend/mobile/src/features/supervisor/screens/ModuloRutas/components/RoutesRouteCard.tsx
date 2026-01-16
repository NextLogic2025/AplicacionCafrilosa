import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { BRAND_COLORS } from '../../../../../shared/types'
import { Ionicons } from '@expo/vector-icons'
import { StatusBadge } from '../../../../../components/ui/StatusBadge'
import type { RoutePlanWithClient } from '../routes.types'

type Props = {
  item: RoutePlanWithClient
  index: number
  priorityBadge: { variant: 'error' | 'warning' | 'success' | 'info'; label: string }
  frequencyLabel: string
  onPress: () => void
  onView: () => void
  onEdit: () => void
  onDeactivate: () => void
}

export function RoutesRouteCard({ item, index, priorityBadge, frequencyLabel, onPress, onView, onEdit, onDeactivate }: Props) {
  const isBranch = !!item.sucursal
  const address = isBranch ? item.sucursal?.direccion_entrega : item.cliente?.direccion_texto

  return (
    <TouchableOpacity
      key={item.id}
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm border border-neutral-100"
    >
      <View className="bg-neutral-50 px-4 py-3 flex-row items-center justify-between border-b border-neutral-100">
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-full bg-red-500 items-center justify-center mr-3">
            <Text className="text-white font-bold text-lg">{index + 1}</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <View className={`w-5 h-5 rounded-full items-center justify-center mr-1.5 ${isBranch ? 'bg-orange-100' : 'bg-green-100'}`}>
                <Ionicons name={isBranch ? 'storefront' : 'business'} size={10} color={isBranch ? BRAND_COLORS.gold : '#22C55E'} />
              </View>
              <Text className="text-neutral-900 font-bold text-base flex-1" numberOfLines={1}>
                {isBranch ? item.sucursal?.nombre_sucursal : item.cliente?.nombre_comercial || 'Cliente sin nombre'}
              </Text>
            </View>
            {isBranch ? (
              <Text className="text-neutral-400 text-xs mt-0.5">De: {item.cliente?.nombre_comercial}</Text>
            ) : (
              <Text className="text-neutral-500 text-xs">{item.cliente?.identificacion}</Text>
            )}
          </View>
        </View>
        <StatusBadge label={priorityBadge.label} variant={priorityBadge.variant} />
      </View>

      <View className="px-4 py-3">
        <View className="flex-row flex-wrap gap-2 mb-3">
          <View className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-full">
            <Ionicons name="repeat" size={14} color="#3B82F6" />
            <Text className="text-blue-700 text-xs font-medium ml-1">{frequencyLabel}</Text>
          </View>

          {!!item.hora_estimada_arribo && (
            <View className="flex-row items-center bg-green-50 px-3 py-1.5 rounded-full">
              <Ionicons name="time" size={14} color="#22C55E" />
              <Text className="text-green-700 text-xs font-medium ml-1">{item.hora_estimada_arribo}</Text>
            </View>
          )}
        </View>

        {!!address && (
          <View className="flex-row items-start">
            <Ionicons name="location-outline" size={16} color="#9CA3AF" />
            <Text className="text-neutral-500 text-sm ml-2 flex-1" numberOfLines={2}>
              {address}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row border-t border-neutral-100">
        <TouchableOpacity
          className="flex-1 py-3 flex-row items-center justify-center border-r border-neutral-100"
          onPress={e => {
            e.stopPropagation()
            onView()
          }}
        >
          <Ionicons name="eye-outline" size={18} color="#3B82F6" />
          <Text className="text-blue-500 font-medium ml-2">Ver</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 py-3 flex-row items-center justify-center border-r border-neutral-100"
          onPress={e => {
            e.stopPropagation()
            onEdit()
          }}
        >
          <Ionicons name="pencil-outline" size={18} color="#22C55E" />
          <Text className="text-green-500 font-medium ml-2">Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 py-3 flex-row items-center justify-center"
          onPress={e => {
            e.stopPropagation()
            onDeactivate()
          }}
        >
          <Ionicons name="eye-off-outline" size={18} color={BRAND_COLORS.red} />
          <Text className="text-red-500 font-medium ml-2">Desactivar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}


