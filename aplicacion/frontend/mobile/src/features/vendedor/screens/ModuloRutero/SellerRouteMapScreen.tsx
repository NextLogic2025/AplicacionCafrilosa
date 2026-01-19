import React, { useEffect, useRef, useState } from 'react'
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import MapView, { Marker, PROVIDER_GOOGLE, Callout, Polygon } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { BRAND_COLORS } from '../../../../shared/types'
import { RouteService, type RoutePlan } from '../../../../services/api/RouteService'
import { ClientService, type Client } from '../../../../services/api/ClientService'
import type { SellerStackParamList } from '../../../../navigation/SellerNavigator'
import { ZoneHelpers, ZoneService, type LatLng } from '../../../../services/api/ZoneService'

type RouteClientMarker = {
  cliente: Client
  ruta: RoutePlan
}

const DAYS = [
  { id: 1, label: 'Lun' },
  { id: 2, label: 'Mar' },
  { id: 3, label: 'Mié' },
  { id: 4, label: 'Jue' },
  { id: 5, label: 'Vie' },
]

export function SellerRouteMapScreen() {
  const navigation = useNavigation()
  const route = useRoute<RouteProp<SellerStackParamList, 'SellerRouteMap'>>()
  const initialDay = route.params && 'day' in route.params ? (route.params as any).day : new Date().getDay()
  const [selectedDay, setSelectedDay] = useState<number>(DAYS.some(d => d.id === initialDay) ? initialDay : 1)
  const [loading, setLoading] = useState(true)
  const [markers, setMarkers] = useState<RouteClientMarker[]>([])
  const [zonePolygon, setZonePolygon] = useState<LatLng[]>([])
  const mapRef = useRef<MapView>(null)

  useEffect(() => {
    loadData()
  }, [selectedDay])

  const loadData = async () => {
    setLoading(true)
    try {
      const plans = await RouteService.getMyRoute()
      const filtered = plans.filter(p => p.activo && p.dia_semana === selectedDay)

      const results = await Promise.all(
        filtered.map(async (plan) => {
          try {
            const cliente = await ClientService.getClient(plan.cliente_id)
            return { cliente, ruta: plan } as RouteClientMarker
          } catch {
            return null
          }
        })
      )

      const valid = results.filter(
        (m): m is RouteClientMarker =>
          !!m &&
          m.cliente.ubicacion_gps?.coordinates &&
          Array.isArray(m.cliente.ubicacion_gps.coordinates) &&
          m.cliente.ubicacion_gps.coordinates.length === 2
      )
      setMarkers(valid)

      // polygon de la zona (si hay zona_id en los planes)
      const zoneId = filtered[0]?.zona_id
      if (zoneId) {
        try {
          const zones = await ZoneService.getZones()
          const zone = zones.find(z => Number(z.id) === Number(zoneId))
          if (zone?.poligono_geografico) {
            setZonePolygon(ZoneHelpers.parsePolygon(zone.poligono_geografico))
          } else {
            setZonePolygon([])
          }
        } catch (err: any) {
          // Si no hay permisos (403) u otro error, omitimos polígono sin romper la vista
          setZonePolygon([])
        }
      } else {
        setZonePolygon([])
      }

      if (valid.length && mapRef.current) {
        const coords = valid.map(m => ({
          latitude: m.cliente.ubicacion_gps!.coordinates[1],
          longitude: m.cliente.ubicacion_gps!.coordinates[0],
        }))
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
            animated: true,
          })
        }, 300)
      } else if (!valid.length && zonePolygon.length && mapRef.current) {
        const coords = zonePolygon.map(p => ({ latitude: p.latitude, longitude: p.longitude }))
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
            animated: true,
          })
        }, 300)
      }
    } catch (e) {
      console.error('Error loading route map', e)
    } finally {
      setLoading(false)
    }
  }

  const markerColor = (p: string) => {
    if (p === 'ALTA') return '#DC2626'
    if (p === 'MEDIA') return '#F59E0B'
    return '#10B981'
  }

  if (loading) {
    return (
      <View className="flex-1 bg-neutral-50">
        <Header title="Mapa del Rutero" variant="standard" onBackPress={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={BRAND_COLORS.red} />
          <Text className="text-neutral-500 mt-3">Cargando mapa...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-neutral-50">
      <Header title="Mapa del Rutero" variant="standard" onBackPress={() => navigation.goBack()} />

      <View className="bg-white border-b border-neutral-100 py-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {DAYS.map((d) => {
            const isSel = d.id === selectedDay
            const isToday = d.id === new Date().getDay()
            return (
              <TouchableOpacity
                key={d.id}
                className={`w-20 px-3 py-2 rounded-xl border ${isSel ? 'bg-brand-red border-brand-red' : 'bg-neutral-50 border-neutral-200'}`}
                onPress={() => setSelectedDay(d.id)}
                activeOpacity={0.8}
              >
                <View className="items-center">
                  <View className="flex-row items-center">
                    <Text className={`text-sm font-bold ${isSel ? 'text-white' : 'text-neutral-700'}`}>{d.label}</Text>
                    {isToday && <View className={`w-2 h-2 rounded-full ml-1 ${isSel ? 'bg-white' : 'bg-brand-red'}`} />}
                  </View>
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {markers.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="map-outline" size={56} color="#D1D5DB" />
          <Text className="text-lg font-bold text-neutral-800 mt-3">No hay visitas</Text>
          <Text className="text-neutral-500 text-center mt-1">
            No hay visitas programadas para este día o los clientes no tienen ubicación GPS configurada.
          </Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={{
            latitude: markers[0]?.cliente.ubicacion_gps?.coordinates[1] || -2.1894,
            longitude: markers[0]?.cliente.ubicacion_gps?.coordinates[0] || -79.8851,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
          showsMyLocationButton
        >
          {zonePolygon.length > 0 && (
            <Polygon
              coordinates={zonePolygon}
              strokeColor={BRAND_COLORS.red}
              fillColor="rgba(220,38,38,0.12)"
              strokeWidth={2}
            />
          )}
          {markers.map((m, idx) => {
            const [lng, lat] = m.cliente.ubicacion_gps!.coordinates
            const color = markerColor(m.ruta.prioridad_visita || 'NORMAL')
            return (
              <Marker
                key={m.cliente.id}
                coordinate={{ latitude: lat, longitude: lng }}
                pinColor={color}
              >
                <View className="items-center">
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center border-2 border-white"
                    style={{ backgroundColor: color, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, elevation: 5 }}
                  >
                    <Text className="text-white font-bold text-sm">{m.ruta.orden_sugerido || idx + 1}</Text>
                  </View>
                  <View style={{ width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: color, marginTop: -2 }} />
                </View>

                <Callout
                  onPress={() => navigation.navigate('SellerTabs', { screen: 'SellerClients' })}
                  style={{ width: 230 }}
                >
                  <View>
                    <Text className="font-bold text-neutral-900 mb-1" numberOfLines={2}>
                      {m.cliente.nombre_comercial || m.cliente.razon_social}
                    </Text>
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text className="text-xs text-neutral-600 ml-1">{m.ruta.hora_estimada_arribo || 'Sin hora'}</Text>
                    </View>
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="flag-outline" size={14} color="#6B7280" />
                      <Text className="text-xs text-neutral-600 ml-1">Prioridad: {m.ruta.prioridad_visita || 'Normal'}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="location-outline" size={14} color="#6B7280" />
                      <Text className="text-xs text-neutral-600 ml-1" numberOfLines={2}>
                        {m.cliente.direccion_texto || 'Sin dirección'}
                      </Text>
                    </View>
                    <Text className="text-[11px] text-brand-red font-semibold mt-2">Toca para ver clientes</Text>
                  </View>
                </Callout>
              </Marker>
            )
          })}
        </MapView>
      )}

      <View className="bg-white border-t border-neutral-100 py-3 px-5" style={{ paddingBottom: 18 }}>
        <View className="flex-row justify-center gap-4 mb-2">
          <LegendDot color="#DC2626" label="Alta" />
          <LegendDot color="#F59E0B" label="Media" />
          <LegendDot color="#10B981" label="Baja/Normal" />
        </View>
        <Text className="text-center text-neutral-500 text-xs font-semibold">
          {markers.length} visita(s) programada(s)
        </Text>
      </View>
    </View>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-[11px] text-neutral-600 font-semibold">{label}</Text>
    </View>
  )
}
