import React from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, Polygon, PROVIDER_GOOGLE, Polyline } from 'react-native-maps'
import { BRAND_COLORS } from '../../../../../shared/types'
import { GenericModal } from '../../../../../components/ui/GenericModal'
import type { LatLng } from '../../../../../services/api/ZoneService'
import type { RouteMarker } from '../routes.types'

type Props = {
  visible: boolean
  title: string
  onClose: () => void
  mapInitialRegion: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }
  zonePolygon: LatLng[]
  routePath: Array<{ latitude: number; longitude: number }>
  routeMarkers: RouteMarker[]
  brandRed: string
}

export function RoutesDayMapModal({ visible, title, onClose, mapInitialRegion, zonePolygon, routePath, routeMarkers, brandRed }: Props) {
  return (
    <GenericModal visible={visible} title={title} onClose={onClose}>
      <View className="h-[550px] rounded-xl overflow-hidden relative bg-neutral-100">
        {routeMarkers.length > 0 ? (
          <MapView provider={PROVIDER_GOOGLE} style={{ flex: 1 }} initialRegion={mapInitialRegion}>
            {zonePolygon.length > 0 && (
              <Polygon coordinates={zonePolygon} fillColor="rgba(239, 68, 68, 0.2)" strokeColor={brandRed} strokeWidth={1} />
            )}

            {routePath.length > 1 && <Polyline coordinates={routePath} strokeColor="#3B82F6" strokeWidth={3} lineDashPattern={[10, 6]} />}

            {routeMarkers.map(marker => (
              <Marker
                key={marker.id}
                coordinate={marker.coords}
                title={`#${marker.order} - ${marker.name || 'Sin nombre'}`}
                description={marker.hora ? `Hora: ${marker.hora}` : undefined}
              >
                <View className="items-center">
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center shadow-md ${marker.isBranch ? 'bg-orange-500' : 'bg-red-500'}`}
                  >
                    <Text className="text-white font-bold text-sm">{marker.order}</Text>
                  </View>
                  <View
                    style={{
                      width: 0,
                      height: 0,
                      borderLeftWidth: 6,
                      borderRightWidth: 6,
                      borderTopWidth: 8,
                      borderLeftColor: 'transparent',
                      borderRightColor: 'transparent',
                      borderTopColor: marker.isBranch ? BRAND_COLORS.gold : brandRed,
                      marginTop: -2,
                    }}
                  />
                </View>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="location-outline" size={48} color="#9CA3AF" />
            <Text className="text-neutral-500 mt-2">Sin ubicaciones GPS</Text>
            <Text className="text-neutral-400 text-xs text-center mt-1 px-4">Las visitas no tienen coordenadas GPS registradas</Text>
          </View>
        )}

        <View className="absolute bottom-4 left-4 right-4 bg-white/95 rounded-xl p-3 shadow-lg">
          <Text className="text-neutral-700 font-bold text-sm mb-2">Leyenda</Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-row items-center">
              <View className="w-6 h-6 rounded-full bg-red-500 items-center justify-center mr-1.5">
                <Ionicons name="business" size={12} color="white" />
              </View>
              <Text className="text-neutral-600 text-xs">Matriz</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-6 h-6 rounded-full bg-orange-500 items-center justify-center mr-1.5">
                <Ionicons name="storefront" size={12} color="white" />
              </View>
              <Text className="text-neutral-600 text-xs">Sucursal</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-6 h-0.5 bg-blue-500 mr-1.5" style={{ borderStyle: 'dashed' }} />
              <Text className="text-neutral-600 text-xs">Ruta</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-4 h-4 bg-red-500/20 border border-red-500 mr-1.5" />
              <Text className="text-neutral-600 text-xs">Zona</Text>
            </View>
          </View>
          <Text className="text-neutral-400 text-[10px] mt-2 text-center">Toca cada marcador para ver detalles</Text>
        </View>
      </View>
    </GenericModal>
  )
}


