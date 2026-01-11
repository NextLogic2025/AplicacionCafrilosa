import React, { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { CatalogService, type Product } from '../../../services/api/CatalogService'
import { useCart } from '../../../context/CartContext'

type ProductDetailRouteProp = RouteProp<{ params: { productId: string; selectedListId?: number } }, 'params'>

/**
 * SellerProductDetailScreen
 *
 * Detailed view of a single product for sellers (vendedores)
 * Shows selected price list or ALL price lists if none selected
 * Displays GLOBAL promotions only
 *
 * Features:
 * - Full product information
 * - Selected price list displayed prominently (or all if no filter)
 * - GLOBAL promotions only (POR_LISTA and POR_CLIENTE hidden)
 * - Product specifications
 * - Category information
 */
export function SellerProductDetailScreen() {
    const navigation = useNavigation()
    const route = useRoute<ProductDetailRouteProp>()
    const { productId, selectedListId } = route.params
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

    const handleAddToCart = () => {
        if (!product || !selectedListId) {
            Alert.alert('Error', 'Seleccione una lista de precios primero')
            return
        }

        const selectedPrice = product.precios?.find(p => p.lista_id === selectedListId)
        if (!selectedPrice) {
            Alert.alert('Error', 'No se encontró precio para esta lista')
            return
        }

        // Determinar si hay promoción aplicada
        const hasPromotion = !!(
            product.precio_oferta &&
            product.precio_original &&
            product.precio_oferta < product.precio_original
        )

        const precioFinal = hasPromotion ? product.precio_oferta! : selectedPrice.precio
        const descuentoPorcentaje = hasPromotion && product.precio_original
            ? Math.round(((product.precio_original - product.precio_oferta!) / product.precio_original) * 100)
            : undefined

        addToCart({
            id: product.id,
            codigo_sku: product.codigo_sku,
            nombre: product.nombre,
            imagen_url: product.imagen_url || '',
            unidad_medida: product.unidad_medida,
            precio_lista: selectedPrice.precio,
            precio_final: precioFinal,
            lista_precios_id: selectedListId,
            tiene_promocion: hasPromotion,
            descuento_porcentaje: descuentoPorcentaje
        }, quantity)

        Alert.alert(
            'Agregado al Carrito',
            `${quantity} x ${product.nombre} agregado al carrito`,
            [
                { text: 'Seguir Comprando', style: 'cancel' },
                { text: 'Ver Carrito', onPress: () => (navigation as any).navigate('SellerCart') }
            ]
        )
    }

    const incrementQuantity = () => setQuantity(prev => prev + 1)
    const decrementQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1))

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

    const hasGlobalPromotion = product.promociones && product.promociones.length > 0
    const priceListNames: Record<number, string> = {
        1: 'General',
        2: 'Mayorista',
        3: 'Horeca'
    }

    // Filter prices based on selectedListId if provided
    const displayPrices = selectedListId
        ? product.precios?.filter(p => p.lista_id === selectedListId) || []
        : product.precios || []

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
                    {hasGlobalPromotion && (
                        <View style={styles.promotionBadge}>
                            <Text style={styles.promotionBadgeText}>¡PROMOCIÓN GLOBAL!</Text>
                        </View>
                    )}
                </View>

                <View style={{ paddingHorizontal: 20 }}>
                    {/* Category */}
                    {product.categoria && (
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>
                                {typeof product.categoria === 'object' && 'nombre' in product.categoria
                                    ? product.categoria.nombre
                                    : 'Sin categoría'}
                            </Text>
                        </View>
                    )}

                    {/* Product Name */}
                    <Text style={styles.productName}>{product.nombre}</Text>

                    {/* SKU Code */}
                    <Text style={styles.skuCode}>{`SKU: ${product.codigo_sku}`}</Text>

                    {/* Price Lists Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {selectedListId ? 'Precio Seleccionado' : 'Precios por Lista'}
                        </Text>
                        <View style={styles.priceListContainer}>
                            {displayPrices.length > 0 ? (
                                displayPrices.map((precio, index) => (
                                    <View key={index} style={styles.priceListRow}>
                                        <View style={styles.priceListBadge}>
                                            <Text style={styles.priceListName}>
                                                {priceListNames[precio.lista_id] || `Lista #${precio.lista_id}`}
                                            </Text>
                                        </View>
                                        <Text style={styles.priceListValue}>
                                            ${precio.precio?.toFixed(2) || '0.00'}
                                        </Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
                                    No hay precios disponibles para esta lista
                                </Text>
                            )}
                        </View>
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

                    {/* Global Promotions */}
                    {hasGlobalPromotion && (
                        <View style={styles.promotionSection}>
                            <Text style={styles.sectionTitle}>Promociones Globales Activas</Text>
                            {product.promociones!.map((promo, index) => (
                                <View key={index} style={styles.promoCard}>
                                    <Text style={styles.promoType}>
                                        {promo.tipo_descuento === 'PORCENTAJE'
                                            ? 'Descuento por Porcentaje'
                                            : promo.tipo_descuento === 'MONTO_FIJO'
                                            ? 'Descuento Fijo'
                                            : 'Promoción Especial'}
                                    </Text>
                                    {promo.valor_descuento && (
                                        <Text style={styles.promoValue}>
                                            {promo.tipo_descuento === 'PORCENTAJE'
                                                ? `${promo.valor_descuento}% de descuento`
                                                : `$${promo.valor_descuento} de descuento`
                                            }
                                        </Text>
                                    )}
                                    {promo.precio_oferta && (
                                        <Text style={styles.promoPrice}>
                                            {`Precio promocional: $${promo.precio_oferta.toFixed(2)}`}
                                        </Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Floating Add to Cart Button */}
            {selectedListId && displayPrices.length > 0 && (
                <View style={styles.floatingCartContainer}>
                    {/* Quantity Controls */}
                    <View style={styles.quantityControls}>
                        <TouchableOpacity
                            onPress={decrementQuantity}
                            style={styles.quantityButton}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="remove" size={20} color="#DC2626" />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{quantity}</Text>
                        <TouchableOpacity
                            onPress={incrementQuantity}
                            style={styles.quantityButton}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="add" size={20} color="#DC2626" />
                        </TouchableOpacity>
                    </View>

                    {/* Add to Cart Button */}
                    <TouchableOpacity
                        onPress={handleAddToCart}
                        style={styles.addToCartButton}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="cart" size={22} color="#FFFFFF" />
                        <Text style={styles.addToCartText}>Agregar al Carrito</Text>
                    </TouchableOpacity>
                </View>
            )}
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
        backgroundColor: '#DC2626',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8
    },
    promotionBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
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
        fontSize: 22,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
        lineHeight: 30
    },
    skuCode: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 20
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
    priceListContainer: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12
    },
    priceListRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    priceListBadge: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6
    },
    priceListName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#DC2626'
    },
    priceListValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937'
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
        borderLeftColor: '#DC2626',
        marginBottom: 12
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
        color: '#991B1B',
        marginBottom: 4
    },
    promoPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#059669'
    },
    floatingCartContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 8,
        gap: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    quantityButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DC2626'
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        minWidth: 32,
        textAlign: 'center'
    },
    addToCartButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DC2626',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    addToCartText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3
    }
})
