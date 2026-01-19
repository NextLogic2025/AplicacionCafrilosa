import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Linking, RefreshControl, Dimensions, StyleSheet } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../../components/ui/Header'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { SectionHeader } from '../../../../components/ui/SectionHeader'

import { BRAND_COLORS } from '../../../../shared/types'
import { ClientService, Client, ClientBranch } from '../../../../services/api/ClientService'
import { MiniMapPreview } from '../../../../components/ui/MiniMapPreview'
import { ZoneHelpers } from '../../../../services/api/ZoneService'

const { width } = Dimensions.get('window')

export function SupervisorClientDetailScreen() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  
  const clientParam: Client | undefined = route.params?.client
  const clientId: string | undefined = clientParam?.id || route.params?.clientId

  const [client, setClient] = useState<Client | null>(clientParam || null)
  const [branches, setBranches] = useState<ClientBranch[]>([])
  const [zonePolygon, setZonePolygon] = useState<{ latitude: number; longitude: number }[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null)

  const loadData = async () => {
    if (!clientId) return
    setLoading(true)
    try {
      const [clientData, sucursales] = await Promise.all([
        ClientService.getClient(clientId),
        ClientService.getClientBranches(clientId)
      ])
      setClient(clientData)
      setBranches(sucursales)
      if (clientData?.zona_comercial_id) {
        const zone = await ClientService.getCommercialZoneById(clientData.zona_comercial_id, true)
        if (zone?.poligono_geografico) setZonePolygon(ZoneHelpers.parsePolygon(zone.poligono_geografico))
        else setZonePolygon(null)
      } else {
        setZonePolygon(null)
      }
    } catch (e) {
      console.error('Error cargando detalle del cliente:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const unsub = navigation.addListener('focus', loadData)
    return unsub
  }, [navigation])

  const openInGoogleMaps = (coordinates: [number, number], title: string) => {
    const [lng, lat] = coordinates
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    Linking.openURL(url).catch(err => console.error('Error abriendo Google Maps:', err))
  }

  if (loading && !client) {
    return (
      <View className="flex-1 bg-neutral-50">
        <Header title="Detalle Cliente" variant="standard" onBackPress={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={BRAND_COLORS.red} />
          <Text className="text-neutral-500 mt-4 text-sm">Cargando información...</Text>
        </View>
      </View>
    )
  }

  if (!client) {
    return (
      <View className="flex-1 bg-neutral-50">
        <Header title="Detalle Cliente" variant="standard" onBackPress={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-neutral-100 w-20 h-20 rounded-full items-center justify-center mb-4">
            <Ionicons name="search-outline" size={40} color="#9CA3AF" />
          </View>
          <Text className="text-lg font-bold text-neutral-900 text-center mb-2">
            Cliente no encontrado
          </Text>
          <Text className="text-neutral-500 text-center">
            No se pudo cargar la información del cliente
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-neutral-50">
      <Header title="Detalle Cliente" variant="standard" onBackPress={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} tintColor={BRAND_COLORS.red} />
        }
      >
        <View className="px-5 py-4">
          
          {/* Tarjeta principal de información */}
          <View className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
            {/* Header con degradado */}
            <View className="bg-red-50 px-4 py-4 -mx-4 -mt-4 mb-4 border-b border-neutral-100">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-2xl font-bold text-neutral-900 mb-1" numberOfLines={2}>
                    {client.nombre_comercial || client.razon_social}
                  </Text>
                  {client.nombre_comercial && client.razon_social !== client.nombre_comercial && (
                    <Text className="text-neutral-600 text-sm font-medium">{client.razon_social}</Text>
                  )}
                </View>
                <StatusBadge
                  label={client.bloqueado ? 'Suspendido' : 'Activo'}
                  variant={client.bloqueado ? 'error' : 'success'}
                />
              </View>
            </View>

            {/* Información detallada */}
            <View className="space-y-3">
              {/* Identificación */}
              <InfoRow
                icon="card-outline"
                iconColor="#6B7280"
                label="Identificación"
                value={`${client.tipo_identificacion}: ${client.identificacion}`}
              />

              {/* Usuario Principal */}
              {client.usuario_principal_nombre && (
                <InfoRow
                  icon="person-circle"
                  iconColor="#2563EB"
                  label="Usuario Asignado"
                  value={client.usuario_principal_nombre}
                />
              )}

              {/* Zona Comercial */}
              {client.zona_comercial_nombre && (
                <InfoRow
                  icon="map"
                  iconColor="#EA580C"
                  label="Zona Comercial"
                  value={client.zona_comercial_nombre}
                />
              )}

              {/* Vendedor */}
              {client.vendedor_nombre && (
                <InfoRow
                  icon="people"
                  iconColor="#8B5CF6"
                  label="Vendedor"
                  value={client.vendedor_nombre}
                />
              )}

              {/* Dirección */}
              {client.direccion_texto && (
                <InfoRow
                  icon="location"
                  iconColor="#10B981"
                  label="Dirección Principal"
                  value={client.direccion_texto}
                  multiline
                />
              )}

              {/* Información de Crédito */}
              {client.tiene_credito && (
                <View className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="card" size={16} color="#2563EB" />
                    <Text className="text-blue-900 font-bold text-sm ml-2">Información de Crédito</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <View className="flex-1">
                      <Text className="text-blue-600 text-xs font-medium">Límite</Text>
                      <Text className="text-blue-900 font-bold text-sm">
                        ${parseFloat(client.limite_credito || '0').toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-blue-600 text-xs font-medium">Saldo</Text>
                      <Text className="text-blue-900 font-bold text-sm">
                        ${parseFloat(client.saldo_actual || '0').toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-blue-600 text-xs font-medium">Plazo</Text>
                      <Text className="text-blue-900 font-bold text-sm">{client.dias_plazo} días</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {client.ubicacion_gps && (
            <View className="mt-4">
              <SectionHeader
                title="Ubicación Principal"
                icon="location"
                iconColor={BRAND_COLORS.red}
              />
              <View className="mt-3">
                <MiniMapPreview
                  height={240}
                  polygon={zonePolygon || undefined}
                  marker={{ latitude: client.ubicacion_gps.coordinates[1], longitude: client.ubicacion_gps.coordinates[0] }}
                  center={{ latitude: client.ubicacion_gps.coordinates[1], longitude: client.ubicacion_gps.coordinates[0] }}
                  onPress={() => openInGoogleMaps(client.ubicacion_gps!.coordinates, client.nombre_comercial || client.razon_social)}
                />
                <View className="flex-row items-center justify-between mt-2">
                  <View className="bg-white px-3 py-1.5 rounded-full border border-neutral-200 shadow-sm">
                    <Text className="text-neutral-700 text-[10px] font-mono font-semibold">
                      {client.ubicacion_gps.coordinates[1].toFixed(6)}, {client.ubicacion_gps.coordinates[0].toFixed(6)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => openInGoogleMaps(client.ubicacion_gps!.coordinates, client.nombre_comercial || client.razon_social)}
                    className="flex-row items-center bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg"
                    activeOpacity={0.8}
                  >
                    <Ionicons name="navigate" size={16} color="#2563EB" />
                    <Text className="text-blue-700 font-semibold text-xs ml-2">
                      Abrir en Google Maps
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Botón editar */}
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('SupervisorClientForm', { client })}
            activeOpacity={0.7}
            className="mt-6 flex-row items-center justify-center py-4 rounded-xl shadow-lg"
            style={{ backgroundColor: BRAND_COLORS.red }}
          >
            <Ionicons name="pencil" size={20} color="white" />
            <Text className="text-white font-bold text-base ml-2">
              Editar Cliente
            </Text>
          </TouchableOpacity>

          {/* Sección Sucursales */}
          <View className="mt-6">
            <SectionHeader
              title="Sucursales"
              subtitle={`${branches.length} ${branches.length === 1 ? 'sucursal' : 'sucursales'}`}
              icon="storefront"
              iconColor={BRAND_COLORS.red}
            />

            {branches.length > 0 ? (
              <View className="mt-3">
                {branches.map((branch, index) => {
                  const isExpanded = expandedBranch === branch.id
                  const hasGPS = branch.ubicacion_gps !== null

                  return (
                    <View key={branch.id} className="mb-3">
                      <View className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
                        <TouchableOpacity
                          activeOpacity={hasGPS ? 0.7 : 1}
                          onPress={() => hasGPS && setExpandedBranch(isExpanded ? null : branch.id)}
                        >
                          <View className="flex-row items-start justify-between">
                            <View className="flex-1 mr-3">
                              {/* Nombre sucursal */}
                              <View className="flex-row items-center mb-2">
                                <Ionicons name="storefront" size={18} color={BRAND_COLORS.red} />
                                <Text className="text-neutral-900 font-bold text-base ml-2 flex-1" numberOfLines={2}>
                                  {branch.nombre_sucursal}
                                </Text>
                              </View>

                              {/* Dirección */}
                              <View className="flex-row items-start mt-1">
                                <Ionicons name="location-outline" size={14} color="#6B7280" style={{ marginTop: 2 }} />
                                <Text className="text-neutral-600 text-sm ml-2 flex-1" numberOfLines={isExpanded ? undefined : 2}>
                                  {branch.direccion_entrega}
                                </Text>
                              </View>

                              {/* Contacto */}
                              {branch.contacto_nombre && (
                                <View className="flex-row items-center mt-2">
                                  <Ionicons name="person-outline" size={14} color="#6B7280" />
                                  <Text className="text-neutral-700 text-xs ml-2 font-medium">
                                    {branch.contacto_nombre}
                                  </Text>
                                </View>
                              )}

                              {/* Teléfono */}
                              {branch.contacto_telefono && (
                                <View className="flex-row items-center mt-1">
                                  <Ionicons name="call-outline" size={14} color="#2563EB" />
                                  <Text className="text-blue-700 text-xs ml-2 font-semibold">
                                    {branch.contacto_telefono}
                                  </Text>
                                </View>
                              )}
                            </View>

                            {/* Estado y toggle */}
                            <View className="items-end">
                              <View className={`px-2 py-1 rounded-full ${branch.activo ? 'bg-green-100' : 'bg-neutral-100'}`}>
                                <Text className={`text-[10px] font-bold ${branch.activo ? 'text-green-700' : 'text-neutral-500'}`}>
                                  {branch.activo ? 'ACTIVA' : 'INACTIVA'}
                                </Text>
                              </View>
                              {hasGPS && (
                                <View className="mt-2">
                                  <Ionicons
                                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color="#9CA3AF"
                                  />
                                </View>
                              )}
                            </View>
                          </View>

                          {/* Badge GPS */}
                          {hasGPS && !isExpanded && (
                            <View className="flex-row items-center mt-3 pt-3 border-t border-neutral-100">
                              <Ionicons name="map" size={14} color="#10B981" />
                              <Text className="text-green-700 text-xs font-semibold ml-2">
                                Ubicación GPS - Toca para ver mapa
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>

                        {/* Mapa expandido */}
                        {isExpanded && hasGPS && (
                          <View className="mt-4 pt-4 border-t border-neutral-100">
                            <MiniMapPreview
                              height={220}
                              polygon={zonePolygon || undefined}
                              marker={{ latitude: branch.ubicacion_gps!.coordinates[1], longitude: branch.ubicacion_gps!.coordinates[0] }}
                              center={{ latitude: branch.ubicacion_gps!.coordinates[1], longitude: branch.ubicacion_gps!.coordinates[0] }}
                              onPress={() => openInGoogleMaps(branch.ubicacion_gps!.coordinates, branch.nombre_sucursal)}
                            />
                          </View>
                        )}
                      </View>
                    </View>
                  )
                })}
              </View>
            ) : (
              <View className="mt-3 bg-white rounded-2xl border border-neutral-200 p-8 items-center">
                <View className="bg-neutral-100 w-16 h-16 rounded-full items-center justify-center mb-3">
                  <Ionicons name="storefront-outline" size={32} color="#9CA3AF" />
                </View>
                <Text className="text-neutral-700 font-semibold text-base mb-1">
                  Sin Sucursales
                </Text>
                <Text className="text-neutral-500 text-sm text-center">
                  Este cliente no tiene sucursales registradas
                </Text>
              </View>
            )}
          </View>

          {/* Espacio inferior */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </View>
  )
}

/**
 * Componente auxiliar para filas de información
 */
interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  label: string
  value: string
  multiline?: boolean
}

function InfoRow({ icon, iconColor, label, value, multiline = false }: InfoRowProps) {
  return (
    <View className="flex-row items-start py-3 border-b border-neutral-100 last:border-b-0">
      <Ionicons name={icon} size={18} color={iconColor} style={{ marginTop: 2 }} />
      <View className="flex-1 ml-3">
        <Text className="text-neutral-500 text-xs font-medium mb-0.5">{label}</Text>
        <Text 
          className="text-neutral-900 text-sm font-semibold" 
          numberOfLines={multiline ? undefined : 1}
        >
          {value}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  coordsBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  }
})
