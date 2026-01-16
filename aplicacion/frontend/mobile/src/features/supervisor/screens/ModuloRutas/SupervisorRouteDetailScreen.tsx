import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import type { Region } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { BRAND_COLORS } from '../../../../shared/types'
import { ZoneHelpers, ZoneService, type LatLng, type Zone } from '../../../../services/api/ZoneService'
import { RouteService, type RoutePlan } from '../../../../services/api/RouteService'
import { ClientService, type Client, type ClientBranch } from '../../../../services/api/ClientService'
import { PRIORITIES, type FrequencyType, type PriorityType } from './routeSchedule.constants'
import { RouteDetailActionsSection } from './components/RouteDetailActionsSection'
import { RouteDetailFullscreenMapModal } from './components/RouteDetailFullscreenMapModal'
import { RouteDetailHeaderCard } from './components/RouteDetailHeaderCard'
import { RouteDetailVisitDetailsCard } from './components/RouteDetailVisitDetailsCard'

type RouteDetailParams = {
  SupervisorRouteDetail: {
    routeId: string
    mode: 'view' | 'edit'
  }
}

const DEFAULT_REGION: Region = {
  latitude: -3.99313,
  longitude: -79.20422,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
}

export function SupervisorRouteDetailScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<RouteProp<RouteDetailParams, 'SupervisorRouteDetail'>>()
  const { routeId, mode: initialMode } = route.params

  const [routeData, setRouteData] = useState<RoutePlan | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [branch, setBranch] = useState<ClientBranch | null>(null)
  const [zone, setZone] = useState<Zone | null>(null)
  const [zonePolygon, setZonePolygon] = useState<LatLng[]>([])

  const [isEditMode, setIsEditMode] = useState(initialMode === 'edit')
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [frequency, setFrequency] = useState<FrequencyType>('SEMANAL')
  const [priority, setPriority] = useState<PriorityType>('MEDIA')
  const [timeEstimate, setTimeEstimate] = useState<string>('')
  const [order, setOrder] = useState<string>('1')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showFullscreenMap, setShowFullscreenMap] = useState(false)

  const [feedbackModal, setFeedbackModal] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  })

  const loadRouteData = useCallback(async () => {
    setLoading(true)
    try {
      const allRoutes = await RouteService.getAll()
      const foundRoute = allRoutes.find(r => r.id === routeId)

      if (!foundRoute) {
        setRouteData(null)
        setClient(null)
        setBranch(null)
        setZone(null)
        setZonePolygon([])
        setFeedbackModal({ visible: true, type: 'error', title: 'Error', message: 'No se encontró la ruta' })
        return
      }

      setRouteData(foundRoute)
      setSelectedDay(foundRoute.dia_semana)
      setFrequency(foundRoute.frecuencia as FrequencyType)
      setPriority(foundRoute.prioridad_visita as PriorityType)
      setTimeEstimate(foundRoute.hora_estimada_arribo || '')
      setOrder(String(foundRoute.orden_sugerido || 1))

      const clients = await ClientService.getClients()
      const foundClient = clients.find(c => c.id === foundRoute.cliente_id) || null
      setClient(foundClient)

      if (foundRoute.sucursal_id) {
        try {
          const branches = await ClientService.getClientBranches(foundRoute.cliente_id)
          const foundBranch = branches.find(b => b.id === foundRoute.sucursal_id) || null
          setBranch(foundBranch)
        } catch {
          setBranch(null)
        }
      } else {
        setBranch(null)
      }

      if (foundRoute.zona_id) {
        try {
          const zones = await ZoneService.getZones()
          const foundZone = zones.find(z => z.id === foundRoute.zona_id) || null
          setZone(foundZone)
          setZonePolygon(foundZone?.poligono_geografico ? ZoneHelpers.parsePolygon(foundZone.poligono_geografico) : [])
        } catch {
          setZone(null)
          setZonePolygon([])
        }
      } else {
        setZone(null)
        setZonePolygon([])
      }
    } catch {
      setFeedbackModal({ visible: true, type: 'error', title: 'Error', message: 'No se pudo cargar la información de la ruta' })
    } finally {
      setLoading(false)
    }
  }, [routeId])

  useEffect(() => {
    loadRouteData()
  }, [loadRouteData])

  const location = useMemo(() => {
    if (branch?.ubicacion_gps?.coordinates) return { latitude: branch.ubicacion_gps.coordinates[1], longitude: branch.ubicacion_gps.coordinates[0] }
    if (client?.ubicacion_gps?.coordinates) return { latitude: client.ubicacion_gps.coordinates[1], longitude: client.ubicacion_gps.coordinates[0] }
    return null
  }, [branch, client])

  const mapRegion = useMemo<Region>(() => {
    if (location) return { ...location, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    if (zonePolygon.length > 0) {
      const lats = zonePolygon.map(p => p.latitude)
      const lngs = zonePolygon.map(p => p.longitude)
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
      return {
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: Math.max(...lats) - Math.min(...lats) + 0.02,
        longitudeDelta: Math.max(...lngs) - Math.min(...lngs) + 0.02,
      }
    }
    return DEFAULT_REGION
  }, [location, zonePolygon])

  const effectivePriority: PriorityType | undefined = useMemo(() => {
    if (isEditMode) return priority
    return routeData?.prioridad_visita as PriorityType | undefined
  }, [isEditMode, priority, routeData])

  const priorityInfo = useMemo(() => {
    const p = PRIORITIES.find(pr => pr.id === effectivePriority) || PRIORITIES[1]
    return p
  }, [effectivePriority])

  const handleSave = useCallback(async () => {
    if (!routeData) return

    setSaving(true)
    try {
      const updatedRoute: Partial<RoutePlan> = {
        dia_semana: selectedDay,
        frecuencia: frequency,
        prioridad_visita: priority,
        orden_sugerido: parseInt(order, 10) || 1,
        hora_estimada_arribo: timeEstimate || undefined,
      }

      await RouteService.update(routeData.id, updatedRoute)
      setFeedbackModal({ visible: true, type: 'success', title: '¡Guardado!', message: 'La ruta ha sido actualizada correctamente' })
      setIsEditMode(false)
      await loadRouteData()
    } catch {
      setFeedbackModal({ visible: true, type: 'error', title: 'Error', message: 'No se pudo guardar los cambios' })
    } finally {
      setSaving(false)
    }
  }, [frequency, loadRouteData, order, priority, routeData, selectedDay, timeEstimate])

  const handleDelete = useCallback(() => {
    Alert.alert('Eliminar ruta', '¿Estás seguro de eliminar esta ruta? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await RouteService.delete(routeId)
            setFeedbackModal({ visible: true, type: 'success', title: 'Eliminado', message: 'La ruta ha sido eliminada' })
            setTimeout(() => navigation.goBack(), 1500)
          } catch {
            setFeedbackModal({ visible: true, type: 'error', title: 'Error', message: 'No se pudo eliminar la ruta' })
          }
        },
      },
    ])
  }, [navigation, routeId])

  if (loading) {
    return (
      <View className="flex-1 bg-neutral-50">
        <Header title="Detalle de ruta" variant="standard" onBackPress={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={BRAND_COLORS.red} />
          <Text className="text-neutral-500 mt-4">Cargando...</Text>
        </View>
      </View>
    )
  }

  if (!routeData || !client) {
    return (
      <View className="flex-1 bg-neutral-50">
        <Header title="Detalle de ruta" variant="standard" onBackPress={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle" size={64} color={BRAND_COLORS.red} />
          <Text className="text-neutral-900 font-bold text-xl mt-4">Ruta no encontrada</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} className="mt-6 bg-red-500 px-6 py-3 rounded-xl">
            <Text className="text-white font-bold">Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-neutral-50">
      <Header
        title={isEditMode ? 'Editar ruta' : 'Detalle de ruta'}
        variant="standard"
        onBackPress={() => {
          if (isEditMode) {
            setIsEditMode(false)
            loadRouteData()
          } else {
            navigation.goBack()
          }
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          <RouteDetailHeaderCard
            client={client}
            branch={branch}
            zone={zone}
            zonePolygon={zonePolygon}
            location={location}
            mapRegion={mapRegion}
            priority={effectivePriority || 'MEDIA'}
            priorityLabel={priorityInfo.label}
            onOpenMap={() => setShowFullscreenMap(true)}
          />

          <RouteDetailVisitDetailsCard
            isEditMode={isEditMode}
            routeData={routeData}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            frequency={frequency}
            setFrequency={setFrequency}
            priority={priority}
            setPriority={setPriority}
            timeEstimate={timeEstimate}
            setTimeEstimate={setTimeEstimate}
            order={order}
            setOrder={setOrder}
            priorityLabel={priorityInfo.label}
            priorityColor={priorityInfo.color}
            priorityIcon={priorityInfo.icon}
          />

          <RouteDetailActionsSection
            isEditMode={isEditMode}
            saving={saving}
            onCancelEdit={() => {
              setIsEditMode(false)
              loadRouteData()
            }}
            onSave={handleSave}
            onStartEdit={() => setIsEditMode(true)}
            onDelete={handleDelete}
          />
        </View>
      </ScrollView>

      <RouteDetailFullscreenMapModal
        visible={showFullscreenMap}
        onClose={() => setShowFullscreenMap(false)}
        mapRegion={mapRegion}
        zonePolygon={zonePolygon}
        location={location}
        client={client}
        branch={branch}
        zone={zone}
      />

      <FeedbackModal
        visible={feedbackModal.visible}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        onClose={() => setFeedbackModal(prev => ({ ...prev, visible: false }))}
      />
    </View>
  )
}

