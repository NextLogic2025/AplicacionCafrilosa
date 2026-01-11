import React, { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { CatalogService, type Product } from '../../../services/api/CatalogService'
import { useCart } from '../../../context/CartContext'

type ProductDetailRouteProp = RouteProp<{ params: { productId: string } }, 'params'>

/**
 * ClientProductDetailScreen
 *
 * Detailed view of a single product for clients
 * Shows full product information, pricing, and promotions
 *
 * Features:
 * - Large product image with fallback
 * - Full product description
 * - Promotion information if applicable
 * - Before/after pricing for promotions
 * - Product specifications (weight, volume, etc.)
 * - Category badge
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

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                <Header title="Detalles del Producto" variant="standard" onBackPress={() => navigation.goBack()} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#DC2626" />
                    <Text style={{ marginTop: 12, color: '#9CA3AF', fontSize: 14 }}>Cargando producto...</Text>
                </View>
            </View>
        )
    }

    if (!product) {
        return (
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                <Header title="Detalles del Producto" variant="standard" onBackPress={() => navigation.goBack()} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
                    <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center' }}>
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
            unidad_medida: product.unidad_medida,
            precio_lista: precioLista,
            precio_final: precioFinal,
            lista_precios_id: product.lista_precios_id || 0,
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
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <Header title="Detalles del Producto" variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView
                contentContainerStyle={{ paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Product Image */}
                <View style={styles.imageContainer}>
                    {product.imagen_url ? (
                        <Image
                            source={{ uri: product.imagen_url }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Text style={styles.placeholderText}>Sin imagen</Text>
                        </View>
                    )}

                    {/* Promotion Badge */}
                    {hasPromotion && (
                        <View style={styles.promotionBadge}>
                            <Text style={styles.promotionBadgeText}>{`¡${discountPercentage}% OFF!`}</Text>
                        </View>
                    )}
                </View>

                <View style={{ paddingHorizontal: 20 }}>
                    {/* Category */}
                    {product.categoria && (
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{product.categoria.nombre}</Text>
                        </View>
                    )}

                    {/* Product Name */}
                    <Text style={styles.productName}>{product.nombre}</Text>

                    {/* SKU Code */}
                    <Text style={styles.skuCode}>{`SKU: ${product.codigo_sku}`}</Text>

                    {/* Pricing Section */}
                    <View style={styles.pricingContainer}>
                        {hasPromotion ? (
                            <>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <Text style={styles.beforePrice}>
                                        {`$${product.precio_original?.toFixed(2)}`}
                                    </Text>
                                    <View style={styles.savingsTag}>
                                        <Text style={styles.savingsText}>
                                            {`Ahorras $${product.ahorro?.toFixed(2)}`}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.afterPrice}>
                                    {`$${product.precio_oferta?.toFixed(2)}`}
                                </Text>
                            </>
                        ) : (
                            <Text style={styles.regularPrice}>
                                {`$${product.precio_original?.toFixed(2) || '0.00'}`}
                            </Text>
                        )}
                        {product.unidad_medida && (
                            <Text style={styles.unitText}>
                                {`Precio por ${product.unidad_medida.toLowerCase()}`}
                            </Text>
                        )}
                    </View>

                    {/* Description Section */}
                    {product.descripcion && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Descripción</Text>
                            <Text style={styles.description}>{product.descripcion}</Text>
                        </View>
                    )}

                    {/* Specifications Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Especificaciones</Text>

                        {product.peso_unitario_kg && product.peso_unitario_kg > 0 && (
                            <View style={styles.specRow}>
                                <Text style={styles.specLabel}>Peso:</Text>
                                <Text style={styles.specValue}>{`${product.peso_unitario_kg} kg`}</Text>
                            </View>
                        )}

                        {product.volumen_m3 && product.volumen_m3 > 0 && (
                            <View style={styles.specRow}>
                                <Text style={styles.specLabel}>Volumen:</Text>
                                <Text style={styles.specValue}>{`${product.volumen_m3} m³`}</Text>
                            </View>
                        )}

                        {product.requiere_frio !== undefined && (
                            <View style={styles.specRow}>
                                <Text style={styles.specLabel}>Requiere frío:</Text>
                                <Text style={styles.specValue}>{product.requiere_frio ? 'Sí' : 'No'}</Text>
                            </View>
                        )}

                        {product.unidad_medida && (
                            <View style={styles.specRow}>
                                <Text style={styles.specLabel}>Unidad:</Text>
                                <Text style={styles.specValue}>{product.unidad_medida}</Text>
                            </View>
                        )}
                    </View>

                    {/* Promotion Details */}
                    {hasPromotion && product.promociones && product.promociones.length > 0 && (
                        <View style={styles.promotionSection}>
                            <Text style={styles.sectionTitle}>Promoción Activa</Text>
                            {product.promociones.map((promo, index) => (
                                <View key={index} style={styles.promoCard}>
                                    <Text style={styles.promoType}>
                                        {promo.tipo_descuento === 'PORCENTAJE' ? 'Descuento por Porcentaje' : 'Descuento Fijo'}
                                    </Text>
                                    {promo.valor_descuento && (
                                        <Text style={styles.promoValue}>
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

            {/* Floating Cart Button */}
            <View style={styles.floatingCartContainer}>
                <View style={styles.quantityControls}>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={decrementQuantity}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="remove" size={20} color="#DC2626" />
                    </TouchableOpacity>
                    <View style={styles.quantityDisplay}>
                        <Text style={styles.quantityText}>{quantity}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={incrementQuantity}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add" size={20} color="#DC2626" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.addToCartButtonFloating}
                    onPress={handleAddToCart}
                    activeOpacity={0.9}
                >
                    <Ionicons name="cart" size={22} color="#FFFFFF" />
                    <Text style={styles.addToCartButtonText}>Agregar al Carrito</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    imageContainer: {
        width: '100%',
        height: 300,
        backgroundColor: '#F3F4F6',
        position: 'relative'
    },
    image: {
        width: '100%',
        height: '100%'
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E5E7EB'
    },
    placeholderText: {
        color: '#9CA3AF',
        fontSize: 16,
        fontWeight: '500'
    },
    promotionBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: '#EF4444',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8
    },
    promotionBadgeText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700'
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginTop: 16,
        marginBottom: 12
    },
    categoryText: {
        color: '#DC2626',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase'
    },
    productName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
        lineHeight: 32
    },
    skuCode: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 20
    },
    pricingContainer: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24
    },
    beforePrice: {
        fontSize: 18,
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
        marginRight: 12
    },
    savingsTag: {
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4
    },
    savingsText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600'
    },
    afterPrice: {
        fontSize: 32,
        fontWeight: '700',
        color: '#10B981'
    },
    regularPrice: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1F2937'
    },
    unitText: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 8
    },
    section: {
        marginBottom: 24
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12
    },
    description: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24
    },
    specRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    specLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500'
    },
    specValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600'
    },
    promotionSection: {
        marginBottom: 24
    },
    promoCard: {
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444'
    },
    promoType: {
        fontSize: 14,
        fontWeight: '600',
        color: '#DC2626',
        marginBottom: 4
    },
    promoValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#991B1B'
    },
    floatingCartContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 4
    },
    quantityButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8
    },
    quantityDisplay: {
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    quantityText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937'
    },
    addToCartButtonFloating: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DC2626',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6
    },
    addToCartButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3
    }
})
