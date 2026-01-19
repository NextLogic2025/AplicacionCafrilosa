import React from 'react'
import { View, Text, Image, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Product } from '../../services/api/CatalogService'

interface ClientProductCardProps {
    product: Product
    onPress: (product: Product) => void
    onAddToCart?: (product: Product) => void
}

export function ClientProductCard({ product, onPress, onAddToCart }: ClientProductCardProps) {
    const hasPromotion = !!product.precio_oferta && product.precio_oferta < (product.precio_original ?? 0)

    return (
        <TouchableOpacity
            className="bg-white rounded-2xl mb-4 shadow-lg border border-gray-100 h-[350px] overflow-hidden w-full"
            onPress={() => onPress(product)}
            activeOpacity={0.8}
        >
            {hasPromotion && (
                <View className="absolute top-2.5 right-2.5 bg-red-600 px-2.5 py-1.5 rounded-full z-10 flex-row items-center shadow-md">
                    <Ionicons name="pricetag" size={12} color="#FFFFFF" className="mr-1" />
                    <Text className="text-white text-[11px] font-extrabold tracking-wide">PROMOCIÓN</Text>
                </View>
            )}

            {product.activo && (
                <View className="absolute top-2.5 left-2.5 bg-white/95 px-2 py-1.5 rounded-xl z-10 shadow-sm">
                    <View className="w-2 h-2 rounded-full bg-emerald-500" />
                </View>
            )}

            <View className="w-full h-[140px] bg-gray-50">
                {product.imagen_url ? (
                    <Image
                        source={{ uri: product.imagen_url }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="w-full h-full justify-center items-center bg-gray-100">
                        <Ionicons name="image-outline" size={32} color="#D1D5DB" />
                    </View>
                )}
            </View>

            <View className="p-3 flex-1 justify-between">
                <Text className="text-sm font-bold text-gray-900 leading-5 mb-2 min-h-[40px]" numberOfLines={2} ellipsizeMode="tail">
                    {product.nombre}
                </Text>

                <View className="mb-auto">
                    {hasPromotion ? (
                        <>
                            <View className="flex-row items-center mb-1">
                                <Text className="text-[13px] font-semibold text-gray-400 line-through mr-1.5">
                                    ${product.precio_original?.toFixed(2)}
                                </Text>
                                <View className="flex-row items-center bg-emerald-100 px-1.5 py-0.5 rounded-lg">
                                    <Ionicons name="arrow-down" size={10} color="#059669" />
                                    <Text className="text-[10px] font-bold text-emerald-600 ml-0.5">
                                        ${product.ahorro?.toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-row items-center">
                                <Text className="text-2xl font-extrabold text-emerald-500">
                                    ${product.precio_oferta?.toFixed(2)}
                                </Text>
                                <Ionicons name="flash" size={16} color="#10B981" className="ml-1" />
                            </View>
                        </>
                    ) : (
                        <View className="flex-row items-center">
                            <Text className="text-xl font-bold text-gray-800">
                                ${product.precio_original?.toFixed(2) || '0.00'}
                            </Text>
                        </View>
                    )}
                </View>

                {product.unidad_medida && (
                    <View className="flex-row items-center mb-2">
                        <Ionicons name="cube-outline" size={12} color="#9CA3AF" />
                        <Text className="text-[11px] text-gray-500 ml-1 font-medium">
                            {`Por ${product.unidad_medida.toLowerCase()}`}
                        </Text>
                    </View>
                )}

                {onAddToCart && (
                    <TouchableOpacity
                        className="flex-row items-center justify-center bg-red-600 py-2.5 px-4 rounded-xl mt-3 shadow-md"
                        onPress={(e) => {
                            e.stopPropagation()
                            onAddToCart(product)
                        }}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="cart" size={16} color="#FFFFFF" />
                        <Text className="text-white text-[13px] font-bold ml-1.5 tracking-wide">Agregar</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    )
}
