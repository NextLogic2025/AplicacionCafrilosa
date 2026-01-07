import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useNavigation, useIsFocused } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'
import { ExpandableFab } from '../../../components/ui/ExpandableFab'
import { FeedbackModal, FeedbackType } from '../../../components/ui/FeedbackModal'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { SearchBar } from '../../../components/ui/SearchBar'
import { CategoryFilter } from '../../../components/ui/CategoryFilter'
import { CatalogService, Product, Category } from '../../../services/api/CatalogService'
import { PriceService, PriceList } from '../../../services/api/PriceService'

export function SupervisorCatalogScreen() {
    const navigation = useNavigation()
    const isFocused = useIsFocused()

    // State
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | string>('all')

    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [priceLists, setPriceLists] = useState<PriceList[]>([])
    const [loading, setLoading] = useState(false)

    // Feedback Modal State
    const [feedbackModal, setFeedbackModal] = useState<{
        visible: boolean
        type: FeedbackType
        title: string
        message: string
    }>({
        visible: false,
        type: 'error',
        title: '',
        message: ''
    })

    const fetchData = async () => {
        setLoading(true)
        try {
            const [productsData, categoriesData, priceListsData] = await Promise.all([
                CatalogService.getProducts(),
                CatalogService.getCategories(),
                PriceService.getLists()
            ])
            setProducts(productsData)
            setCategories(categoriesData)
            setPriceLists(priceListsData)
        } catch (error) {
            console.error(error)
            setFeedbackModal({
                visible: true,
                type: 'error',
                title: 'Error al cargar',
                message: 'No se pudo cargar el catálogo. Intenta nuevamente'
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isFocused) {
            fetchData()
        }
    }, [isFocused])

    // Filter Logic
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.codigo_sku.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesCategory = selectedCategoryId === 'all' || p.categoria_id === selectedCategoryId

        return matchesSearch && matchesCategory
    })

    // Prepare categories for filter (add 'All' option)
    const filterCategories = [
        { id: 'all', name: 'Todas' },
        ...categories.map(c => ({ id: c.id, name: c.nombre }))
    ]

    const renderProductItem = (item: Product) => {
        const hasPromotion = item.precio_oferta != null && item.precio_oferta < (item.precio_original || Infinity)

        // Contar cuántas promociones activas tiene este producto
        const activePromosCount = item.promociones?.length || 0

        return (
            <TouchableOpacity
                className="bg-white p-4 mb-3 rounded-2xl shadow-sm border border-neutral-100"
                activeOpacity={0.7}
                onPress={() => (navigation as any).navigate('SupervisorProductDetail', { productId: item.id })}
            >
                <View className="flex-row">
                    {/* Image Placeholder */}
                    <View className="w-16 h-16 bg-neutral-100 rounded-xl items-center justify-center mr-4">
                        {item.imagen_url ? (
                            <Ionicons name="image" size={24} color="#2563EB" />
                        ) : (
                            <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                        )}
                        {/* Indicador de promoción en la imagen con contador */}
                        {activePromosCount > 0 && (
                            <View style={{ position: 'absolute', top: -4, right: -4 }} className="bg-red-500 rounded-full w-6 h-6 items-center justify-center border-2 border-white">
                                <Text className="text-white text-[10px] font-bold">{`${activePromosCount}`}</Text>
                            </View>
                        )}
                    </View>

                    {/* Info */}
                    <View className="flex-1 justify-center">
                        <View className="flex-row justify-between items-start mb-1">
                            <Text className="font-bold text-neutral-900 text-base flex-1 mr-2">{item.nombre}</Text>
                            <View className={`px-2 py-0.5 rounded-md ${item.activo ? 'bg-green-100' : 'bg-neutral-100'}`}>
                                <Text className={`text-[10px] font-bold uppercase ${item.activo ? 'text-green-700' : 'text-neutral-500'}`}>
                                    {item.activo ? 'Activo' : 'Inactivo'}
                                </Text>
                            </View>
                        </View>

                        <Text className="text-neutral-500 text-xs mb-2">SKU: {item.codigo_sku}</Text>

                        {/* Mostrar indicadores de precio y promociones */}
                        <View className="flex-row items-center justify-between mt-1">
                            {item.precios && item.precios.length > 0 ? (
                                <View className="flex-row items-center flex-1">
                                    <Ionicons name="pricetags-outline" size={14} color="#9CA3AF" />
                                    <Text className="text-neutral-500 text-xs ml-1">
                                        {`${item.precios.length} lista${item.precios.length > 1 ? 's' : ''} de precio`}
                                    </Text>
                                </View>
                            ) : (
                                <Text className="text-neutral-400 text-xs italic">Sin precio asignado</Text>
                            )}

                            {activePromosCount > 0 && (
                                <View className="bg-red-100 px-2 py-1 rounded-md ml-2">
                                    <Text className="text-red-600 text-[10px] font-bold">
                                        {`${activePromosCount} PROMO${activePromosCount > 1 ? 'S' : ''}`}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Mostrar precio mínimo si hay */}
                        {hasPromotion && item.precio_oferta && (
                            <View className="flex-row items-center mt-1">
                                <Text className="text-neutral-400 text-xs line-through mr-2">
                                    {new Intl.NumberFormat('es-CO', {
                                        style: 'currency',
                                        currency: 'COP',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(item.precio_original || 0)}
                                </Text>
                                <Text className="text-red-600 font-bold text-sm">
                                    {new Intl.NumberFormat('es-CO', {
                                        style: 'currency',
                                        currency: 'COP',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(item.precio_oferta)}
                                </Text>
                            </View>
                        )}

                        {/* Indicador de "Ver detalle" */}
                        <View className="flex-row items-center mt-2 pt-2 border-t border-neutral-100">
                            <Text className="text-blue-600 text-xs font-semibold">Ver detalles completos</Text>
                            <Ionicons name="chevron-forward" size={14} color="#2563EB" style={{ marginLeft: 4 }} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header
                title="Catálogo General"
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            <View className="bg-white shadow-sm z-10 pb-2">
                <View className="px-5 py-4 flex-row items-center">
                    <View className="flex-1 mr-3">
                        <SearchBar
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Buscar producto..."
                            onClear={() => setSearchQuery('')}
                        />
                    </View>
                    <TouchableOpacity
                        className="w-12 h-12 rounded-xl items-center justify-center shadow-sm"
                        style={{ backgroundColor: BRAND_COLORS.red }}
                        onPress={() => (navigation as any).navigate('SupervisorProductForm')}
                    >
                        <Ionicons name="add" size={30} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Categories Filter */}
                <CategoryFilter
                    categories={filterCategories}
                    selectedId={selectedCategoryId}
                    onSelect={setSelectedCategoryId}
                />
            </View>

            <GenericList
                items={filteredProducts}
                isLoading={loading}
                onRefresh={fetchData}
                renderItem={renderProductItem}
                emptyState={{
                    icon: 'cube-outline',
                    title: 'Sin Productos',
                    message: 'No se encontraron productos con ese criterio.'
                }}
            />
            {/* Main Management FAB */}
            <ExpandableFab
                actions={[
                    {
                        icon: 'grid-outline',
                        label: 'Categorías',
                        color: '#2563EB', // Blue
                        onPress: () => navigation.navigate('SupervisorCategories' as never),
                    },

                    {
                        icon: 'pricetags-outline',
                        label: 'Listas de Precios',
                        color: '#D97706', // Amber
                        onPress: () => navigation.navigate('SupervisorPriceLists' as never),
                    }
                ]}
            />

            <FeedbackModal
                visible={feedbackModal.visible}
                type={feedbackModal.type}
                title={feedbackModal.title}
                message={feedbackModal.message}
                onClose={() => setFeedbackModal({ ...feedbackModal, visible: false })}
            />
        </View>
    )
}
