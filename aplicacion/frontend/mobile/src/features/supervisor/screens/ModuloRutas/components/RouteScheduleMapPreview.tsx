import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps'
import type { DestinationConfig } from '../routeSchedule.types'
import { getPriorityColor } from '../routeSchedule.utils'

type Props = {
  destinationsWithLocation: DestinationConfig[]
  mapRegion: Region
  routePath: Array<{ latitude: number; longitude: number }>
  onExpand: () => void
}

export function RouteScheduleMapPreview({ destinationsWithLocation, mapRegion, routePath, onExpand }: Props) {
  if (destinationsWithLocation.length === 0) return null

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold text-neutral-900">
          <Text className="text-red-500">3.</Text> Vista de ruta
        </Text>
        <TouchableOpacity onPress={onExpand} className="flex-row items-center bg-neutral-100 px-3 py-2 rounded-xl">
          <Ionicons name="expand" size={16} color="#525252" />
          <Text className="text-neutral-700 font-medium text-xs ml-1">Ampliar</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onExpand} className="h-44 rounded-2xl overflow-hidden border border-neutral-200">
        <MapView provider={PROVIDER_GOOGLE} style={{ flex: 1 }} region={mapRegion} scrollEnabled={false} zoomEnabled={false}>
          {routePath.length > 1 && <Polyline coordinates={routePath} strokeColor="#3B82F6" strokeWidth={3} lineDashPattern={[10, 5]} />}
          {destinationsWithLocation.map((config, index) => {
            const prioColor = getPriorityColor(config.prioridad)
            return (
              <Marker key={config.destino.id} coordinate={config.destino.location!} title={config.destino.name}>
                <View className="items-center">
                  <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: prioColor }}>
                    <Text className="text-white font-bold text-sm">{index + 1}</Text>
                  </View>
                </View>
              </Marker>
            )
          })}
        </MapView>
        <View className="absolute bottom-3 left-3 bg-white/90 px-3 py-2 rounded-lg flex-row items-center">
          <Ionicons name="navigate" size={14} color="#3B82F6" />
          <Text className="text-neutral-700 text-xs font-medium ml-1">{destinationsWithLocation.length} puntos</Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}


