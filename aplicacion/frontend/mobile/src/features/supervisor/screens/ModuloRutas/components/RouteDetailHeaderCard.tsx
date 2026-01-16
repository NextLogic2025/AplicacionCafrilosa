import React from 'react'
import { BRAND_COLORS } from '../../../../../shared/types'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, Polygon, PROVIDER_GOOGLE, Region } from 'react-native-maps'
import { StatusBadge } from '../../../../../components/ui/StatusBadge'
import type { Client, ClientBranch } from '../../../../../services/api/ClientService'
import type { Zone, LatLng } from '../../../../../services/api/ZoneService'
import type { PriorityType } from '../routeSchedule.constants'

type Props = {
  client: Client
  branch: ClientBranch | null
  zone: Zone | null
  zonePolygon: LatLng[]
  location: { latitude: number; longitude: number } | null
  mapRegion: Region
  priority: PriorityType
  priorityLabel: string
  onOpenMap: () => void
}

export function RouteDetailHeaderCard({
  client,
  branch,
  zone,
  zonePolygon,
  location,
  mapRegion,
  priority,
  priorityLabel,
  onOpenMap,
}: Props) {
  const variant = priority === 'ALTA' ? 'error' : priority === 'MEDIA' ? 'warning' : 'success'

  return (
    <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden mb-5">
      <TouchableOpacity onPress={onOpenMap} className="h-48 bg-neutral-200">
        <MapView
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          region={mapRegion}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          {zonePolygon.length >= 3 && (
            <Polygon coordinates={zonePolygon} fillColor="rgba(79, 70, 229, 0.2)" strokeColor="#4F46E5" strokeWidth={3} />
          )}

          {location && (
            <Marker coordinate={location} title={branch ? branch.nombre_sucursal : client.nombre_comercial || client.razon_social}>
              <View className="items-center">
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center shadow-lg border-2 border-white ${branch ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                >
                  <Ionicons name={branch ? 'storefront' : 'business'} size={24} color="white" />
                </View>
              </View>
            </Marker>
          )}
        </MapView>

        <View className="absolute top-2 left-2 right-2 flex-row justify-between">
          {zone && (
            <View className="bg-indigo-600/90 px-3 py-1.5 rounded-full flex-row items-center">
              <Ionicons name="map" size={12} color="white" />
              <Text className="text-white text-xs font-medium ml-1">{zone.nombre}</Text>
            </View>
          )}
          <View className={`px-3 py-1.5 rounded-full flex-row items-center ${zonePolygon.length >= 3 ? 'bg-green-600/90' : 'bg-amber-500/90'}`}>
            <Ionicons name={zonePolygon.length >= 3 ? 'checkmark-circle' : 'warning'} size={12} color="white" />
            <Text className="text-white text-xs font-medium ml-1">{zonePolygon.length >= 3 ? 'Área visible' : 'Sin área definida'}</Text>
          </View>
        </View>

        <View className="absolute bottom-2 right-2 bg-white/95 px-4 py-2 rounded-full flex-row items-center shadow">
          <Ionicons name="expand" size={16} color="#4F46E5" />
          <Text className="text-indigo-600 text-sm font-bold ml-1.5">Ver mapa</Text>
        </View>
      </TouchableOpacity>

      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${branch ? 'bg-orange-100' : 'bg-green-100'}`}>
                <Ionicons name={branch ? 'storefront' : 'business'} size={16} color={branch ? BRAND_COLORS.gold : '#22C55E'} />
              </View>
              <View className="flex-1">
                <Text className="text-neutral-900 font-bold text-lg" numberOfLines={1}>
                  {branch ? branch.nombre_sucursal : client.nombre_comercial || client.razon_social}
                </Text>
                {branch && <Text className="text-neutral-500 text-xs">Sucursal de: {client.nombre_comercial || client.razon_social}</Text>}
              </View>
            </View>
            <Text className="text-neutral-500 text-sm mt-1">{client.identificacion}</Text>
          </View>
          <StatusBadge label={priorityLabel} variant={variant} />
        </View>

        <View className="flex-row items-start mt-3 pt-3 border-t border-neutral-100">
          <Ionicons name="location" size={18} color="#6B7280" />
          <Text className="text-neutral-600 text-sm ml-2 flex-1">{branch?.direccion_entrega || client.direccion_texto || 'Sin dirección registrada'}</Text>
        </View>

        {zone && (
          <View className="flex-row items-center mt-2">
            <Ionicons name="map" size={16} color="#4F46E5" />
            <Text className="text-indigo-600 text-sm font-medium ml-2">
              Zona: {zone.nombre} ({zone.codigo})
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}


