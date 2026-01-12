import React, { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { CatalogService, type Product } from '../../../../services/api/CatalogService'
import { useCart } from '../../../../context/CartContext'

type ProductDetailRouteProp = RouteProp<{ params: { productId: string } }, 'params'>

/**
 * ClientProductDetailScreen - Detalle del Producto para Clientes
 *
 * Vista detallada de un producto individual con:
 * - Imagen grande del producto
 * - Información completa (nombre, SKU, descripción)
 * - Precios con/sin promoción
 * - Especificaciones del producto
 * - Control de cantidad
 * - Botón flotante para agregar al carrito
 *
 * Usa NativeWind (TailwindCSS) para estilos consistentes
 */
export function ClientProductDetailScreen() {
    const navigation = useNavigation()
    const route = useRoute<ProductDetailRouteProp>()
    const { productId } = route.params
    const { addToCart } = useCart()

    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [quantity, setQuantity] = useState(1)

    useEffect(() => {
        loadProductDetails()
    }, [productId])

    const loadProductDetails = async () => {
        try {
            setLoading(true)
            const data = await CatalogService.getProductById(productId)
            setProduct(data)
        } catch (error) {
            console.error('Error loading product details:', error)
        } finally {
            setLoading(false)
        }
    }

    // Estado de carga
    if (loading) {
        return (
            <View className="flex-1 bg-white">
                <Header title="Detalles del Producto" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#DC2626" />
                    <Text className="mt-3 text-neutral-400 text-sm">Cargando producto...</Text>
                </View>
            </View>
        )
    }

    // Estado de error
    if (!product) {
        return (
            <View className="flex-1 bg-white">
                <Header title="Detalles del Producto" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 justify-center items-center px-8">
                    <Text className="text-base text-neutral-500 text-center">
                        No se pudo cargar el producto
                    </Text>
                </View>
            </View>
        )
    }

    const hasPromotion = !!product.precio_oferta && product.precio_oferta < (product.precio_original ?? 0)
    const discountPercentage = hasPromotion && product.precio_original
        ? Math.round(((product.precio_original - product.precio_oferta!) / product.precio_original) * 100)
        : 0

    const incrementQuantity = () => setQuantity(prev => prev + 1)
    const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1))

    const handleAddToCart = () => {
        if (!product) return

        const precioFinal = hasPromotion ? product.precio_oferta! : product.precio_original ?? 0
        const precioLista = product.precio_original ?? 0

        const descuentoPorcentaje = hasPromotion && product.precio_original
            ? Math.round(((product.precio_original - product.precio_oferta!) / product.precio_original) * 100)
            : 0

        addToCart({
            id: product.id,
            codigo_sku: product.codigo_sku,
            nombre: product.nombre,
            imagen_url: product.imagen_url || '',
            unidad_medida: product.unidad_medida || 'UN',
            precio_lista: precioLista,
            precio_final: precioFinal,
            lista_precios_id: (product as any).lista_precios_id || 0,
            tiene_promocion: hasPromotion,
            descuento_porcentaje: descuentoPorcentaje
        }, quantity)

        Alert.alert(
            'Agregado al Carrito',
            `${quantity} x ${product.nombre} agregado al carrito`,
            [
                { text: 'Seguir Comprando', style: 'cancel', onPress: () => navigation.goBack() },
                { text: 'Ver Carrito', onPress: () => navigation.navigate('Carrito' as never) }
            ]
        )
    }

    return (
        <View className="flex-1 bg-white">
            <Header title="Detalles del Producto" variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView
                contentContainerStyle={{ paddingBottom: 140 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Imagen del Producto */}
                <View className="w-full h-[300px] bg-neutral-100 relative">
                    {product.imagen_url ? (
                        <Image
                            source={{ uri: product.imagen_url }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-full justify-center items-center bg-neutral-200">
                            <Text className="text-neutral-400 text-base font-medium">Sin imagen</Text>
                        </View>
                    )}

                    {/* Badge de Promoción */}
                    {hasPromotion && (
                        <View className="absolute top-4 right-4 bg-red-500 px-4 py-2 rounded-lg">
                            <Text className="text-white text-sm font-bold">
                                {`¡${discountPercentage}% OFF!`}
                            </Text>
                        </View>
                    )}
                </View>

                <View className="px-5">
                    {/* Categoría */}
                    {product.categoria && (
                        <View className="self-start bg-red-50 px-3 py-1.5 rounded-md mt-4 mb-3">
                            <Text className="text-brand-red text-xs font-semibold uppercase">
                                {product.categoria.nombre}
                            </Text>
                        </View>
                    )}

                    {/* Nombre del Producto */}
                    <Text className="text-2xl font-bold text-neutral-800 mb-2 leading-8">
                        {product.nombre}
                    </Text>

                    {/* Código SKU */}
                    <Text className="text-[13px] text-neutral-500 mb-5">
                        {`SKU: ${product.codigo_sku}`}
                    </Text>

                    {/* Sección de Precios */}
                    <View className="bg-neutral-50 p-4 rounded-xl mb-6">
                        {hasPromotion ? (
                            <>
                                <View className="flex-row items-center mb-2">
                                    <Text className="text-lg text-neutral-400 line-through mr-3">
                                        {`$${product.precio_original?.toFixed(2)}`}
                                    </Text>
                                    <View className="bg-green-500 px-2 py-1 rounded">
                                        <Text className="text-white text-xs font-semibold">
                                            {`Ahorras $${product.ahorro?.toFixed(2)}`}
                                        </Text>
                                    </View>
                                </View>
                                <Text className="text-[32px] font-bold text-green-500">
                                    {`$${product.precio_oferta?.toFixed(2)}`}
                                </Text>
                            </>
                        ) : (
                            <Text className="text-[32px] font-bold text-neutral-800">
                                {`$${product.precio_original?.toFixed(2) || '0.00'}`}
                            </Text>
                        )}
                        {product.unidad_medida && (
                            <Text className="text-[13px] text-neutral-500 mt-2">
                                {`Precio por ${product.unidad_medida.toLowerCase()}`}
                            </Text>
                        )}
                    </View>

                    {/* Descripción */}
                    {product.descripcion && (
                        <View className="mb-6">
                            <Text className="text-lg font-bold text-neutral-800 mb-3">
                                Descripción
                            </Text>
                            <Text className="text-[15px] text-neutral-600 leading-6">
                                {product.descripcion}
                            </Text>
                        </View>
                    )}

                    {/* Especificaciones */}
                    <View className="mb-6">
                        <Text className="text-lg font-bold text-neutral-800 mb-3">
                            Especificaciones
                        </Text>

                        {product.peso_unitario_kg && product.peso_unitario_kg > 0 && (
                            <View className="flex-row justify-between py-3 border-b border-neutral-100">
                                <Text className="text-sm text-neutral-500 font-medium">Peso:</Text>
                                <Text className="text-sm text-neutral-800 font-semibold">
                                    {`${product.peso_unitario_kg} kg`}
                                </Text>
                            </View>
                        )}

                        {product.volumen_m3 && product.volumen_m3 > 0 && (
                            <View className="flex-row justify-between py-3 border-b border-neutral-100">
                                <Text className="text-sm text-neutral-500 font-medium">Volumen:</Text>
                                <Text className="text-sm text-neutral-800 font-semibold">
                                    {`${product.volumen_m3} m³`}
                                </Text>
                            </View>
                        )}

                        {product.requiere_frio !== undefined && (
                            <View className="flex-row justify-between py-3 border-b border-neutral-100">
                                <Text className="text-sm text-neutral-500 font-medium">Requiere frío:</Text>
                                <Text className="text-sm text-neutral-800 font-semibold">
                                    {product.requiere_frio ? 'Sí' : 'No'}
                                </Text>
                            </View>
                        )}

                        {product.unidad_medida && (
                            <View className="flex-row justify-between py-3 border-b border-neutral-100">
                                <Text className="text-sm text-neutral-500 font-medium">Unidad:</Text>
                                <Text className="text-sm text-neutral-800 font-semibold">
                                    {product.unidad_medida}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Detalles de Promoción */}
                    {hasPromotion && product.promociones && product.promociones.length > 0 && (
                        <View className="mb-6">
                            <Text className="text-lg font-bold text-neutral-800 mb-3">
                                Promoción Activa
                            </Text>
                            {product.promociones.map((promo, index) => (
                                <View 
                                    key={index} 
                                    className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500"
                                >
                                    <Text className="text-sm font-semibold text-brand-red mb-1">
                                        {promo.tipo_descuento === 'PORCENTAJE' ? 'Descuento por Porcentaje' : 'Descuento Fijo'}
                                    </Text>
                                    {promo.valor_descuento && (
                                        <Text className="text-base font-bold text-red-800">
                                            {promo.tipo_descuento === 'PORCENTAJE'
                                                ? `${promo.valor_descuento}% de descuento`
                                                : `$${promo.valor_descuento} de descuento`
                                            }
                                        </Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Botón Flotante - Agregar al Carrito */}
            <View className="absolute bottom-0 left-0 right-0 bg-white px-5 py-4 pb-6 border-t border-neutral-200 flex-row items-center gap-3 shadow-lg">
                {/* Controles de cantidad */}
                <View className="flex-row items-center bg-neutral-50 rounded-xl border border-neutral-200 p-1">
                    <TouchableOpacity
                        className="w-9 h-9 justify-center items-center bg-white rounded-lg"
                        onPress={decrementQuantity}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="remove" size={20} color="#DC2626" />
                    </TouchableOpacity>
                    <View className="px-5 justify-center items-center">
                        <Text className="text-lg font-bold text-neutral-800">{quantity}</Text>
                    </View>
                    <TouchableOpacity
                        className="w-9 h-9 justify-center items-center bg-white rounded-lg"
                        onPress={incrementQuantity}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add" size={20} color="#DC2626" />
                    </TouchableOpacity>
                </View>

                {/* Botón agregar */}
                <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center bg-brand-red py-3.5 px-6 rounded-xl shadow-md"
                    onPress={handleAddToCart}
                    activeOpacity={0.9}
                >
                    <Ionicons name="cart" size={22} color="#FFFFFF" />
                    <Text className="text-white text-base font-bold tracking-wide ml-2">
                        Agregar al Carrito
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}
