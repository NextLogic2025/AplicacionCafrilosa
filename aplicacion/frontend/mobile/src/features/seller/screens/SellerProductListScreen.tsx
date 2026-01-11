import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { SearchBar } from '../../../components/ui/SearchBar'
import { PriceListPicker } from '../../../components/ui/PriceListPicker'
import { SellerProductCard } from '../../../components/ui/SellerProductCard'
import { EmptyState } from '../../../components/ui/EmptyState'
import { CatalogService, type Product, type Category } from '../../../services/api/CatalogService'
import { PriceService, type PriceList } from '../../../services/api/PriceService'
import { useCart } from '../../../context/CartContext'

/**
 * SellerProductListScreen - Catálogo de Productos para Vendedor
 *
 * Pantalla de catálogo de productos para vendedores con grilla de 2 columnas
 *
 * Características:
 * - Búsqueda en tiempo real de productos
 * - Filtro por categorías desde backend
 * - Filtro por lista de precios (muestra solo productos con precio en lista seleccionada)
 * - Lista por defecto: General (id: 1)
 * - Solo promociones GLOBALES visibles para vendedor
 * - Paginación con pull-to-refresh
 * - Layout en grilla de 2 columnas
 * - Navegación a detalles del producto
 */
export function SellerProductListScreen() {
    const navigation = useNavigation()
    const { addToCart } = useCart()

    const [products, setProducts] = useState<Product[]>([])
    const [selectedListId, setSelectedListId] = useState<number>(1) // Por defecto: General
    const [priceLists, setPriceLists] = useState<PriceList[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)

    useEffect(() => {
        loadCategories()
        loadPriceLists()
    }, [])

    useFocusEffect(
        useCallback(() => {
            loadProducts(true)
        }, [selectedCategory, searchQuery, selectedListId])
    )

    const loadCategories = async () => {
        try {
            const data = await CatalogService.getCategories()
            setCategories(data.filter(c => c.activo))
        } catch (error) {
            console.error('Error loading categories:', error)
        }
    }

    const loadPriceLists = async () => {
        try {
            const lists = await PriceService.getLists()
            setPriceLists(lists.filter(l => l.activa))
        } catch (error) {
            console.error('Error loading price lists:', error)
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
        ;(navigation as any).navigate('SellerProductDetail', {
            productId: product.id,
            selectedListId
        })
    }

    const handleCategoryPress = (categoryId: number | null) => {
        setSelectedCategory(categoryId)
        setPage(1)
    }

    const handlePriceListChange = (listId: number) => {
        setSelectedListId(listId)
        setPage(1)
    }

    // Agregar producto al carrito
    const handleAddToCart = (product: Product, listId: number) => {
        const selectedPrice = product.precios?.find(p => p.lista_id === listId)
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
            lista_precios_id: listId,
            tiene_promocion: hasPromotion,
            descuento_porcentaje: descuentoPorcentaje
        }, 1)

        Alert.alert(
            'Agregado al Carrito',
            `${product.nombre} se agregó al carrito`,
            [{ text: 'OK' }]
        )
    }

    // Filtrar productos para mostrar solo los que tienen precio en la lista seleccionada
    const filteredProducts = products.filter(product =>
        product.precios?.some(p => p.lista_id === selectedListId)
    )

    // Obtener el nombre de la lista seleccionada
    const selectedListName = priceLists.find(l => l.id === selectedListId)?.nombre

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <Header title="Productos" variant="standard" />

            {/* Barra de búsqueda + Selector de lista (50%-50%) */}
            <View style={styles.filterContainer}>
                <View style={styles.searchHalf}>
                    <SearchBar
                        placeholder="Buscar producto"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onClear={() => setSearchQuery('')}
                    />
                </View>
                <View style={styles.pickerHalf}>
                    <PriceListPicker
                        selectedListId={selectedListId}
                        onSelectList={handlePriceListChange}
                    />
                </View>
            </View>

            {/* Pills de Categorías */}
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
                    data={filteredProducts}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={{ paddingHorizontal: 20, justifyContent: 'space-between' }}
                    contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
                    renderItem={({ item }) => (
                        <View style={{ width: '48%' }}>
                            <SellerProductCard
                                product={item}
                                selectedListId={selectedListId}
                                selectedListName={selectedListName}
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
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 8
    },
    searchHalf: {
        flex: 1
    },
    pickerHalf: {
        flex: 1
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
