import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { SearchBar } from '../../../components/ui/SearchBar'
import { ClientProductCard } from '../../../components/ui/ClientProductCard'
import { EmptyState } from '../../../components/ui/EmptyState'
import { CatalogService, type Product, type Category } from '../../../services/api/CatalogService'
import { useCart } from '../../../context/CartContext'
import { useToast } from '../../../context/ToastContext'

/**
 * ClientProductListScreen
 *
 * Beautiful catalog screen for clients with 2-column product grid
 * Features:
 * - Real-time product search
 * - Category filtering from backend
 * - Client-specific pricing (filtered by lista_precios_id)
 * - Promotion badges and before/after pricing
 * - Pagination with pull-to-refresh
 * - 2-column grid layout
 * - Navigation to product details
 */
export function ClientProductListScreen() {
    const navigation = useNavigation()
    const { addToCart } = useCart()
    const { showToast } = useToast()

    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [showOnlyPromotions, setShowOnlyPromotions] = useState(false)

    // Load categories on mount
    useEffect(() => {
        loadCategories()
    }, [])

    // Load products when category or search changes
    useFocusEffect(
        useCallback(() => {
            loadProducts(true)
        }, [selectedCategory, searchQuery])
    )

    const loadCategories = async () => {
        try {
            const data = await CatalogService.getCategories()
            setCategories(data.filter(c => c.activo))
        } catch (error) {
            console.error('Error loading categories:', error)
        }
    }

    const loadProducts = async (reset: boolean = false) => {
        if (loading) return

        try {
            const currentPage = reset ? 1 : page
            setLoading(true)
            if (reset) {
                setProducts([])
                setPage(1)
            }

            let response
            if (selectedCategory) {
                response = await CatalogService.getProductsByCategory(
                    selectedCategory,
                    currentPage,
                    20,
                    searchQuery || undefined
                )
            } else {
                response = await CatalogService.getProductsPaginated(
                    currentPage,
                    20,
                    searchQuery || undefined
                )
            }

            if (reset) {
                setProducts(response.items)
            } else {
                setProducts(prev => [...prev, ...response.items])
            }

            setHasMore(currentPage < response.metadata.total_pages)
            setPage(currentPage + 1)
        } catch (error) {
            console.error('Error loading products:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleRefresh = () => {
        setRefreshing(true)
        loadProducts(true)
    }

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            loadProducts(false)
        }
    }

    const handleProductPress = (product: Product) => {
        navigation.navigate('ClientProductDetail' as never, { productId: product.id } as never)
    }

    const handleCategoryPress = (categoryId: number | null) => {
        setSelectedCategory(categoryId)
        setPage(1)
    }

    const handleAddToCart = (product: Product) => {
        // Para clientes, usamos precio_oferta si existe, sino precio_original
        const precioFinal = product.precio_oferta && product.precio_oferta < (product.precio_original ?? 0)
            ? product.precio_oferta
            : product.precio_original ?? 0

        const precioLista = product.precio_original ?? 0

        // Verificar si tiene promoción
        const hasPromotion = !!(product.precio_oferta && product.precio_original && product.precio_oferta < product.precio_original)

        // Calcular porcentaje de descuento si hay promoción
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
        }, 1)

        // Mostrar Toast profesional con el componente genérico
        showToast(`✓ ${product.nombre} agregado al carrito`, 'success')
    }

    // Filtrar productos: si showOnlyPromotions está activo, mostrar solo productos con promoción
    const displayedProducts = showOnlyPromotions
        ? products.filter(product =>
            product.precio_oferta &&
            product.precio_original &&
            product.precio_oferta < product.precio_original
        )
        : products

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <Header title="Productos" variant="standard" />

            {/* Barra de búsqueda + Filtro de Promociones (50%-50%) */}
            <View style={styles.searchContainer}>
                <View style={styles.searchHalf}>
                    <SearchBar
                        placeholder="Busca el nombre del producto"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onClear={() => setSearchQuery('')}
                    />
                </View>
                <View style={styles.promoButtonHalf}>
                    <TouchableOpacity
                        style={[styles.promoButton, showOnlyPromotions && styles.promoButtonActive]}
                        onPress={() => setShowOnlyPromotions(!showOnlyPromotions)}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.iconCircle, showOnlyPromotions && styles.iconCircleActive]}>
                            <Ionicons
                                name="pricetag"
                                size={16}
                                color={showOnlyPromotions ? '#FFFFFF' : '#DC2626'}
                            />
                        </View>
                        <Text style={[styles.promoButtonText, showOnlyPromotions && styles.promoButtonTextActive]}>
                            Promociones
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Category Pills */}
            {categories.length > 0 && (
                <View style={styles.categoriesContainer}>
                    <FlatList
                        data={[{ id: null, nombre: 'Todos' } as any, ...categories]}
                        keyExtractor={(item) => String(item.id ?? 'all')}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 20 }}
                        renderItem={({ item }) => {
                            const isSelected = selectedCategory === item.id
                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.categoryPill,
                                        isSelected && styles.categoryPillActive
                                    ]}
                                    onPress={() => handleCategoryPress(item.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.categoryText,
                                            isSelected && styles.categoryTextActive
                                        ]}
                                    >
                                        {item.nombre}
                                    </Text>
                                </TouchableOpacity>
                            )
                        }}
                    />
                </View>
            )}

            {/* Products Grid */}
            {loading && page === 1 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#DC2626" />
                    <Text style={{ marginTop: 12, color: '#9CA3AF', fontSize: 14 }}>
                        Cargando productos...
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={displayedProducts}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={{ paddingHorizontal: 20, justifyContent: 'space-between' }}
                    contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
                    renderItem={({ item, index }) => (
                        <View style={{ width: '48%' }}>
                            <ClientProductCard
                                product={item}
                                onPress={handleProductPress}
                                onAddToCart={handleAddToCart}
                            />
                        </View>
                    )}
                    ListEmptyComponent={
                        <EmptyState
                            icon="search-outline"
                            title={searchQuery ? 'No se encontraron productos' : 'Catálogo vacío'}
                            description={
                                searchQuery
                                    ? 'Intenta con otros términos de búsqueda'
                                    : 'No hay productos disponibles'
                            }
                            actionLabel={searchQuery ? 'Limpiar búsqueda' : 'Actualizar'}
                            onAction={searchQuery ? () => setSearchQuery('') : handleRefresh}
                            style={{ marginTop: 40 }}
                        />
                    }
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        loading && page > 1 ? (
                            <View style={{ paddingVertical: 20 }}>
                                <ActivityIndicator size="small" color="#DC2626" />
                            </View>
                        ) : null
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    searchContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    searchHalf: {
        flex: 1
    },
    promoButtonHalf: {
        width: 140
    },
    promoButton: {
        height: 52,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#DC2626',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    promoButtonActive: {
        backgroundColor: '#DC2626',
        borderColor: '#DC2626'
    },
    iconCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6
    },
    iconCircleActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)'
    },
    promoButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#DC2626'
    },
    promoButtonTextActive: {
        color: '#FFFFFF'
    },
    categoriesContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    categoryPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 8
    },
    categoryPillActive: {
        backgroundColor: '#DC2626'
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280'
    },
    categoryTextActive: {
        color: '#FFFFFF'
    }
})
