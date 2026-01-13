import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Product } from '../../services/api/CatalogService'

interface SellerProductCardProps {
    product: Product
    selectedListId: number
    selectedListName?: string
    onPress: (product: Product) => void
    onAddToCart?: (product: Product, selectedListId: number) => void
}

/**
 * SellerProductCard - Tarjeta de Producto para Vendedor
 *
 * Componente de tarjeta moderna para mostrar productos en vista de vendedor
 * Muestra producto con lista de precios seleccionada y promociones GLOBALES
 *
 * Integración Backend:
 * - precio_original: Precio MIN entre TODAS las listas de precios
 * - precio_oferta: Mejor precio calculado de promociones GLOBALES
 * - ahorro: Monto de ahorro (precio_original - precio_oferta)
 * - promociones[]: Array de promociones GLOBALES (vendedor solo ve alcance GLOBAL)
 *
 * Características:
 * - Diseño moderno con sombras y gradientes
 * - Badge de promoción con porcentaje de descuento
 * - Pricing antes/después para productos en oferta
 * - Indicador de stock (producto activo)
 * - Layout profesional en grilla de 2 columnas
 * - Animaciones suaves y feedback táctil
 */
export function SellerProductCard({ product, selectedListId, selectedListName, onPress, onAddToCart }: SellerProductCardProps) {
    // Buscar el precio de la lista seleccionada
    const selectedPrice = product.precios?.find(p => p.lista_id === selectedListId)
    const priceValue = selectedPrice?.precio

    // Verificar si hay promociones GLOBALES
    // El backend envía precio_oferta cuando aplica una promoción
    const hasPromotion = !!(
        product.precio_oferta &&
        product.precio_original &&
        product.precio_oferta < product.precio_original
    )

    // Calcular porcentaje de descuento
    const discountPercentage = hasPromotion && product.precio_original
        ? Math.round(((product.precio_original - product.precio_oferta!) / product.precio_original) * 100)
        : 0

    // Usar el nombre dinámico de la lista o fallback a "Lista #ID"
    const listName = selectedListName || `Lista #${selectedListId}`

    return (
        <TouchableOpacity
            style={[styles.card, styles.cardFixed]}
            onPress={() => onPress(product)}
            activeOpacity={0.8}
        >
            {/* Badge de Promoción */}
            {hasPromotion && (
                <View style={styles.promotionBadge}>
                    <Ionicons name="pricetag" size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
                    <Text style={styles.promotionText}>PROMOCIÓN</Text>
                </View>
            )}

            {/* Indicador de Stock */}
            {product.activo && (
                <View style={styles.stockBadge}>
                    <View style={styles.stockDot} />
                </View>
            )}

            {/* Imagen del Producto */}
            <View style={styles.imageContainer}>
                {product.imagen_url ? (
                    <Image
                        source={{ uri: product.imagen_url }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="image-outline" size={32} color="#D1D5DB" />
                    </View>
                )}
            </View>

            {/* Información del Producto */}
            <View style={styles.infoContainer}>
                {/* Nombre del Producto */}
                <Text style={styles.productName} numberOfLines={2} ellipsizeMode="tail">
                    {product.nombre}
                </Text>

                {/* Badge de Lista de Precios */}
                <View style={styles.listBadge}>
                    <Text style={styles.listBadgeText}>{listName}</Text>
                </View>

                {/* Sección de Precios */}
                {priceValue !== undefined ? (
                    <View style={styles.priceContainer}>
                        {hasPromotion ? (
                            <>
                                {/* Precio Antes (tachado) con Badge de Ahorro */}
                                <View style={styles.beforePriceContainer}>
                                    <Text style={styles.beforePrice}>
                                        ${product.precio_original?.toFixed(2)}
                                    </Text>
                                    <View style={styles.savingsBadge}>
                                        <Ionicons name="arrow-down" size={10} color="#059669" />
                                        <Text style={styles.savingsText}>
                                            ${product.ahorro?.toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                                {/* Precio Después (Promocional) */}
                                <View style={styles.afterPriceContainer}>
                                    <Text style={styles.afterPrice}>
                                        ${product.precio_oferta?.toFixed(2)}
                                    </Text>
                                    <Ionicons name="flash" size={16} color="#DC2626" style={{ marginLeft: 4 }} />
                                </View>
                            </>
                        ) : (
                            <View style={styles.regularPriceContainer}>
                                <Text style={styles.regularPrice}>
                                    ${priceValue.toFixed(2)}
                                </Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.priceContainer}>
                        <Text style={styles.noPriceText}>Sin precio en esta lista</Text>
                    </View>
                )}

                {/* Información de Unidad */}
                {product.unidad_medida && (
                    <View style={styles.unitContainer}>
                        <Ionicons name="cube-outline" size={12} color="#9CA3AF" />
                        <Text style={styles.unitText}>
                            {`Por ${product.unidad_medida.toLowerCase()}`}
                        </Text>
                    </View>
                )}

                {/* Botón Agregar al Carrito */}
                {onAddToCart && priceValue !== undefined && (
                    <TouchableOpacity
                        style={styles.addToCartButton}
                        onPress={(e) => {
                            e.stopPropagation()
                            onAddToCart(product, selectedListId)
                        }}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="cart" size={18} color="#FFFFFF" />
                        <Text style={styles.addToCartText}>Agregar</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 5,
        overflow: 'hidden',
        width: '100%',
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    promotionBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#DC2626',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4
    },
    promotionText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    stockBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 12,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    stockDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981'
    },
    imageContainer: {
        width: '100%',
        height: 140,
        backgroundColor: '#F9FAFB'
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
        backgroundColor: '#F3F4F6'
    },
    infoContainer: {
        padding: 12,
        flex: 1,
        justifyContent: 'space-between'
    },
    productName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        lineHeight: 20,
        marginBottom: 8,
        minHeight: 40
    },
    listBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginBottom: 8
    },
    listBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#4F46E5',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    priceContainer: {
        marginBottom: 8
    },
    beforePriceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4
    },
    beforePrice: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
        marginRight: 6
    },
    savingsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8
    },
    savingsText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#059669',
        marginLeft: 2
    },
    afterPriceContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    afterPrice: {
        fontSize: 22,
        fontWeight: '800',
        color: '#DC2626'
    },
    regularPriceContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    regularPrice: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937'
    },
    noPriceText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#D1D5DB',
        fontStyle: 'italic'
    },
    unitContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    unitText: {
        fontSize: 11,
        color: '#6B7280',
        marginLeft: 4,
        fontWeight: '500'
    },
    addToCartButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DC2626',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginTop: 12,
        gap: 6,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3
    },
    // Card fixed height to match client view and keep add button aligned
    cardFixed: {
        height: 350
    },
    addToCartText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3
    }
})
