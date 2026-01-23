import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { SectionHeader } from '../../../../components/ui/SectionHeader'
import { RouteService, type RoutePlan } from '../../../../services/api/RouteService'
import { ClientService, type Client } from '../../../../services/api/ClientService'
import { SellerStackParamList } from '../../../../navigation/SellerNavigator'
import { BRAND_COLORS } from '../../../../shared/types'
import { DashboardCard } from '../../../../components/ui/DashboardCard'

type EnrichedRoute = RoutePlan & { cliente?: Client; isToday: boolean }

const WEEK_DAYS = [
  { id: 1, label: 'Lun', full: 'Lunes' },
  { id: 2, label: 'Mar', full: 'Martes' },
  { id: 3, label: 'Mié', full: 'Miércoles' },
  { id: 4, label: 'Jue', full: 'Jueves' },
  { id: 5, label: 'Vie', full: 'Viernes' },
]

export function SellerRouteScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SellerStackParamList>>()
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [routes, setRoutes] = useState<EnrichedRoute[]>([])
  const safeDay = () => {
    const today = new Date().getDay()
    return WEEK_DAYS.some(d => d.id === today) ? today : 1
  }
  const [selectedDay, setSelectedDay] = useState<number>(safeDay())

  const loadData = async () => {
    setLoading(true)
    try {
      const routePlans = await RouteService.getMyRoute()
      const uniqueClientIds = [...new Set(routePlans.map(r => r.cliente_id))]
      const clientsMap = new Map<string, Client>()

      await Promise.all(
        uniqueClientIds.map(async (id) => {
          try {
            const client = await ClientService.getClient(id)
            clientsMap.set(id, client)
          } catch {
            // ignore
          }
        })
      )

      const today = new Date().getDay()
      const enriched: EnrichedRoute[] = routePlans.map(r => ({
        ...r,
        cliente: clientsMap.get(r.cliente_id),
        isToday: r.dia_semana === today,
      }))

      setRoutes(enriched)
    } catch (e) {
      console.error('Error loading route', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(useCallback(() => { loadData() }, []))

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const currentDay = safeDay()

  const stats = useMemo(() => {
    const active = routes.filter(r => r.activo)
    return {
      total: active.length,
      today: active.filter(r => r.dia_semana === currentDay).length,
      priority: active.filter(r => r.prioridad_visita === 'ALTA').length,
    }
  }, [routes, currentDay])

  const dayVisits = useMemo(
    () => routes
      .filter(r => r.activo && r.dia_semana === selectedDay)
      .sort((a, b) => (a.orden_sugerido || 0) - (b.orden_sugerido || 0)),
    [routes, selectedDay]
  )

  const renderVisit = ({ item }: { item: EnrichedRoute }) => {
    const client = item.cliente
    const isToday = item.isToday
    const priorityColor = item.prioridad_visita === 'ALTA' ? 'bg-red-50 text-red-700 border-red-200'
      : item.prioridad_visita === 'MEDIA' ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200'

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        className="bg-white rounded-2xl p-4 mb-3 border border-neutral-100 shadow-sm"
        style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 }}
        onPress={() => navigation.navigate('SellerTabs', { screen: 'SellerClients' })}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-base font-bold text-neutral-900" numberOfLines={1}>
              {client?.nombre_comercial || client?.razon_social || 'Cliente'}
            </Text>
            <Text className="text-sm text-neutral-500 mt-1" numberOfLines={2}>
              {client?.direccion_texto || 'Sin dirección'}
            </Text>
            <View className="flex-row items-center mt-3">
              <View className="flex-row items-center bg-neutral-50 px-3 py-1 rounded-full border border-neutral-200 mr-2">
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text className="text-xs text-neutral-700 ml-1">
                  {item.hora_estimada_arribo || 'Sin hora'}
                </Text>
              </View>
              <View className={`px-3 py-1 rounded-full border ${priorityColor}`}>
                <Text className="text-xs font-semibold uppercase">
                  {item.prioridad_visita || 'Normal'}
                </Text>
              </View>
            </View>
          </View>
          <View className="items-center">
            <View className="w-10 h-10 rounded-full bg-red-50 border border-red-100 items-center justify-center">
              <Text className="text-red-600 font-bold">{item.orden_sugerido || 0}</Text>
            </View>
            <Text className={`text-[11px] mt-2 font-semibold ${isToday ? 'text-emerald-600' : 'text-neutral-400'}`}>
              {WEEK_DAYS.find(d => d.id === item.dia_semana)?.label || ''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View className="flex-1 bg-neutral-50">
      <Header title="Mi Rutero" variant="standard" />

      <View className="px-5 pt-4 pb-3">
        <View className="flex-row justify-between -mx-1.5">
          <DashboardCard icon="map" label="Total" value={stats.total} color={BRAND_COLORS.red} columns={3} />
          <DashboardCard icon="calendar" label="Hoy" value={stats.today} color={BRAND_COLORS.red} columns={3} />
          <DashboardCard icon="flag" label="Prioritarias" value={stats.priority} color={BRAND_COLORS.red} columns={3} />
        </View>
      </View>

      <DaySelector
        selectedDay={selectedDay}
        currentDay={currentDay}
        onSelect={setSelectedDay}
        getCount={(id) => routes.filter(r => r.activo && r.dia_semana === id).length}
      />

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={BRAND_COLORS.red} />
          <Text className="text-neutral-400 mt-3">Cargando rutero...</Text>
        </View>
      ) : (
        <FlatList
          data={dayVisits}
          keyExtractor={(item) => item.id}
          renderItem={renderVisit}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 }}
          ListHeaderComponent={
            dayVisits.length > 0 ? (
              <SectionHeader
                title={WEEK_DAYS.find(d => d.id === selectedDay)?.full || 'Día'}
                subtitle={`${dayVisits.length} visita${dayVisits.length !== 1 ? 's' : ''} programada${dayVisits.length !== 1 ? 's' : ''}`}
              />
            ) : null
          }
          ListEmptyComponent={
            <View className="mt-10">
              <EmptyState
                icon="calendar-outline"
                title="Sin visitas"
                description={`No hay visitas para el ${WEEK_DAYS.find(d => d.id === selectedDay)?.full || 'día'}.`}
                actionLabel="Recargar"
                onAction={loadData}
              />
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND_COLORS.red]} tintColor={BRAND_COLORS.red} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        className="absolute right-5 bg-brand-red flex-row items-center rounded-full px-4 py-3 shadow-lg"
        activeOpacity={0.9}
        onPress={() => navigation.navigate('SellerRouteMap', { day: selectedDay })}
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
          bottom: 28,
        }}
      >
        <Ionicons name="map" size={18} color="white" />
        <Text className="text-white font-bold text-sm ml-2">Ver mapa</Text>
      </TouchableOpacity>
    </View>
  )
}



