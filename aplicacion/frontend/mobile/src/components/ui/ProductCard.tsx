import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Ionicons } from '@expo/vector-icons'
import * as React from 'react'
import { Image, Pressable, Text, View } from 'react-native'

type Product = {
    id: string
    name: string
    price: number
    image?: string
    category: string
    code: string
}

type Props = {
    product: Product
    onPress: () => void
    onAdd: () => void
}

export function ProductCard({ product, onPress, onAdd }: Props) {
    return (
        <Pressable
            onPress={onPress}
            className="bg-white rounded-2xl p-3 shadow-sm shadow-black/5 flex-row items-center mb-4 border border-neutral-100"
        >
            {/* Imagen Placeholder o Real */}
            <View className="h-20 w-20 bg-neutral-50 rounded-xl items-center justify-center mr-4">
                {product.image ? (
                    <Image source={{ uri: product.image }} className="h-full w-full rounded-xl" resizeMode="cover" />
                ) : (
                    <Ionicons name="image-outline" size={32} color="#D1D5DB" />
                )}
            </View>

            <View className="flex-1 mr-2">
                {/* Código y Categoría */}
                <View className="flex-row items-center gap-2 mb-1">
                    <Text className="text-[10px] text-neutral-400 font-bold bg-neutral-100 px-1.5 py-0.5 rounded text-center">
                        {product.code}
                    </Text>
                    <Text className="text-[10px] text-brand-red font-medium uppercase tracking-wide">
                        {product.category}
                    </Text>
                </View>

                <Text className="text-neutral-900 font-bold text-base leading-tight mb-1">
                    {product.name}
                </Text>
                <Text className="text-lg font-extrabold text-neutral-900">
                    ${product.price.toFixed(2)}
                </Text>
            </View>

            <Pressable
                onPress={onAdd}
                className="h-10 w-10 bg-brand-red rounded-full items-center justify-center shadow-md shadow-red-500/30 active:scale-95 transition-transform"
            >
                <Ionicons name="add" size={24} color="white" />
            </Pressable>
        </Pressable >
    )
}
