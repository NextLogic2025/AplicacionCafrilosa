import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, Polygon, PROVIDER_GOOGLE, type Region } from 'react-native-maps'
import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'
import { BRAND_COLORS } from '../../../../shared/types'
import { ClientService, type Client, type ClientBranch } from '../../../../services/api/ClientService'
import { RouteService, type RoutePlan } from '../../../../services/api/RouteService'
import { ZoneHelpers, ZoneService, type LatLng, type Zone } from '../../../../services/api/ZoneService'
import { StepIndicator } from '../../../../components/ui/StepIndicator'
import { RouteCreateDestinationsModal } from './components/RouteCreateDestinationsModal'
import { RouteCreateFullscreenMapModal } from './components/RouteCreateFullscreenMapModal'
import { ZoneSelectionModal } from './components/ZoneSelectionModal'
import type { RouteDestination } from './routeCreate.types'

const DEFAULT_REGION: Region = {
  latitude: -3.99313,
  longitude: -79.20422,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
}

function parseLocation(ubicacionGps: { coordinates: number[] } | null | undefined) {
  if (!ubicacionGps?.coordinates) return undefined
  return { latitude: ubicacionGps.coordinates[1], longitude: ubicacionGps.coordinates[0] }
}

export function SupervisorRouteCreateScreen() {
  const navigation = useNavigation<any>()

  const [zones, setZones] = useState<Zone[]>([])
  const [allClients, setAllClients] = useState<Client[]>([])
  const [existingRoutes, setExistingRoutes] = useState<RoutePlan[]>([])
  const [zonePolygon, setZonePolygon] = useState<LatLng[]>([])

  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [selectedDestinations, setSelectedDestinations] = useState<RouteDestination[]>([])

  const [initializing, setInitializing] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [showDestinationModal, setShowDestinationModal] = useState(false)
  const [showFullscreenMap, setShowFullscreenMap] = useState(false)
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null)
  const [clientBranches, setClientBranches] = useState<Map<string, ClientBranch[]>>(new Map())
  const [loadingBranches, setLoadingBranches] = useState<string | null>(null)

  const [feedbackModal, setFeedbackModal] = useState<{
    visible: boolean
    type: FeedbackType
    title: string
    message: string
  }>({ visible: false, type: 'info', title: '', message: '' })

  useEffect(() => {
    const loadInitialData = async () => {
      setInitializing(true)
      try {
        const [zonesData, clientsData, routesData] = await Promise.all([
          ZoneService.getZones(),
          ClientService.getClients(),
          RouteService.getAll(),
        ])
        setZones(zonesData)
        setAllClients(clientsData)
        setExistingRoutes(routesData)

        const branchesMap = new Map<string, ClientBranch[]>()
        await Promise.all(
          clientsData.slice(0, 50).map(async (client) => {
            try {
              const branches = await ClientService.getClientBranches(client.id)
              branchesMap.set(client.id, branches)
            } catch {
              branchesMap.set(client.id, [])
            }
          }),
        )
        setClientBranches(branchesMap)
      } catch (error) {
        console.error('Error loading initial data:', error)
        setFeedbackModal({
          visible: true,
          type: 'error',
          title: 'Error',
          message: 'No se pudo cargar la información inicial',
        })
      } finally {
        setInitializing(false)
      }
    }

    void loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedZone?.poligono_geografico) {
      setZonePolygon(ZoneHelpers.parsePolygon(selectedZone.poligono_geografico))
      return
    }
    setZonePolygon([])
  }, [selectedZone])

  const loadBranchesForClient = useCallback(
    async (clientId: string) => {
      if (clientBranches.has(clientId)) return
      setLoadingBranches(clientId)
      try {
        const branches = await ClientService.getClientBranches(clientId)
        setClientBranches((prev) => new Map(prev).set(clientId, branches))
      } catch (error) {
        console.error('Error loading branches:', error)
        setClientBranches((prev) => new Map(prev).set(clientId, []))
      } finally {
        setLoadingBranches(null)
      }
    },
    [clientBranches],
  )

  const filteredClients = useMemo(() => {
    if (!selectedZone) return []
    const selectedZoneId = Number(selectedZone.id)

    return allClients.filter((client) => {
      if ((client as any).bloqueado) return false

      const isMatrizInZone = Number((client as any).zona_comercial_id) === selectedZoneId
      const branches = clientBranches.get(client.id) || []
      const hasBranchInZone = branches.some((branch) => Number(branch.zona_id) === selectedZoneId)
      return isMatrizInZone || hasBranchInZone
    })
  }, [allClients, selectedZone, clientBranches])

  const searchedClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return filteredClients

    return filteredClients.filter((c) => {
      const razonSocial = (c as any).razon_social?.toString().toLowerCase() || ''
      const nombreComercial = (c as any).nombre_comercial?.toString().toLowerCase() || ''
      const identificacion = (c as any).identificacion?.toString() || ''
      return razonSocial.includes(query) || nombreComercial.includes(query) || identificacion.includes(query)
    })
  }, [filteredClients, searchQuery])

  const destinationsWithLocation = useMemo(
    () => selectedDestinations.filter((d) => d.location != null),
    [selectedDestinations],
  )

  const mapRegion = useMemo<Region>(() => {
    if (destinationsWithLocation.length === 0) return DEFAULT_REGION
    if (destinationsWithLocation.length === 1) {
      return {
        latitude: destinationsWithLocation[0].location!.latitude,
        longitude: destinationsWithLocation[0].location!.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    }

    const lats = destinationsWithLocation.map((d) => d.location!.latitude)
    const lngs = destinationsWithLocation.map((d) => d.location!.longitude)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.01, (maxLat - minLat) * 1.5),
      longitudeDelta: Math.max(0.01, (maxLng - minLng) * 1.5),
    }
  }, [destinationsWithLocation])

  const handleExpandClient = useCallback(
    async (clientId: string) => {
      if (expandedClientId === clientId) {
        setExpandedClientId(null)
        return
      }
      setExpandedClientId(clientId)
      await loadBranchesForClient(clientId)
    },
    [expandedClientId, loadBranchesForClient],
  )

  const handleAddDestination = useCallback((destination: RouteDestination) => {
    setSelectedDestinations((prev) => (prev.some((d) => d.id === destination.id) ? prev : [...prev, destination]))
  }, [])

  const handleRemoveDestination = useCallback((destinationId: string) => {
    setSelectedDestinations((prev) => prev.filter((d) => d.id !== destinationId))
  }, [])

  const openDestinationModal = () => {
    if (!selectedZone) {
      setFeedbackModal({
        visible: true,
        type: 'warning',
        title: 'Zona requerida',
        message: 'Selecciona una zona antes de agregar destinos.',
      })
      return
    }
    setShowDestinationModal(true)
  }

  const closeDestinationModal = () => {
    setShowDestinationModal(false)
    setSearchQuery('')
    setExpandedClientId(null)
  }

  const handleContinue = () => {
    if (!selectedZone || selectedDestinations.length === 0) {
      setFeedbackModal({
        visible: true,
        type: 'warning',
        title: 'Datos incompletos',
        message: 'Selecciona una zona y al menos un destino para continuar.',
      })
      return
    }

    navigation.navigate('SupervisorRouteCreatePaso2', {
      zone: selectedZone,
      destinations: selectedDestinations,
      existingRoutes,
    })
  }

  if (initializing) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={BRAND_COLORS.red} />
        <Text className="text-neutral-500 mt-4">Cargando datos...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-neutral-50">
      <Header
        title="Nueva Ruta"
        variant="standard"
        onBackPress={() =>
          navigation.reset({
            index: 0,
            routes: [{ name: 'SupervisorRoutes' }],
          })
        }
      />

      <View className="flex-1">
        <View className="p-5">
          <StepIndicator
            steps={[
              { id: 1, label: 'Zona' },
              { id: 2, label: 'Horario' },
            ]}
            currentStep={1}
            helperText="Selecciona la zona y los clientes/sucursales a visitar"
          />

          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-bold text-neutral-900">Zona Comercial</Text>
              <Text className="text-neutral-400 text-xs">Paso 1 de 2</Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowZoneModal(true)}
              activeOpacity={0.8}
              className="bg-white rounded-2xl p-4 border border-neutral-100 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1">
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${selectedZone ? 'bg-indigo-100' : 'bg-neutral-100'}`}>
                  <Ionicons name="map" size={22} color={selectedZone ? '#4F46E5' : '#9CA3AF'} />
                </View>
                <View className="flex-1">
                  <Text className="text-neutral-900 font-bold" numberOfLines={1}>
                    {selectedZone ? selectedZone.nombre : 'Seleccionar zona'}
                  </Text>
                  <Text className="text-neutral-500 text-xs mt-1" numberOfLines={1}>
                    {selectedZone ? `${selectedZone.codigo} • ${selectedZone.ciudad}` : 'Necesario para filtrar destinos'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-bold text-neutral-900">Destinos</Text>
              <Text className="text-neutral-400 text-xs">{selectedDestinations.length} seleccionado(s)</Text>
            </View>

            <TouchableOpacity
              onPress={openDestinationModal}
              activeOpacity={0.8}
              className={`rounded-2xl p-4 flex-row items-center justify-between border ${selectedZone ? 'bg-white border-neutral-100' : 'bg-neutral-100 border-neutral-200'
                }`}
            >
              <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${selectedZone ? 'bg-green-100' : 'bg-neutral-200'}`}>
                  <Ionicons name="add" size={20} color={selectedZone ? '#22C55E' : '#9CA3AF'} />
                </View>
                <View>
                  <Text className={`font-bold ${selectedZone ? 'text-neutral-900' : 'text-neutral-500'}`}>Agregar destinos</Text>
                  <Text className="text-neutral-500 text-xs">{selectedZone ? 'Clientes o sucursales en la zona' : 'Selecciona una zona primero'}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
            </TouchableOpacity>

            {selectedDestinations.length > 0 && (
              <View className="mt-4">
                {selectedDestinations.map((d) => (
                  <View key={d.id} className="bg-white rounded-xl p-3 mb-2 border border-neutral-100 flex-row items-center">
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${d.type === 'branch' ? 'bg-orange-100' : 'bg-green-100'}`}>
                      <Ionicons name={d.type === 'branch' ? 'storefront' : 'business'} size={18} color={d.type === 'branch' ? BRAND_COLORS.gold : '#22C55E'} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-neutral-900 font-semibold" numberOfLines={1}>
                        {d.name}
                      </Text>
                      <Text className="text-neutral-500 text-xs" numberOfLines={1}>
                        {d.clientName} • {d.type === 'branch' ? 'Sucursal' : 'Matriz'}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveDestination(d.id)} className="p-2">
                      <Ionicons name="trash-outline" size={18} color={BRAND_COLORS.red} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {selectedZone && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-lg font-bold text-neutral-900">Mapa</Text>
                <TouchableOpacity onPress={() => setShowFullscreenMap(true)} className="flex-row items-center bg-neutral-100 px-3 py-2 rounded-xl">
                  <Ionicons name="expand" size={16} color="#525252" />
                  <Text className="text-neutral-700 font-medium text-xs ml-1">Ampliar</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => setShowFullscreenMap(true)} className="h-48 rounded-2xl overflow-hidden border border-neutral-200" activeOpacity={0.9}>
                <MapView provider={PROVIDER_GOOGLE} style={{ flex: 1 }} region={mapRegion} scrollEnabled={false} zoomEnabled={false}>
                  {zonePolygon.length >= 3 && (
                    <Polygon coordinates={zonePolygon} fillColor="rgba(79, 70, 229, 0.2)" strokeColor="#4F46E5" strokeWidth={2} />
                  )}
                  {destinationsWithLocation.map((dest, index) => (
                    <Marker key={dest.id} coordinate={dest.location!} title={dest.name}>
                      <View className="items-center">
                        <View className="w-8 h-8 rounded-full bg-red-500 items-center justify-center border-2 border-white">
                          <Text className="text-white font-bold text-sm">{index + 1}</Text>
                        </View>
                      </View>
                    </Marker>
                  ))}
                </MapView>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={handleContinue}
            disabled={!selectedZone || selectedDestinations.length === 0}
            className={`py-5 rounded-2xl items-center shadow-lg flex-row justify-center ${selectedZone && selectedDestinations.length > 0 ? 'bg-red-500' : 'bg-neutral-300'
              }`}
          >
            <Text className="text-white font-bold text-lg mr-2">Continuar</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ZoneSelectionModal
        visible={showZoneModal}
        zones={zones}
        selectedZoneId={selectedZone?.id}
        onClose={() => setShowZoneModal(false)}
        onSelect={(zone) => {
          setSelectedZone(zone)
          setSelectedDestinations([])
          setShowZoneModal(false)
        }}
      />

      <RouteCreateDestinationsModal
        visible={showDestinationModal}
        selectedZone={selectedZone}
        clients={searchedClients}
        selectedDestinations={selectedDestinations}
        expandedClientId={expandedClientId}
        loadingBranchesClientId={loadingBranches}
        clientBranches={clientBranches}
        searchQuery={searchQuery}
        onChangeSearchQuery={setSearchQuery}
        onClose={closeDestinationModal}
        onExpandClient={(clientId) => void handleExpandClient(clientId)}
        onAddDestination={handleAddDestination}
        onRemoveDestination={handleRemoveDestination}
        parseLocation={parseLocation}
      />

      <RouteCreateFullscreenMapModal
        visible={showFullscreenMap}
        zoneName={selectedZone?.nombre}
        zonePolygon={zonePolygon}
        destinations={selectedDestinations}
        region={mapRegion}
        onClose={() => setShowFullscreenMap(false)}
      />

      <FeedbackModal
        visible={feedbackModal.visible}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        onClose={() => setFeedbackModal((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  )
}