function DaySelector({
  selectedDay,
  currentDay,
  onSelect,
  getCount,
}: {
  selectedDay: number
  currentDay: number
  onSelect: (d: number) => void
  getCount: (id: number) => number
}) {
  return (
    <View className="bg-white border-y border-neutral-100 py-3">
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={WEEK_DAYS}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        renderItem={({ item }) => {
          const isSelected = item.id === selectedDay
          const isToday = item.id === currentDay
          const count = getCount(item.id)
          return (
            <TouchableOpacity
              className={`w-20 px-3 py-2 rounded-xl border ${isSelected ? 'bg-brand-red border-brand-red' : 'bg-neutral-50 border-neutral-200'}`}
              onPress={() => onSelect(item.id)}
              activeOpacity={0.8}
            >
              <View className="items-center">
                <View className="flex-row items-center">
                  <Text className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-neutral-700'}`}>{item.label}</Text>
                  {isToday && <View className={`w-2 h-2 rounded-full ml-1 ${isSelected ? 'bg-white' : 'bg-brand-red'}`} />}
                </View>
                {count > 0 && (
                  <View className={`mt-1 px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20' : 'bg-neutral-200'}`}>
                    <Text className={`text-[11px] font-semibold ${isSelected ? 'text-white' : 'text-neutral-700'}`}>{count}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}
