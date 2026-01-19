import React, { useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Product } from '../../../../../services/api/CatalogService'
import type { Client } from '../../../../../services/api/ClientService'
import type { PromotionClient, PromotionProduct } from '../../../../../services/api/PromotionService'

type Props = {
  type: 'clients' | 'products'
  availableClients: Client[]
  availableProducts: Product[]
  promoClients: PromotionClient[]
  promoProducts: PromotionProduct[]
  searchText: string
  setSearchText: (v: string) => void
  onClose: () => void
  onAddClient: (client: Client) => void
  onAddProduct: (product: Product) => void
}

export function PromotionItemPickerScreen({
  type,
  availableClients,
  availableProducts,
  promoClients,
  promoProducts,
  searchText,
  setSearchText,
  onClose,
  onAddClient,
  onAddProduct,
}: Props) {
  const isClient = type === 'clients'

  const items = useMemo(() => {
    if (isClient) return availableClients.filter(c => !promoClients.some(pc => pc.cliente_id === c.id))
    return availableProducts.filter(p => !promoProducts.some(pp => pp.producto_id === p.id))
  }, [availableClients, availableProducts, isClient, promoClients, promoProducts])

  const filtered = useMemo(() => {
    const searchLower = searchText.toLowerCase()
    return items.filter(i => {
      const label = isClient ? (i.razon_social || i.nombre_comercial || i.id) : i.nombre
      const code = isClient ? i.identificacion : i.codigo_sku
      return (label || '').toLowerCase().includes(searchLower) || (code || '').toLowerCase().includes(searchLower)
    })
  }, [items, isClient, searchText])

  return (
    <View className="flex-1 bg-neutral-50">
      <View className="pt-12 px-4 pb-4 bg-white border-b border-neutral-200 shadow-sm">
        <View className="flex-row items-center mb-3">
          <TouchableOpacity onPress={onClose} className="w-10 h-10 items-center justify-center rounded-full bg-neutral-100 mr-3">
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="flex-1 text-lg font-bold text-neutral-900">{isClient ? 'Seleccionar cliente' : 'Seleccionar producto'}</Text>
        </View>
        <View className="flex-row items-center bg-neutral-100 rounded-xl px-4 h-12">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base text-neutral-900"
            placeholder={isClient ? 'Buscar por nombre o identificación...' : 'Buscar por nombre o SKU...'}
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
            autoFocus
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <Text className="text-xs text-neutral-500 mt-2">{`${filtered.length} ${filtered.length === 1 ? 'resultado' : 'resultados'}`}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {filtered.map(item => (
          <TouchableOpacity
            key={item.id}
            onPress={() => (isClient ? onAddClient(item as Client) : onAddProduct(item as Product))}
            className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-neutral-100"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${isClient ? 'bg-blue-100' : 'bg-purple-100'}`}>
                <Ionicons name={isClient ? 'person' : 'cube'} size={24} color={isClient ? '#3B82F6' : '#9333EA'} />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-neutral-900 text-base mb-1">
                  {isClient ? ((item as Client).razon_social || (item as Client).nombre_comercial || (item as Client).id) : (item as Product).nombre}
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="pricetag-outline" size={12} color="#9CA3AF" />
                  <Text className="text-sm text-neutral-500 ml-1">
                    {isClient ? (item as Client).identificacion : (item as Product).codigo_sku}
                  </Text>
                </View>
                {isClient && (item as Client).ciudad && (
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                    <Text className="text-xs text-neutral-400 ml-1">{(item as Client).ciudad}</Text>
                  </View>
                )}
              </View>
              <View className="w-8 h-8 rounded-full bg-red-100 items-center justify-center">
                <Ionicons name="add" size={20} color="#DC2626" />
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View className="items-center justify-center py-12">
            <View className="w-20 h-20 rounded-full bg-neutral-100 items-center justify-center mb-4">
              <Ionicons name="search-outline" size={40} color="#9CA3AF" />
            </View>
            <Text className="text-center text-neutral-600 font-semibold text-base">No se encontraron resultados</Text>
            <Text className="text-center text-neutral-400 text-sm mt-1">Intenta con otros términos de búsqueda</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

