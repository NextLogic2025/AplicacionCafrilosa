import * as React from 'react'
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { GenericModal } from '../../../../../components/ui/GenericModal'
import { BRAND_COLORS } from '../../../../../shared/types'
import type { Client, ClientBranch } from '../../../../../services/api/ClientService'
import type { Zone } from '../../../../../services/api/ZoneService'
import type { RouteDestination } from '../routeCreate.types'

type Props = {
  visible: boolean
  selectedZone: Zone | null
  clients: Client[]
  selectedDestinations: RouteDestination[]
  expandedClientId: string | null
  loadingBranchesClientId: string | null
  clientBranches: Map<string, ClientBranch[]>
  searchQuery: string
  onChangeSearchQuery: (value: string) => void
  onClose: () => void
  onExpandClient: (clientId: string) => void
  onAddDestination: (destination: RouteDestination) => void
  onRemoveDestination: (destinationId: string) => void
  parseLocation: (ubicacionGps: { coordinates: number[] } | null | undefined) => { latitude: number; longitude: number } | undefined
}

export function RouteCreateDestinationsModal({
  visible,
  selectedZone,
  clients,
  selectedDestinations,
  expandedClientId,
  loadingBranchesClientId,
  clientBranches,
  searchQuery,
  onChangeSearchQuery,
  onClose,
  onExpandClient,
  onAddDestination,
  onRemoveDestination,
  parseLocation,
}: Props) {
  const selectedZoneId = selectedZone ? Number(selectedZone.id) : null

  return (
    <GenericModal
      visible={visible}
      title={`Destinos (${selectedDestinations.length})`}
      onClose={onClose}
    >
      <View>
        <View className="flex-row items-center bg-neutral-100 rounded-xl px-4 py-3 mb-4">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-neutral-900"
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChangeText={onChangeSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onChangeSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <View className="bg-indigo-50 p-4 rounded-xl mb-4 border border-indigo-100">
          <View className="flex-row items-start mb-2">
            <Ionicons name="bulb" size={18} color="#4F46E5" />
            <Text className="text-indigo-900 font-bold text-sm ml-2">Regla de Zonas</Text>
          </View>
          <Text className="text-indigo-800 text-xs leading-5">
            El vendedor viaja a la <Text className="font-bold">zona</Text>, no al cliente. Solo puedes agregar destinos que estén en{' '}
            <Text className="font-bold">{selectedZone?.nombre || 'la zona seleccionada'}</Text>.
          </Text>
        </View>

        {selectedDestinations.length > 0 && (
          <View className="flex-row flex-wrap mb-3 p-2 bg-neutral-50 rounded-xl">
            {selectedDestinations.slice(0, 4).map((dest) => (
              <View key={dest.id} className="flex-row items-center bg-green-100 rounded-full px-2 py-1 mr-1 mb-1">
                <Text className="text-green-700 text-xs font-medium" numberOfLines={1}>
                  {dest.name.substring(0, 12)}
                </Text>
                <TouchableOpacity onPress={() => onRemoveDestination(dest.id)} className="ml-1">
                  <Ionicons name="close-circle" size={14} color="#22C55E" />
                </TouchableOpacity>
              </View>
            ))}
            {selectedDestinations.length > 4 && (
              <View className="bg-neutral-200 rounded-full px-2 py-1 mb-1">
                <Text className="text-neutral-600 text-xs">+{selectedDestinations.length - 4}</Text>
              </View>
            )}
          </View>
        )}

        <ScrollView className="max-h-64">
          {clients.length === 0 ? (
            <View className="py-8 items-center">
              <Ionicons name="business-outline" size={40} color="#9CA3AF" />
              <Text className="text-neutral-500 font-semibold mt-3">No se encontraron clientes</Text>
              <Text className="text-neutral-400 text-sm mt-1">Intenta con otros términos</Text>
            </View>
          ) : (
            clients.map((client) => {
              const clientName = client.nombre_comercial || client.razon_social || client.nombre || 'Cliente'
              const isExpanded = expandedClientId === client.id
              const branches = clientBranches.get(client.id) || []
              const hasBranchesInZone =
                selectedZoneId == null ? false : branches.some((b) => Number(b.zona_id) === selectedZoneId)

              return (
                <View key={client.id} className="mb-3 bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                  <TouchableOpacity
                    onPress={() => onExpandClient(client.id)}
                    activeOpacity={0.7}
                    className="p-4 flex-row items-center"
                  >
                    <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-3">
                      <Ionicons name="person" size={22} color="#3B82F6" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-neutral-900" numberOfLines={1}>
                        {clientName}
                      </Text>
                      <Text className="text-neutral-500 text-xs mt-1" numberOfLines={1}>
                        {client.identificacion || 'Sin identificación'}
                      </Text>
                      <View className="flex-row items-center mt-2">
                        {selectedZoneId != null && Number(client.zona_comercial_id) === selectedZoneId && (
                          <View className="px-2 py-0.5 rounded-full bg-green-100 mr-2">
                            <Text className="text-[10px] font-medium text-green-700">Matriz en zona</Text>
                          </View>
                        )}
                        {hasBranchesInZone && (
                          <View className="px-2 py-0.5 rounded-full bg-orange-100">
                            <Text className="text-[10px] font-medium text-orange-700">Sucursal en zona</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={22} color="#6B7280" />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View className="px-4 pb-4">
                      <TouchableOpacity
                        onPress={() => {
                          if (!selectedZone || selectedZoneId == null) return
                          if (Number(client.zona_comercial_id) !== selectedZoneId) return

                          const location = parseLocation((client as any).ubicacion_gps)
                          const destination: RouteDestination = {
                            type: 'client',
                            id: client.id,
                            name: clientName,
                            address: (client as any).direccion_texto,
                            location,
                            clientId: client.id,
                            clientName,
                            zoneId: selectedZoneId,
                            zoneName: selectedZone.nombre,
                          }
                          onAddDestination(destination)
                        }}
                        disabled={!selectedZone || selectedZoneId == null || Number(client.zona_comercial_id) !== selectedZoneId}
                        className={`p-3 rounded-xl border mb-3 flex-row items-center ${
                          selectedZoneId != null && Number(client.zona_comercial_id) === selectedZoneId
                            ? 'bg-white border-green-200'
                            : 'bg-neutral-100 border-neutral-200 opacity-60'
                        }`}
                      >
                        <View
                          className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                            selectedZoneId != null && Number(client.zona_comercial_id) === selectedZoneId ? 'bg-green-100' : 'bg-neutral-200'
                          }`}
                        >
                          <Ionicons
                            name="business"
                            size={16}
                            color={selectedZoneId != null && Number(client.zona_comercial_id) === selectedZoneId ? '#22C55E' : '#9CA3AF'}
                          />
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`font-medium text-sm ${
                              selectedZoneId != null && Number(client.zona_comercial_id) === selectedZoneId ? 'text-neutral-900' : 'text-neutral-400'
                            }`}
                            numberOfLines={1}
                          >
                            {(client as any).direccion_texto || 'Sede principal'}
                          </Text>
                          <Text className="text-neutral-500 text-xs mt-1">{selectedZone?.nombre || 'Zona'}</Text>
                        </View>
                        <Ionicons
                          name={selectedZoneId != null && Number(client.zona_comercial_id) === selectedZoneId ? 'add-circle' : 'close-circle'}
                          size={24}
                          color={selectedZoneId != null && Number(client.zona_comercial_id) === selectedZoneId ? '#22C55E' : '#D1D5DB'}
                        />
                      </TouchableOpacity>

                      {loadingBranchesClientId === client.id ? (
                        <View className="py-4 items-center">
                          <ActivityIndicator size="small" color={BRAND_COLORS.red} />
                          <Text className="text-neutral-400 text-xs mt-1">Cargando sucursales...</Text>
                        </View>
                      ) : branches.length > 0 ? (
                        <View>
                          {branches.map((branch) => {
                            const branchZoneId = Number(branch.zona_id)
                            const inZone = selectedZoneId != null && branchZoneId === selectedZoneId
                            const isSelected = selectedDestinations.some((d) => d.id === branch.id)

                            return (
                              <TouchableOpacity
                                key={branch.id}
                                onPress={() => {
                                  if (!selectedZone || selectedZoneId == null) return
                                  if (!inZone || isSelected) return

                                  const branchLocation = parseLocation(branch.ubicacion_gps)
                                  onAddDestination({
                                    type: 'branch',
                                    id: branch.id,
                                    name: branch.nombre_sucursal,
                                    address: branch.direccion_entrega,
                                    location: branchLocation,
                                    clientId: client.id,
                                    clientName,
                                    zoneId: branchZoneId,
                                    zoneName: selectedZone.nombre,
                                  })
                                }}
                                disabled={!inZone || isSelected}
                                className={`p-3 rounded-xl border mb-2 flex-row items-center ${
                                  isSelected
                                    ? 'bg-orange-50 border-orange-400'
                                    : inZone
                                      ? 'bg-white border-orange-200'
                                      : 'bg-neutral-100 border-neutral-200 opacity-60'
                                }`}
                              >
                                <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isSelected ? 'bg-orange-500' : inZone ? 'bg-orange-100' : 'bg-neutral-200'}`}>
                                  <Ionicons
                                    name={isSelected ? 'checkmark' : 'storefront'}
                                    size={16}
                                    color={isSelected ? 'white' : inZone ? BRAND_COLORS.gold : '#9CA3AF'}
                                  />
                                </View>
                                <View className="flex-1">
                                  <Text className={`font-medium text-sm ${inZone ? 'text-neutral-900' : 'text-neutral-400'}`} numberOfLines={1}>
                                    {branch.nombre_sucursal}
                                  </Text>
                                  <Text className="text-neutral-500 text-xs mt-1" numberOfLines={1}>
                                    {branch.direccion_entrega || 'Sin dirección'}
                                  </Text>
                                </View>
                                <Ionicons
                                  name={isSelected ? 'checkmark-circle' : inZone ? 'add-circle' : 'close-circle'}
                                  size={22}
                                  color={isSelected ? BRAND_COLORS.gold : inZone ? BRAND_COLORS.gold : '#D1D5DB'}
                                />
                              </TouchableOpacity>
                            )
                          })}
                        </View>
                      ) : (
                        <View className="py-2">
                          <Text className="text-neutral-400 text-xs italic">Este cliente no tiene sucursales registradas</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )
            })
          )}
        </ScrollView>

        {selectedDestinations.length > 0 && (
          <TouchableOpacity
            onPress={onClose}
            className="mt-4 bg-blue-500 py-4 rounded-2xl items-center"
          >
            <Text className="text-white font-bold">Confirmar ({selectedDestinations.length})</Text>
          </TouchableOpacity>
        )}
      </View>
    </GenericModal>
  )
}


