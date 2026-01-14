import { BRAND_COLORS } from '../../shared/types'
import { Ionicons } from '@expo/vector-icons'
import * as React from 'react'
import { Image, Pressable, Text, View } from 'react-native'

// Tipo local para CartItemRow (compatible con formato adaptado)
type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  category: string
  code: string
}

type Props = {
  item: CartItem
  onIncrement: () => void
  onDecrement: () => void
  onRemove: () => void
}

export function CartItemRow({ item, onIncrement, onDecrement, onRemove }: Props) {
  const subtotal = item.price * item.quantity

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-neutral-100 shadow-sm shadow-black/5">
      {/* Header com produto e preço */}
      <View className="flex-row gap-3 mb-3">
        {/* Imagem */}
        <View className="h-16 w-16 bg-neutral-50 rounded-xl items-center justify-center flex-shrink-0">
          {item.image ? (
            <Image source={{ uri: item.image }} className="h-full w-full rounded-xl" resizeMode="cover" />
          ) : (
            <Ionicons name="image-outline" size={24} color="#D1D5DB" />
          )}
        </View>

        {/* Info do produto */}
        <View className="flex-1">
          {/* Código e Categoria */}
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-[10px] text-neutral-400 font-bold bg-neutral-100 px-1.5 py-0.5 rounded">
              {item.code}
            </Text>
            <Text className="text-[10px] text-brand-red font-medium uppercase tracking-wide">
              {item.category}
            </Text>
          </View>

          <Text className="text-neutral-900 font-semibold text-sm leading-tight mb-1">
            {item.name}
          </Text>

          <Text className="text-lg font-extrabold text-brand-red">
            ${item.price.toFixed(2)}
          </Text>
        </View>

        {/* Botão remover */}
        <Pressable
          onPress={onRemove}
          className="items-center justify-center w-8 h-8 rounded-full bg-red-50 active:bg-red-100"
        >
          <Ionicons name="trash-outline" size={18} color={BRAND_COLORS.red} />
        </Pressable>
      </View>

      {/* Quantity Controller */}
      <View className="flex-row items-center justify-between bg-neutral-50 rounded-xl p-2">
        <Pressable
          onPress={onDecrement}
          className="items-center justify-center w-8 h-8 rounded-lg bg-white border border-neutral-200 active:bg-neutral-100"
        >
          <Ionicons name="remove" size={18} color={BRAND_COLORS.red} />
        </Pressable>

        <View className="items-center flex-1">
          <Text className="text-neutral-600 text-xs font-medium mb-0.5">Cantidad</Text>
          <Text className="font-extrabold text-neutral-900 text-base">{item.quantity}</Text>
        </View>

        <Pressable
          onPress={onIncrement}
          className="items-center justify-center w-8 h-8 rounded-lg bg-white border border-neutral-200 active:bg-neutral-100"
        >
          <Ionicons name="add" size={18} color={BRAND_COLORS.red} />
        </Pressable>

        {/* Subtotal */}
        <View className="ml-auto items-end">
          <Text className="text-neutral-600 text-xs font-medium mb-0.5">Subtotal</Text>
          <Text className="font-extrabold text-neutral-900 text-base">
            ${subtotal.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  )
}
