import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { BRAND_COLORS } from '../../../../shared/types'
import { ZoneHelpers, ZoneService, type LatLng, type Zone } from '../../../../services/api/ZoneService'
import { RouteService } from '../../../../services/api/RouteService'
import { ClientService, type Client, type ClientBranch } from '../../../../services/api/ClientService'
import { ExpandableFab } from '../../../../components/ui/ExpandableFab'
import { RoutesDayMapModal } from './components/RoutesDayMapModal'
import { RoutesRouteCard } from './components/RoutesRouteCard'
import { ZoneSelectionModal } from './components/ZoneSelectionModal'
import type { RouteMarker, RoutePlanWithClient } from './routes.types'

const DAYS = [
  { id: 1, label: 'Lunes', short: 'Lun' },
  { id: 2, label: 'Martes', short: 'Mar' },
  { id: 3, label: 'Miércoles', short: 'Mié' },
  { id: 4, label: 'Jueves', short: 'Jue' },
  { id: 5, label: 'Viernes', short: 'Vie' },
]

export function SupervisorRoutesScreen() {
  const navigation = useNavigation<any>()

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
      return
    }
    navigation.navigate('SupervisorTabs')
  }, [navigation])

  const [zones, setZones] = useState<Zone[]>([])
  const [routes, setRoutes] = useState<RoutePlanWithClient[]>([])
  const [allClients, setAllClients] = useState<Map<string, Client>>(new Map())

  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [selectedDay, setSelectedDay] = useState(1)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [itemToDeactivate, setItemToDeactivate] = useState<RoutePlanWithClient | null>(null)

  const zonePolygon = useMemo((): LatLng[] => {
    if (!selectedZone?.poligono_geografico) return []
    return ZoneHelpers.parsePolygon(selectedZone.poligono_geografico)
  }, [selectedZone])

  const routeMarkers = useMemo((): RouteMarker[] => {
    const markers = routes
      .map((route, index) => {
        const isBranch = !!route.sucursal
        let coords: { latitude: number; longitude: number } | null = null

        if (isBranch && route.sucursal?.ubicacion_gps) {
          coords = { longitude: route.sucursal.ubicacion_gps.coordinates[0], latitude: route.sucursal.ubicacion_gps.coordinates[1] }
        } else if (route.cliente?.ubicacion_gps) {
          coords = { longitude: route.cliente.ubicacion_gps.coordinates[0], latitude: route.cliente.ubicacion_gps.coordinates[1] }
        }

        if (!coords) return null

        return {
          id: route.id,
          order: index + 1,
          name: isBranch ? route.sucursal?.nombre_sucursal : route.cliente?.nombre_comercial,
          isBranch,
          coords,
          hora: route.hora_estimada_arribo || undefined,
        } satisfies RouteMarker
      })
      .filter(Boolean) as RouteMarker[]

    return markers
  }, [routes])

  const mapInitialRegion = useMemo(() => {
    if (routeMarkers.length > 0) {
      const lats = routeMarkers.map(m => m.coords.latitude)
      const lngs = routeMarkers.map(m => m.coords.longitude)
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
      const latDelta = Math.max(0.01, (Math.max(...lats) - Math.min(...lats)) * 1.5)
      const lngDelta = Math.max(0.01, (Math.max(...lngs) - Math.min(...lngs)) * 1.5)
      return { latitude: centerLat, longitude: centerLng, latitudeDelta: latDelta, longitudeDelta: lngDelta }
    }
    return { latitude: -3.99313, longitude: -79.20422, latitudeDelta: 0.1, longitudeDelta: 0.1 }
  }, [routeMarkers])

  const routePath = useMemo(() => routeMarkers.map(m => m.coords), [routeMarkers])

  const [feedbackModal, setFeedbackModal] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  })

  const showFeedback = useCallback((type: FeedbackType, title: string, message: string) => {
    setFeedbackModal({ visible: true, type, title, message })
  }, [])

  const loadInitialData = useCallback(async () => {
    setLoading(true)
    try {
      const [zonesData, clientsData] = await Promise.all([ZoneService.getZones(), ClientService.getClients()])
      setZones(zonesData)

      const clientMap = new Map<string, Client>()
      clientsData.forEach(c => clientMap.set(c.id, c))
      setAllClients(clientMap)

      if (zonesData.length > 0) setSelectedZone(zonesData[0])
    } catch {
      showFeedback('error', 'Error', 'No se pudieron cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [showFeedback])

  const loadRoutes = useCallback(async () => {
    if (!selectedZone) return
    try {
      const allRoutes = await RouteService.getAll()
      const filteredRoutes = allRoutes.filter(r => r.zona_id === selectedZone.id && r.dia_semana === selectedDay && r.activo)

      const enrichedRoutes: RoutePlanWithClient[] = await Promise.all(
        filteredRoutes.map(async route => {
          const client = allClients.get(route.cliente_id)
          let sucursalInfo: RoutePlanWithClient['sucursal'] | undefined

          if (route.sucursal_id && client) {
            try {
              const branches = await ClientService.getClientBranches(route.cliente_id)
              const branch = branches.find((b: ClientBranch) => b.id === route.sucursal_id)
              if (branch) {
                sucursalInfo = {
                  nombre_sucursal: branch.nombre_sucursal,
                  direccion_entrega: branch.direccion_entrega || undefined,
                  ubicacion_gps: branch.ubicacion_gps || undefined,
                }
              }
            } catch {
              sucursalInfo = undefined
            }
          }

          return {
            ...route,
            cliente: client
              ? {
                razon_social: client.razon_social,
                nombre_comercial: client.nombre_comercial || client.razon_social,
                identificacion: client.identificacion,
                direccion_texto: client.direccion_texto || undefined,
                ubicacion_gps: client.ubicacion_gps || undefined,
              }
              : undefined,
            sucursal: sucursalInfo,
          }
        }),
      )

      enrichedRoutes.sort((a, b) => (a.orden_sugerido || 999) - (b.orden_sugerido || 999))
      setRoutes(enrichedRoutes)
    } catch {
      setRoutes([])
    }
  }, [allClients, selectedDay, selectedZone])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useFocusEffect(
    useCallback(() => {
      loadRoutes()
    }, [loadRoutes]),
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadRoutes()
    setRefreshing(false)
  }, [loadRoutes])

  const confirmDeactivate = useCallback((item: RoutePlanWithClient) => {
    setItemToDeactivate(item)
    setShowDeactivateModal(true)
  }, [])

  const handleDeactivateRoute = useCallback(async () => {
    if (!itemToDeactivate) return
    setShowDeactivateModal(false)

    try {
      await RouteService.deactivate(itemToDeactivate.id)
      showFeedback('success', 'Ruta desactivada', 'La ruta ha sido desactivada correctamente')
      await loadRoutes()
    } catch {
      showFeedback('error', 'Error', 'No se pudo desactivar la ruta')
    }
  }, [itemToDeactivate, loadRoutes, showFeedback])

  const getPriorityBadge = useCallback((priority: string) => {
    switch (priority) {
      case 'ALTA':
        return { variant: 'error' as const, label: 'Alta' }
      case 'MEDIA':
        return { variant: 'warning' as const, label: 'Media' }
      case 'BAJA':
        return { variant: 'success' as const, label: 'Baja' }
      default:
        return { variant: 'info' as const, label: 'Normal' }
    }
  }, [])

  const getFrequencyLabel = useCallback((freq: string) => {
    switch (freq) {
      case 'SEMANAL':
        return 'Semanal'
      case 'QUINCENAL':
        return 'Quincenal'
      case 'MENSUAL':
        return 'Mensual'
      default:
        return freq
    }
  }, [])

  const selectedDayLabel = DAYS.find(d => d.id === selectedDay)?.label || ''

  return (
    <View className="flex-1 bg-neutral-50">
      <Header title="Planificador de rutas" variant="standard" onBackPress={handleBack} />

      <View className="mx-4 mt-4 mb-2">
        <Text className="text-neutral-600 text-sm">Gestiona las visitas programadas por zona y día de la semana</Text>
      </View>

      <TouchableOpacity
        onPress={() => setShowZoneModal(true)}
        className="mx-4 bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-xl bg-indigo-100 items-center justify-center mr-3">
            <Ionicons name="map" size={20} color="#4F46E5" />
          </View>
          <View className="flex-1">
            <Text className="text-neutral-500 text-xs font-medium uppercase">Zona comercial</Text>
            <Text className="text-neutral-900 font-bold text-lg" numberOfLines={1}>
              {selectedZone ? selectedZone.nombre : 'Seleccionar...'}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center">
          {selectedZone && (
            <View className="bg-indigo-100 px-3 py-1 rounded-full mr-2">
              <Text className="text-indigo-700 font-bold text-sm">{selectedZone.codigo}</Text>
            </View>
          )}
          <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>

      <View className="px-4 py-4">
        <View className="flex-row justify-between">
          {DAYS.map(day => {
            const isSelected = selectedDay === day.id
            return (
              <TouchableOpacity
                key={day.id}
                onPress={() => setSelectedDay(day.id)}
                className={`flex-1 mx-1 py-3 rounded-xl items-center ${isSelected ? 'bg-red-500' : 'bg-white border border-neutral-200'}`}
              >
                <Text className={`text-xs font-medium ${isSelected ? 'text-red-100' : 'text-neutral-400'}`}>{day.short}</Text>
                <Text className={`font-bold ${isSelected ? 'text-white' : 'text-neutral-700'}`}>{day.label.substring(0, 3)}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      <View className="px-4 pb-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-neutral-500 font-medium">
            {routes.length} {routes.length === 1 ? 'visita programada' : 'visitas programadas'}
          </Text>
          <View className="flex-row items-center gap-3">
            {routes.length > 0 && routeMarkers.length > 0 && (
              <TouchableOpacity onPress={() => setShowMapModal(true)} className="flex-row items-center bg-blue-500 px-3 py-1.5 rounded-full">
                <Ionicons name="map" size={14} color="white" />
                <Text className="text-white text-xs font-bold ml-1">Ver mapa</Text>
              </TouchableOpacity>
            )}
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
              <Text className="text-neutral-400 text-sm ml-1">{selectedDayLabel}</Text>
            </View>
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={BRAND_COLORS.red} />
          <Text className="text-neutral-500 mt-4">Cargando rutas...</Text>
        </View>
      ) : routes.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-24 h-24 rounded-full bg-neutral-100 items-center justify-center mb-4">
            <Ionicons name="map-outline" size={48} color="#9CA3AF" />
          </View>
          <Text className="text-neutral-900 font-bold text-xl text-center mb-2">Sin rutas programadas</Text>
          <Text className="text-neutral-500 text-center mb-6">
            No hay visitas configuradas para {selectedDayLabel.toLowerCase()} en esta zona.
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SupervisorRouteCreate')} className="bg-red-500 px-6 py-3 rounded-xl flex-row items-center">
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-bold ml-2">Agregar ruta</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND_COLORS.red]} />}
          showsVerticalScrollIndicator={false}
        >
          {routes.map((item, index) => (
            <RoutesRouteCard
              key={item.id}
              item={item}
              index={index}
              priorityBadge={getPriorityBadge(item.prioridad_visita)}
              frequencyLabel={getFrequencyLabel(item.frecuencia)}
              onPress={() => navigation.navigate('SupervisorRouteDetail', { routeId: item.id, mode: 'view' })}
              onView={() => navigation.navigate('SupervisorRouteDetail', { routeId: item.id, mode: 'view' })}
              onEdit={() => navigation.navigate('SupervisorRouteDetail', { routeId: item.id, mode: 'edit' })}
              onDeactivate={() => confirmDeactivate(item)}
            />
          ))}

          <View className="h-24" />
        </ScrollView>
      )}

      <ExpandableFab
        actions={[
          {
            icon: 'eye-off',
            label: 'Rutas desactivadas',
            onPress: () => navigation.navigate('SupervisorRoutesInactive'),
          },
          {
            icon: 'add',
            label: 'Crear ruta',
            onPress: () => navigation.navigate('SupervisorRouteCreate'),
          },
        ]}
      />

      <ZoneSelectionModal
        visible={showZoneModal}
        zones={zones}
        selectedZoneId={selectedZone?.id}
        onClose={() => setShowZoneModal(false)}
        onSelect={zone => {
          setSelectedZone(zone)
          setShowZoneModal(false)
        }}
      />

      <FeedbackModal
        visible={showDeactivateModal}
        type="warning"
        title="Desactivar ruta"
        message={`¿Estás seguro de desactivar la ruta de ${itemToDeactivate?.cliente?.nombre_comercial || 'este cliente'} del ${selectedDayLabel.toLowerCase()}?\n\nPodrás reactivarla desde "Rutas desactivadas".`}
        onClose={() => setShowDeactivateModal(false)}
        onConfirm={handleDeactivateRoute}
        showCancel={true}
        confirmText="Desactivar"
      />

      <FeedbackModal
        visible={feedbackModal.visible}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        onClose={() => setFeedbackModal(prev => ({ ...prev, visible: false }))}
      />

      <RoutesDayMapModal
        visible={showMapModal}
        title={`Ruta ${selectedDayLabel} - ${selectedZone?.nombre || ''}`}
        onClose={() => setShowMapModal(false)}
        mapInitialRegion={mapInitialRegion}
        zonePolygon={zonePolygon}
        routePath={routePath}
        routeMarkers={routeMarkers}
        brandRed={BRAND_COLORS.red}
      />
    </View>
  )
}

