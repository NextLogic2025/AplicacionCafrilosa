import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../../shared/types'
import type { PriceList } from '../../../../../services/api/PriceService'
import type { PromotionCampaign } from '../../../../../services/api/PromotionService'

type BestDeal = { price: number; campaignId: number | null; discountType: string; discountValue: number }

type Props = {
  list: PriceList
  basePrice: number
  promotions: PromotionCampaign[]
  expanded: boolean
  onToggleExpanded: () => void
  formatPrice: (price: number) => string
  calculateDiscountedPrice: (basePrice: number, campaign: PromotionCampaign) => number
}

export function ProductPriceListCard({ list, basePrice, promotions, expanded, onToggleExpanded, formatPrice, calculateDiscountedPrice }: Props) {
  const hasPromotions = promotions.length > 0
  const bestDeal = promotions.reduce<BestDeal>(
    (best, campaign) => {
      const discountedPrice = calculateDiscountedPrice(basePrice, campaign)
      if (discountedPrice < best.price) {
        return { price: discountedPrice, campaignId: campaign.id, discountType: campaign.tipo_descuento, discountValue: campaign.valor_descuento }
      }
      return best
    },
    { price: basePrice, campaignId: null, discountType: '', discountValue: 0 },
  )
  const bestPrice = bestDeal.price

  return (
    <View className="bg-neutral-50 rounded-2xl overflow-hidden border border-neutral-200 mb-4">
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-neutral-200">
        <View className="flex-row items-center flex-1">
          <View style={{ backgroundColor: `${BRAND_COLORS.red}15` }} className="w-10 h-10 rounded-xl items-center justify-center mr-3">
            <Ionicons name="pricetag" size={20} color={BRAND_COLORS.red} />
          </View>
          <View className="flex-1">
            <Text className="text-neutral-900 font-bold text-base" numberOfLines={1}>
              {list.nombre}
            </Text>
            <Text className="text-neutral-500 text-xs">{list.codigo || `Lista #${list.id}`}</Text>
          </View>
        </View>
        {hasPromotions && (
          <View style={{ backgroundColor: `${BRAND_COLORS.red}15` }} className="px-3 py-1 rounded-full">
            <Text style={{ color: BRAND_COLORS.red }} className="text-xs font-bold">
              {promotions.length} PROMO{promotions.length > 1 ? 'S' : ''}
            </Text>
          </View>
        )}
      </View>

      <View className="px-4 py-4 bg-white">
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-neutral-400 text-xs mb-1">PRECIO BASE</Text>
            <Text className={`font-bold text-xl ${hasPromotions ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>{formatPrice(basePrice)}</Text>
          </View>

          {hasPromotions && (
            <View className="items-end">
              <Text className="text-neutral-400 text-xs mb-1">MEJOR PRECIO</Text>
              <Text style={{ color: BRAND_COLORS.red }} className="font-bold text-xl">
                {formatPrice(bestPrice)}
              </Text>
            </View>
          )}
        </View>

        {hasPromotions && (
          <TouchableOpacity
            onPress={onToggleExpanded}
            className="mt-4 flex-row items-center justify-between bg-neutral-50 border border-neutral-200 px-4 py-3 rounded-xl"
          >
            <View className="flex-row items-center">
              <Ionicons name="pricetags" size={18} color={BRAND_COLORS.red} />
              <Text className="text-neutral-700 font-semibold ml-2">
                Ver {promotions.length} promoción{promotions.length > 1 ? 'es' : ''} disponible{promotions.length > 1 ? 's' : ''}
              </Text>
            </View>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {expanded && hasPromotions && (
        <View className="px-4 py-3 bg-neutral-50 border-t border-neutral-200">
          {promotions.map((campaign, index) => {
            const discountedPrice = calculateDiscountedPrice(basePrice, campaign)
            const campaignSavings = basePrice - discountedPrice
            const isBestDeal = campaign.id === bestDeal.campaignId

            return (
              <View
                key={campaign.id}
                className={`bg-white rounded-xl p-4 border ${isBestDeal ? 'border-2' : 'border-neutral-200'} ${index < promotions.length - 1 ? 'mb-3' : ''}`}
                style={isBestDeal ? { borderColor: BRAND_COLORS.red } : {}}
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Ionicons name="sparkles" size={16} color={BRAND_COLORS.red} />
                      <Text className="text-neutral-900 font-bold text-base ml-2 flex-1" numberOfLines={1}>
                        {campaign.nombre}
                      </Text>
                    </View>
                    <Text className="text-neutral-500 text-xs mt-1">
                      {new Date(campaign.fecha_inicio).toLocaleDateString()} - {new Date(campaign.fecha_fin).toLocaleDateString()}
                    </Text>
                  </View>

                  <View className="items-end">
                    <View style={{ backgroundColor: BRAND_COLORS.red }} className="px-3 py-1 rounded-full">
                      <Text className="text-white text-xs font-bold">
                        {campaign.tipo_descuento === 'PORCENTAJE' ? `${campaign.valor_descuento}%` : formatPrice(campaign.valor_descuento)}
                      </Text>
                    </View>
                    {isBestDeal && (
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="trophy" size={12} color="#F59E0B" />
                        <Text className="text-amber-600 text-[10px] font-bold ml-1">MEJOR OFERTA</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View className="flex-row items-center justify-between bg-neutral-50 p-3 rounded-xl">
                  <View>
                    <Text className="text-neutral-400 text-xs">PRECIO</Text>
                    <Text className="text-neutral-400 text-base line-through">{formatPrice(basePrice)}</Text>
                  </View>
                  <View className="items-center">
                    <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
                  </View>
                  <View className="items-end">
                    <Text className="text-neutral-400 text-xs">CON DESCUENTO</Text>
                    <Text style={{ color: BRAND_COLORS.red }} className="font-bold text-lg">
                      {formatPrice(discountedPrice)}
                    </Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between">
                  <Text className="text-green-600 text-xs font-semibold">
                    Ahorras {formatPrice(campaignSavings)} ({campaign.tipo_descuento === 'PORCENTAJE' ? `${campaign.valor_descuento}%` : 'fijo'})
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="information-circle-outline" size={14} color="#9CA3AF" />
                    <Text className="text-neutral-400 text-xs ml-1">{campaign.tipo_descuento === 'PORCENTAJE' ? 'Porcentaje' : 'Valor fijo'}</Text>
                  </View>
                </View>
              </View>
            )
          })}
        </View>
      )}

      {!hasPromotions && (
        <View className="px-4 py-3 bg-neutral-50">
          <View className="flex-row items-center">
            <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" />
            <Text className="text-neutral-400 text-xs ml-2">Sin promociones activas para esta lista</Text>
          </View>
        </View>
      )}
    </View>
  )
}

