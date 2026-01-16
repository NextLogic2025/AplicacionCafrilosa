import React from 'react'
import { Modal, SafeAreaView, View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps'
import { FREQUENCIES } from '../routeSchedule.constants'
import type { DestinationConfig } from '../routeSchedule.types'
import { getPriorityColor } from '../routeSchedule.utils'

type Props = {
  visible: boolean
  onClose: () => void
  destinationsWithLocation: DestinationConfig[]
  mapRegion: Region
  routePath: Array<{ latitude: number; longitude: number }>
}

export function RouteScheduleFullscreenMapModal({ visible, onClose, destinationsWithLocation, mapRegion, routePath }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-200">
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#525252" />
          </TouchableOpacity>
          <Text className="text-lg font-bold">Mapa de ruta</Text>
          <View className="bg-blue-100 px-2 py-1 rounded-full">
            <Text className="text-blue-700 text-xs font-bold">{destinationsWithLocation.length} puntos</Text>
          </View>
        </View>

        <MapView provider={PROVIDER_GOOGLE} style={{ flex: 1 }} initialRegion={mapRegion} showsUserLocation showsMyLocationButton>
          {routePath.length > 1 && <Polyline coordinates={routePath} strokeColor="#3B82F6" strokeWidth={3} lineDashPattern={[10, 5]} />}
          {destinationsWithLocation.map((config, index) => {
            const prioColor = getPriorityColor(config.prioridad)
            return (
              <Marker
                key={config.destino.id}
                coordinate={config.destino.location!}
                title={`${index + 1}. ${config.destino.name}`}
                description={`${config.hora || 'Sin hora'} - ${config.prioridad}`}
              >
                <View className="items-center">
                  <View className="w-12 h-12 rounded-full items-center justify-center border-2 border-white" style={{ backgroundColor: prioColor }}>
                    <Text className="text-white font-bold text-lg">{index + 1}</Text>
                  </View>
                </View>
              </Marker>
            )
          })}
        </MapView>

        <View className="max-h-52 bg-white border-t border-neutral-200">
          <View className="px-4 py-2 bg-neutral-50 flex-row items-center justify-between">
            <Text className="text-neutral-700 font-bold text-sm">Orden de visita ({destinationsWithLocation.length})</Text>
            <Text className="text-neutral-500 text-xs">Prioridad/hora</Text>
          </View>
          <ScrollView className="px-4">
            {destinationsWithLocation.map((config, index) => {
              const prioColor = getPriorityColor(config.prioridad)
              const freqLabel = FREQUENCIES.find(f => f.id === config.frecuencia)?.label || config.frecuencia
              return (
                <View key={config.destino.id} className="flex-row items-center py-3 border-b border-neutral-100">
                  <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: prioColor }}>
                    <Text className="text-white font-bold text-sm">{index + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-neutral-900 font-medium" numberOfLines={1}>
                      {config.destino.name}
                    </Text>
                    <View className="flex-row items-center flex-wrap mt-0.5">
                      <Text className="text-green-600 text-xs font-medium">{config.hora || '--:--'}</Text>
                      <Text className="text-neutral-300 mx-2">•</Text>
                      <Text className="text-xs" style={{ color: prioColor }}>
                        {config.prioridad}
                      </Text>
                      <Text className="text-neutral-300 mx-2">•</Text>
                      <Text className="text-indigo-600 text-xs">{freqLabel}</Text>
                    </View>
                  </View>
                  <Ionicons name={config.destino.type === 'branch' ? 'storefront' : 'business'} size={20} color="#9CA3AF" />
                </View>
              )
            })}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  )
}


