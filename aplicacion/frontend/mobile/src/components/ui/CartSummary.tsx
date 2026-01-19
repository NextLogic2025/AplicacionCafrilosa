import { BRAND_COLORS } from '../../shared/types'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as React from 'react'
import { Text, View } from 'react-native'

type Props = {
  totalItems: number
  subtotal: number
  discount?: number
  tax?: number
  shipping?: number
}

export function CartSummary({ totalItems, subtotal, discount = 0, tax = 0, shipping = 0 }: Props) {
  const total = subtotal - discount + tax + shipping

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8FAFC']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="bg-white rounded-t-3xl border-t border-neutral-100 shadow-lg shadow-black/10 p-5 pt-4"
    >
      <View className="space-y-2.5 mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Ionicons name="bag-outline" size={16} color="#64748B" />
            <Text className="text-neutral-600 font-medium">Subtotal ({totalItems} items)</Text>
          </View>
          <Text className="text-neutral-900 font-semibold">${subtotal.toFixed(2)}</Text>
        </View>

        {discount > 0 && (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="pricetag-outline" size={16} color={BRAND_COLORS.red} />
              <Text className="text-brand-red font-medium">Descuento</Text>
            </View>
            <Text className="text-brand-red font-semibold">-${discount.toFixed(2)}</Text>
          </View>
        )}

        {tax > 0 && (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="receipt-outline" size={16} color="#64748B" />
              <Text className="text-neutral-600 font-medium">Impuesto</Text>
            </View>
            <Text className="text-neutral-900 font-semibold">${tax.toFixed(2)}</Text>
          </View>
        )}

        {shipping > 0 && (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="car-outline" size={16} color="#64748B" />
              <Text className="text-neutral-600 font-medium">Envío</Text>
            </View>
            <Text className="text-neutral-900 font-semibold">${shipping.toFixed(2)}</Text>
          </View>
        )}
      </View>

      <View className="h-px bg-neutral-200 my-3" />

      <View className="flex-row items-baseline justify-between">
        <Text className="text-neutral-600 font-semibold text-sm">Total a pagar</Text>
        <View className="items-end">
          <Text className="text-3xl font-black text-brand-red">
            ${total.toFixed(2)}
          </Text>
          <Text className="text-xs text-neutral-500 font-medium mt-0.5">
            Impuestos incluidos
          </Text>
        </View>
      </View>
    </LinearGradient>
  )
}
