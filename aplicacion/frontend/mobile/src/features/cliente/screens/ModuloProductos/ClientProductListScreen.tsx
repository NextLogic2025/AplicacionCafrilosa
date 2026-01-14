import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { SearchBar } from '../../../../components/ui/SearchBar'
import { ClientProductCard } from '../../../../components/ui/ClientProductCard'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { CatalogService, type Product, type Category } from '../../../../services/api/CatalogService'
import { useCart } from '../../../../context/CartContext'
import { useToast } from '../../../../context/ToastContext'


export function ClientProductListScreen() {
    const navigation = useNavigation()
    const { addToCart } = useCart()
    const { showToast } = useToast()

    // # Estado local del componente
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [showOnlyPromotions, setShowOnlyPromotions] = useState(false)

    // # Cargar categorías al montar
    useEffect(() => {
        loadCategories()
    }, [])

    // # Efecto: Recargar productos cuando filtrado cambia
    useFocusEffect(
        useCallback(() => {
            loadProducts(true)
        }, [selectedCategory, searchQuery])
    )

    // # Función para obtener categorías del backend
    const loadCategories = async () => {
        try {
            const data = await CatalogService.getCategories()
            setCategories(data.filter(c => c.activo))
        } catch (error) {
            console.error('Error loading categories:', error)
        }
    }

    // # Función principal de carga de productos (con paginación)
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
            // Determinar si filtrar por categoría o traer todo
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

            // Actualizar lista de productos
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

    // # Manejador de Pull-to-Refresh
    const handleRefresh = () => {
        setRefreshing(true)
        loadProducts(true)
    }

    // # Cargar más productos al llegar al final (Infinite Scroll)
    const handleLoadMore = () => {
        if (!loading && hasMore) {
            loadProducts(false)
        }
    }

    // # Navegar al detalle del producto
    const handleProductPress = (product: Product) => {
        // @ts-ignore - navigation typing
        navigation.navigate('ClientProductDetail', { productId: product.id })
    }

    // # Seleccionar categoría
    const handleCategoryPress = (categoryId: number | null) => {
        setSelectedCategory(categoryId)
        setPage(1)
    }

    // # Agregar producto al carrito directamente
    const handleAddToCart = (product: Product) => {
        // Calcular precio final considerando ofertas
        const precioFinal = product.precio_oferta && product.precio_oferta < (product.precio_original ?? 0)
            ? product.precio_oferta
            : product.precio_original ?? 0

        const precioLista = product.precio_original ?? 0
        const hasPromotion = !!(product.precio_oferta && product.precio_original && product.precio_oferta < product.precio_original)
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
            descuento_porcentaje: descuentoPorcentaje,
            campania_aplicada_id: (product as any).campania_aplicada_id,
            motivo_descuento: hasPromotion ? 'Promoción Aplicada' : undefined
        }, 1)

        showToast(`✓ ${product.nombre} agregado al carrito`, 'success')
    }

    // # Filtrado local para mostrar solo productos con promoción
    const displayedProducts = showOnlyPromotions
        ? products.filter(product =>
            product.precio_oferta &&
            product.precio_original &&
            product.precio_oferta < product.precio_original
        )
        : products

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Productos" variant="standard" />

            {/* Barra de búsqueda + Filtro de Promociones */}
            <View className="bg-white px-5 pt-3 pb-4 border-b border-neutral-100 flex-row items-center gap-3">
                <View className="flex-1">
                    <SearchBar
                        placeholder="Busca el nombre del producto"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onClear={() => setSearchQuery('')}
                    />
                </View>
                <View className="w-[140px]">
                    <TouchableOpacity
                        className={`h-[52px] rounded-xl border-[1.5px] flex-row items-center justify-center px-3 shadow-sm ${showOnlyPromotions
                            ? 'bg-brand-red border-brand-red'
                            : 'bg-white border-brand-red'
                            }`}
                        onPress={() => setShowOnlyPromotions(!showOnlyPromotions)}
                        activeOpacity={0.8}
                    >
                        <View className={`w-6 h-6 rounded-full justify-center items-center mr-1.5 ${showOnlyPromotions ? 'bg-white/25' : 'bg-red-50'
                            }`}>
                            <Ionicons
                                name="pricetag"
                                size={16}
                                color={showOnlyPromotions ? '#FFFFFF' : '#DC2626'}
                            />
                        </View>
                        <Text className={`text-[13px] font-bold ${showOnlyPromotions ? 'text-white' : 'text-brand-red'
                            }`}>
                            Promociones
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Pills de Categorías */}
            {categories.length > 0 && (
                <View className="bg-white py-3 border-b border-neutral-100">
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
                                    className={`px-4 py-2 rounded-full mr-2 ${isSelected ? 'bg-brand-red' : 'bg-neutral-100'
                                        }`}
                                    onPress={() => handleCategoryPress(item.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-neutral-500'
                                        }`}>
                                        {item.nombre}
                                    </Text>
                                </TouchableOpacity>
                            )
                        }}
                    />
                </View>
            )}

            {/* Grid de Productos */}
            {loading && page === 1 ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#DC2626" />
                    <Text className="mt-3 text-neutral-400 text-sm">
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
                    renderItem={({ item }) => (
                        <View className="w-[48%]">
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
                            <View className="py-5">
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
