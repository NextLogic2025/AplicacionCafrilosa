import React from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../../shared/types'
import type { PriceList } from '../../../../../services/api/PriceService'
import type { PromotionCampaign } from '../../../../../services/api/PromotionService'

type Props = {
  campaigns: PromotionCampaign[]
  priceLists: PriceList[]
  formatPrice: (price: number) => string
}

export function ProductActivePromotionsSummary({ campaigns, priceLists, formatPrice }: Props) {
  if (campaigns.length === 0) return null

  const globalCampaigns = campaigns.filter(c => c.alcance === 'GLOBAL')
  const listCampaigns = campaigns.filter(c => c.alcance === 'POR_LISTA')

  return (
    <View className="px-4 pt-5">
      <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        <View className="flex-row items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-100">
          <View className="flex-row items-center">
            <Ionicons name="sparkles-outline" size={20} color={BRAND_COLORS.red} />
            <Text className="font-bold text-neutral-900 text-base ml-2">Promociones activas</Text>
          </View>
          <View style={{ backgroundColor: `${BRAND_COLORS.red}15` }} className="px-2 py-1 rounded-lg">
            <Text style={{ color: BRAND_COLORS.red }} className="text-xs font-bold">
              {campaigns.length} activa(s)
            </Text>
          </View>
        </View>

        <View className="p-4">
          {globalCampaigns.length > 0 && (
            <View className="mb-3">
              <View className="flex-row items-center mb-2">
                <View className="w-5 h-5 rounded-full bg-neutral-100 items-center justify-center mr-2">
                  <Ionicons name="globe-outline" size={12} color="#6B7280" />
                </View>
                <Text className="text-neutral-600 font-semibold text-xs">PROMOCIONES GLOBALES ({globalCampaigns.length})</Text>
              </View>
              {globalCampaigns.map(campaign => (
                <View key={campaign.id} style={{ backgroundColor: `${BRAND_COLORS.red}08` }} className="flex-row items-center py-2 px-3 rounded-lg mb-1">
                  <Ionicons name="checkmark-circle" size={14} color={BRAND_COLORS.red} />
                  <Text className="text-neutral-700 text-sm ml-2 flex-1">{campaign.nombre}</Text>
                  <View style={{ backgroundColor: BRAND_COLORS.red }} className="px-2 py-0.5 rounded">
                    <Text className="text-white text-[10px] font-bold">
                      {campaign.tipo_descuento === 'PORCENTAJE' ? `${campaign.valor_descuento}%` : formatPrice(campaign.valor_descuento)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {listCampaigns.length > 0 && (
            <View>
              <View className="flex-row items-center mb-2">
                <View className="w-5 h-5 rounded-full bg-neutral-100 items-center justify-center mr-2">
                  <Ionicons name="list-outline" size={12} color="#6B7280" />
                </View>
                <Text className="text-neutral-600 font-semibold text-xs">PROMOCIONES POR LISTA ({listCampaigns.length})</Text>
              </View>
              {listCampaigns.map(campaign => {
                const targetList = priceLists.find(l => l.id === campaign.lista_precios_objetivo_id)
                return (
                  <View key={campaign.id} className="flex-row items-center py-2 px-3 bg-neutral-50 rounded-lg mb-1">
                    <Ionicons name="checkmark-circle" size={14} color={BRAND_COLORS.red} />
                    <View className="flex-1 ml-2">
                      <Text className="text-neutral-700 text-sm">{campaign.nombre}</Text>
                      <Text className="text-neutral-500 text-[10px]">Aplica solo a: {targetList?.nombre || 'Lista no encontrada'}</Text>
                    </View>
                    <View style={{ backgroundColor: BRAND_COLORS.red }} className="px-2 py-0.5 rounded">
                      <Text className="text-white text-[10px] font-bold">
                        {campaign.tipo_descuento === 'PORCENTAJE' ? `${campaign.valor_descuento}%` : formatPrice(campaign.valor_descuento)}
                      </Text>
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          <View style={{ backgroundColor: `${BRAND_COLORS.red}08`, borderColor: `${BRAND_COLORS.red}20` }} className="rounded-xl p-3 border mt-4">
            <Text className="text-neutral-600 text-xs leading-5">
              Las promociones globales aplican a cualquier lista. Las promociones por lista solo aplican a la lista indicada.
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
