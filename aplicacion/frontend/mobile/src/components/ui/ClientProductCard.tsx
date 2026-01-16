import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
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
            style={styles.card}
            onPress={() => onPress(product)}
            activeOpacity={0.8}
        >
            {hasPromotion && (
                <View style={styles.promotionBadge}>
                    <Ionicons name="pricetag" size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
                    <Text style={styles.promotionText}>PROMOCIÓN</Text>
                </View>
            )}

            {product.activo && (
                <View style={styles.stockBadge}>
                    <View style={styles.stockDot} />
                </View>
            )}

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

            <View style={styles.infoContainer}>
                <Text style={styles.productName} numberOfLines={2} ellipsizeMode="tail">
                    {product.nombre}
                </Text>

                <View style={styles.priceContainer}>
                    {hasPromotion ? (
                        <>
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
                            <View style={styles.afterPriceContainer}>
                                <Text style={styles.afterPrice}>
                                    ${product.precio_oferta?.toFixed(2)}
                                </Text>
                                <Ionicons name="flash" size={16} color="#10B981" style={{ marginLeft: 4 }} />
                            </View>
                        </>
                    ) : (
                        <View style={styles.regularPriceContainer}>
                            <Text style={styles.regularPrice}>
                                ${product.precio_original?.toFixed(2) || '0.00'}
                            </Text>
                        </View>
                    )}
                </View>

                {product.unidad_medida && (
                    <View style={styles.unitContainer}>
                        <Ionicons name="cube-outline" size={12} color="#9CA3AF" />
                        <Text style={styles.unitText}>
                            {`Por ${product.unidad_medida.toLowerCase()}`}
                        </Text>
                    </View>
                )}

                {onAddToCart && (
                    <TouchableOpacity
                        style={styles.addToCartButton}
                        onPress={(e) => {
                            e.stopPropagation()
                            onAddToCart(product)
                        }}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="cart" size={16} color="#FFFFFF" />
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
        borderColor: '#F3F4F6',
        height: 350
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
    priceContainer: {
        marginBottom: 'auto'
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
        color: '#10B981'
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
    unitContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
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
        borderRadius: 12,
        marginTop: 12,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4
    },
    addToCartText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 6,
        letterSpacing: 0.3
    }
})
