/**
 * SupervisorCatalogScreen - Pantalla principal del catálogo de productos
 * Permite al supervisor ver, buscar y filtrar todos los productos del sistema
 * Muestra badges con el conteo total de promociones activas por producto
 */
import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useNavigation, useIsFocused } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { GenericList } from '../../../../components/ui/GenericList'
import { ExpandableFab } from '../../../../components/ui/ExpandableFab'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { SearchBar } from '../../../../components/ui/SearchBar'
import { CategoryFilter } from '../../../../components/ui/CategoryFilter'
import { CatalogService, Product, Category } from '../../../../services/api/CatalogService'
import { PriceService, PriceList } from '../../../../services/api/PriceService'
import { PromotionService, PromotionCampaign } from '../../../../services/api/PromotionService'

export function SupervisorCatalogScreen() {
    const navigation = useNavigation()
    const isFocused = useIsFocused()

    // Estados de búsqueda y filtrado
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | string>('all')

    // Estados de datos
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [priceLists, setPriceLists] = useState<PriceList[]>([])
    const [activeCampaigns, setActiveCampaigns] = useState<PromotionCampaign[]>([])
    const [loading, setLoading] = useState(false)

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

    /**
     * Carga todos los datos necesarios para el catálogo:
     * - Productos, categorías, listas de precios y campañas de promoción
     */
    const fetchData = async () => {
        setLoading(true)
        try {
            const [productsData, categoriesData, priceListsData, campaignsData] = await Promise.all([
                CatalogService.getProducts(),
                CatalogService.getCategories(),
                PriceService.getLists(),
                PromotionService.getCampaigns()
            ])
            setProducts(productsData)
            setCategories(categoriesData)
            setPriceLists(priceListsData)
            // Filtrar solo campañas activas vigentes
            const now = new Date()
            const active = campaignsData.filter(c => {
                const start = new Date(c.fecha_inicio)
                const end = new Date(c.fecha_fin)
                return c.activo && now >= start && now <= end
            })
            setActiveCampaigns(active)
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

    // Filtrado de productos por búsqueda y categoría
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.codigo_sku.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategoryId === 'all' || p.categoria_id === selectedCategoryId
        return matchesSearch && matchesCategory
    })

    // Mapeo de categorías para el filtro
    const filterCategories = [
        { id: 'all', name: 'Todas' },
        ...categories.map(c => ({ id: c.id, name: c.nombre }))
    ]

    /**
     * Calcula el total de promociones aplicables a un producto
     * Prioriza los datos del backend, si no existen calcula desde campañas activas
     */
    const getTotalPromotionsForProduct = (item: Product): number => {
        // Si el backend ya envía las promociones del producto, usar ese conteo
        if (item.promociones && item.promociones.length > 0) {
            return item.promociones.length
        }
        
        // Fallback: calcular desde campañas activas cargadas
        const productListIds = item.precios?.map(p => p.lista_id) || []
        let count = 0
        
        activeCampaigns.forEach(campaign => {
            // Promociones GLOBALES aplican a todos los productos
            if (campaign.alcance === 'GLOBAL') {
                count++
            }
            // Promociones POR_LISTA aplican solo si el producto tiene precio en esa lista
            else if (campaign.alcance === 'POR_LISTA' && campaign.lista_precios_objetivo_id) {
                if (productListIds.includes(campaign.lista_precios_objetivo_id)) {
                    count++
                }
            }
        })
        
        return count
    }

    /**
     * Renderiza cada tarjeta de producto en la lista
     * Muestra: imagen, nombre, SKU, estado, listas de precio y promociones
     */
    const renderProductItem = (item: Product) => {
        const hasPromotion = item.precio_oferta != null && item.precio_oferta < (item.precio_original || Infinity)
        const totalPromos = getTotalPromotionsForProduct(item)
        
        return (
            <TouchableOpacity 
                className="bg-white p-4 mb-3 rounded-2xl shadow-sm border border-neutral-100" 
                activeOpacity={0.7} 
                onPress={() => (navigation as any).navigate('SupervisorProductDetail', { productId: item.id })}
            >
                <View className="flex-row">
                    {/* Imagen del producto con badge de promociones */}
                    <View className="w-16 h-16 bg-neutral-100 rounded-xl items-center justify-center mr-4">
                        {item.imagen_url ? (
                            <Ionicons name="image" size={24} color={BRAND_COLORS.red} />
                        ) : (
                            <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                        )}
                        {/* Badge de promociones totales */}
                        {totalPromos > 0 && (
                            <View 
                                style={{ 
                                    position: 'absolute', 
                                    top: -6, 
                                    right: -6,
                                    backgroundColor: BRAND_COLORS.red 
                                }} 
                                className="rounded-full w-6 h-6 items-center justify-center border-2 border-white"
                            >
                                <Text className="text-white text-[10px] font-bold">{totalPromos}</Text>
                            </View>
                        )}
                    </View>
                    
                    {/* Información del producto */}
                    <View className="flex-1 justify-center">
                        {/* Nombre y estado */}
                        <View className="flex-row justify-between items-start mb-1">
                            <Text className="font-bold text-neutral-900 text-base flex-1 mr-2">{item.nombre}</Text>
                            <View className={`px-2 py-0.5 rounded-md ${item.activo ? 'bg-green-100' : 'bg-neutral-100'}`}>
                                <Text className={`text-[10px] font-bold uppercase ${item.activo ? 'text-green-700' : 'text-neutral-500'}`}>
                                    {item.activo ? 'Activo' : 'Inactivo'}
                                </Text>
                            </View>
                        </View>
                        
                        {/* SKU */}
                        <Text className="text-neutral-500 text-xs mb-2">SKU: {item.codigo_sku}</Text>
                        
                        {/* Listas de precio y badge de promociones */}
                        <View className="flex-row items-center justify-between mt-1">
                            {item.precios && item.precios.length > 0 ? (
                                <View className="flex-row items-center flex-1">
                                    <Ionicons name="pricetags-outline" size={14} color="#9CA3AF" />
                                    <Text className="text-neutral-500 text-xs ml-1">
                                        {item.precios.length} lista{item.precios.length > 1 ? 's' : ''} de precio
                                    </Text>
                                </View>
                            ) : (
                                <Text className="text-neutral-400 text-xs italic">Sin precio asignado</Text>
                            )}
                            
                            {/* Badge de promociones con color de marca */}
                            {totalPromos > 0 && (
                                <View 
                                    style={{ backgroundColor: `${BRAND_COLORS.red}15` }} 
                                    className="px-2 py-1 rounded-md ml-2"
                                >
                                    <Text style={{ color: BRAND_COLORS.red }} className="text-[10px] font-bold">
                                        {totalPromos} PROMO{totalPromos > 1 ? 'S' : ''}
                                    </Text>
                                </View>
                            )}
                        </View>
                        
                        {/* Precios con descuento */}
                        {hasPromotion && item.precio_oferta && (
                            <View className="flex-row items-center mt-1">
                                <Text className="text-neutral-400 text-xs line-through mr-2">
                                    {new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(item.precio_original || 0)}
                                </Text>
                                <Text style={{ color: BRAND_COLORS.red }} className="font-bold text-sm">
                                    {new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(item.precio_oferta)}
                                </Text>
                            </View>
                        )}
                        
                        {/* Link a detalles */}
                        <View className="flex-row items-center mt-2 pt-2 border-t border-neutral-100">
                            <Text style={{ color: BRAND_COLORS.red }} className="text-xs font-semibold">Ver detalles completos</Text>
                            <Ionicons name="chevron-forward" size={14} color={BRAND_COLORS.red} style={{ marginLeft: 4 }} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50 relative">
            {/* Cabecera principal */}
            <Header title="Catálogo General" variant="standard" onBackPress={() => navigation.goBack()} />
            
            {/* Barra de búsqueda y filtros */}
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
                    {/* Botón agregar producto */}
                    <TouchableOpacity 
                        style={{ backgroundColor: BRAND_COLORS.red }}
                        className="w-12 h-12 rounded-xl items-center justify-center shadow-lg" 
                        onPress={() => (navigation as any).navigate('SupervisorProductForm')}
                    >
                        <Ionicons name="add" size={26} color="white" />
                    </TouchableOpacity>
                </View>
                {/* Filtro por categorías */}
                <CategoryFilter 
                    categories={filterCategories} 
                    selectedId={selectedCategoryId} 
                    onSelect={(id) => setSelectedCategoryId(id)} 
                />
            </View>
            
            {/* Lista de productos */}
            <View className="flex-1 px-5 mt-4">
                <GenericList 
                    items={filteredProducts} 
                    isLoading={loading} 
                    onRefresh={fetchData} 
                    renderItem={renderProductItem} 
                    emptyState={{ 
                        icon: 'cube-outline', 
                        title: 'Sin Productos', 
                        message: 'No hay productos que coincidan con los filtros.' 
                    }} 
                />
            </View>
            
            {/* FAB expandible para acciones rápidas */}
            <ExpandableFab 
                actions={[
                    { icon: 'pricetags', label: 'Listas de Precio', onPress: () => (navigation as any).navigate('SupervisorPriceLists') }, 
                    { icon: 'grid', label: 'Categorías', onPress: () => (navigation as any).navigate('SupervisorCategories') }
                ]} 
            />
        </View>
    )
}
