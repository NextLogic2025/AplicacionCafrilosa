import React from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../../shared/types'
import type { PriceList } from '../../../../../services/api/PriceService'
import type { PromotionClient } from '../../../../../services/api/PromotionService'

type Props = {
  alcance: 'GLOBAL' | 'POR_LISTA' | 'POR_CLIENTE'
  setAlcance: (v: 'GLOBAL' | 'POR_LISTA' | 'POR_CLIENTE') => void
  listaId?: number
  setListaId: (id: number | undefined) => void
  priceLists: PriceList[]
  promoClients: PromotionClient[]
  onAddClient: () => void
  onRemoveClient: (clientId: string) => void
}

export function PromotionScopeSection({ alcance, setAlcance, listaId, setListaId, priceLists, promoClients, onAddClient, onRemoveClient }: Props) {
  return (
    <View className="bg-white mx-4 mt-4 p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
      <Text className="text-gray-500 font-bold text-xs mb-3 uppercase tracking-wider">Alcance de la promoción</Text>

      <View className="flex-row mb-4">
        {[
          { id: 'GLOBAL', icon: 'globe', label: 'Global' },
          { id: 'POR_LISTA', icon: 'list', label: 'Por lista' },
          { id: 'POR_CLIENTE', icon: 'people', label: 'Por cliente' },
        ].map((opt, idx) => (
          <TouchableOpacity
            key={opt.id}
            onPress={() => setAlcance(opt.id as any)}
            className={`flex-1 p-3 rounded-xl items-center border ${idx !== 0 ? 'ml-2' : ''} ${
              alcance === opt.id ? 'bg-red-50 border-red-500' : 'bg-white border-gray-200'
            }`}
          >
            <Ionicons name={opt.icon as any} size={20} color={alcance === opt.id ? BRAND_COLORS.red : '#9CA3AF'} />
            <Text className={`text-[10px] font-bold mt-1 ${alcance === opt.id ? 'text-red-600' : 'text-gray-400'}`}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {alcance === 'POR_LISTA' && (
        <View>
          <Text className="text-xs font-bold text-gray-400 mb-2">Selecciona lista de precios:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {priceLists.map(l => (
              <TouchableOpacity
                key={l.id}
                onPress={() => setListaId(l.id)}
                className={`mr-2 px-4 py-2 rounded-full border ${listaId === l.id ? 'bg-teal-600 border-teal-600' : 'bg-gray-50 border-gray-200'}`}
              >
                <Text className={listaId === l.id ? 'text-white font-bold' : 'text-gray-600'}>{l.nombre}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {alcance === 'POR_CLIENTE' && (
        <View>
          <View className="flex-row justify-between items-center mb-3 mt-2">
            <Text className="text-xs font-bold text-neutral-600">Clientes seleccionados ({promoClients.length})</Text>
            <TouchableOpacity onPress={onAddClient} className="bg-red-600 px-4 py-2 rounded-lg flex-row items-center">
              <Ionicons name="add" size={16} color="white" />
              <Text className="text-white text-xs font-bold ml-1">Agregar</Text>
            </TouchableOpacity>
          </View>
          {promoClients.length === 0 ? (
            <View className="bg-neutral-50 p-6 rounded-xl items-center border border-dashed border-neutral-300">
              <Ionicons name="people-outline" size={40} color="#9CA3AF" />
              <Text className="text-neutral-500 text-sm text-center mt-2">No hay clientes seleccionados</Text>
              <Text className="text-neutral-400 text-xs text-center mt-1">Toca "Agregar" para seleccionar clientes</Text>
            </View>
          ) : (
            <View>
              {promoClients.map(c => (
                <View key={c.cliente_id} className="bg-white rounded-lg p-3 border border-neutral-100 flex-row items-center mb-2">
                  <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <Ionicons name="person" size={20} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-neutral-900 font-semibold">
                      {c.cliente?.razon_social || c.cliente?.nombre_comercial || `ID: ${c.cliente_id}`}
                    </Text>
                    {c.cliente?.identificacion && <Text className="text-xs text-neutral-500 mt-0.5">{c.cliente.identificacion}</Text>}
                  </View>
                  <TouchableOpacity onPress={() => onRemoveClient(c.cliente_id)} className="w-8 h-8 rounded-full bg-red-100 items-center justify-center">
                    <Ionicons name="close" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  )
}

