import * as React from 'react'
import { Modal, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, Polygon, PROVIDER_GOOGLE, type Region } from 'react-native-maps'
import type { LatLng } from '../../../../../services/api/ZoneService'
import type { RouteDestination } from '../routeCreate.types'

type Props = {
  visible: boolean
  zoneName?: string
  zonePolygon: LatLng[]
  destinations: RouteDestination[]
  region: Region
  onClose: () => void
}

export function RouteCreateFullscreenMapModal({ visible, zoneName, zonePolygon, destinations, region, onClose }: Props) {
  const destinationsWithLocation = destinations.filter((d) => d.location != null)

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-200">
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#525252" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-lg font-bold">{zoneName || 'Mapa'}</Text>
            <Text className="text-neutral-500 text-xs">{destinationsWithLocation.length} destino(s)</Text>
          </View>
          <View className="w-7" />
        </View>

        <MapView provider={PROVIDER_GOOGLE} style={{ flex: 1 }} initialRegion={region} showsUserLocation showsMyLocationButton>
          {zonePolygon.length >= 3 && (
            <Polygon coordinates={zonePolygon} fillColor="rgba(79, 70, 229, 0.2)" strokeColor="#4F46E5" strokeWidth={3} />
          )}

          {destinationsWithLocation.map((dest, index) => (
            <Marker
              key={dest.id}
              coordinate={dest.location!}
              title={`${index + 1}. ${dest.name}`}
              description={dest.address}
            >
              <View className="items-center">
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center border-2 border-white ${
                    dest.type === 'branch' ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                >
                  <Text className="text-white font-bold">{index + 1}</Text>
                </View>
              </View>
            </Marker>
          ))}
        </MapView>

        {zonePolygon.length >= 3 && (
          <View className="absolute top-20 left-4 bg-indigo-600/90 px-3 py-2 rounded-xl flex-row items-center">
            <Ionicons name="shapes" size={14} color="white" />
            <Text className="text-white text-xs font-medium ml-1.5">Área de zona visible</Text>
          </View>
        )}

        <View className="max-h-40 bg-white border-t border-neutral-200">
          <ScrollView className="px-4">
            {destinationsWithLocation.map((dest, index) => (
              <View key={dest.id} className="flex-row items-center py-3 border-b border-neutral-100">
                <View className="w-7 h-7 rounded-full bg-red-500 items-center justify-center mr-3">
                  <Text className="text-white font-bold text-xs">{index + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-neutral-900 font-medium text-sm" numberOfLines={1}>
                    {dest.name}
                  </Text>
                  <Text className="text-neutral-500 text-xs">{dest.type === 'branch' ? 'Sucursal' : 'Sede principal'}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  )
}


