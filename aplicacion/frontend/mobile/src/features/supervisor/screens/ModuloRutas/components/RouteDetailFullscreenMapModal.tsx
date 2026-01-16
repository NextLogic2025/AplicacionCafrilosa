import React from 'react'
import { Modal, SafeAreaView, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, Polygon, PROVIDER_GOOGLE, Region } from 'react-native-maps'
import { BRAND_COLORS } from '../../../../../shared/types'
import type { Client, ClientBranch } from '../../../../../services/api/ClientService'
import type { Zone, LatLng } from '../../../../../services/api/ZoneService'

type Props = {
  visible: boolean
  onClose: () => void
  mapRegion: Region
  zonePolygon: LatLng[]
  location: { latitude: number; longitude: number } | null
  client: Client
  branch: ClientBranch | null
  zone: Zone | null
}

export function RouteDetailFullscreenMapModal({ visible, onClose, mapRegion, zonePolygon, location, client, branch, zone }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-200">
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-neutral-900">Ubicación en mapa</Text>
          <View style={{ width: 28 }} />
        </View>

        <MapView provider={PROVIDER_GOOGLE} style={{ flex: 1 }} initialRegion={mapRegion} showsUserLocation showsMyLocationButton>
          {zonePolygon.length >= 3 && (
            <Polygon coordinates={zonePolygon} fillColor="rgba(79, 70, 229, 0.2)" strokeColor="#4F46E5" strokeWidth={3} />
          )}

          {location && (
            <Marker
              coordinate={location}
              title={branch ? branch.nombre_sucursal : client.nombre_comercial || client.razon_social}
              description={branch?.direccion_entrega || client.direccion_texto || undefined}
            >
              <View className="items-center">
                <View className={`w-12 h-12 rounded-full items-center justify-center shadow-lg ${branch ? 'bg-orange-500' : 'bg-green-500'}`}>
                  <Ionicons name={branch ? 'storefront' : 'business'} size={24} color="white" />
                </View>
                <View className="w-3 h-3 bg-neutral-800 rotate-45 -mt-1.5" />
              </View>
            </Marker>
          )}
        </MapView>

        <View className="absolute bottom-6 left-4 right-4 bg-white rounded-2xl shadow-lg p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${branch ? 'bg-orange-100' : 'bg-green-100'}`}>
                <Ionicons name={branch ? 'storefront' : 'business'} size={20} color={branch ? BRAND_COLORS.gold : '#22C55E'} />
              </View>
              <View className="flex-1">
                <Text className="text-neutral-900 font-bold" numberOfLines={1}>
                  {branch ? branch.nombre_sucursal : client.nombre_comercial || client.razon_social}
                </Text>
                {zone && <Text className="text-indigo-600 text-xs">Zona: {zone.nombre}</Text>}
              </View>
            </View>
            {zonePolygon.length > 0 && (
              <View className="bg-indigo-100 px-3 py-1.5 rounded-full">
                <Text className="text-indigo-700 text-xs font-medium">Zona visible</Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}
