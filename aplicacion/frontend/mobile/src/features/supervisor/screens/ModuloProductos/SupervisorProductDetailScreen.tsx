/**
 * SupervisorProductDetailScreen - Pantalla de detalle de producto
 * Muestra información completa del producto, precios por lista y promociones aplicables
 * Permite al supervisor editar el producto mediante un FAB
 */
import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image, RefreshControl, LayoutAnimation, Platform, UIManager } from 'react-native'
import { useRoute, useNavigation, useIsFocused } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { CatalogService, Product } from '../../../../services/api/CatalogService'
import { PriceService, PriceList } from '../../../../services/api/PriceService'
import { PromotionService, PromotionCampaign } from '../../../../services/api/PromotionService'
import { handleApiError } from '../../../../utils/errorHandlers'

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true)
}

export function SupervisorProductDetailScreen() {
    const route = useRoute()
    const navigation = useNavigation()
    const isFocused = useIsFocused()
    const { productId } = route.params as { productId: string }

    // Estados principales
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [product, setProduct] = useState<Product | null>(null)
    const [priceLists, setPriceLists] = useState<PriceList[]>([])
    const [activeCampaigns, setActiveCampaigns] = useState<PromotionCampaign[]>([])
    
    // Estado para controlar tarjetas expandidas de promociones
    const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({})

    const [feedbackModal, setFeedbackModal] = useState<{
        visible: boolean
        type: FeedbackType
        title: string
        message: string
    }>({
        visible: false,
        type: 'info',
        title: '',
        message: ''
    })

    /**
     * Toggle para expandir/colapsar tarjetas de precio con animación
     */
    const toggleCardExpanded = (listId: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        setExpandedCards(prev => ({
            ...prev,
            [listId]: !prev[listId]
        }))
    }

    // Auto-refresh cuando la pantalla recibe foco
    useEffect(() => {
        if (isFocused && productId) {
            loadProductDetails()
        }
    }, [isFocused, productId])

    /**
     * Carga los detalles del producto, listas de precios y campañas activas
     */
    const loadProductDetails = async (isRefresh: boolean = false) => {
        if (isRefresh) {
            setRefreshing(true)
        } else {
            setLoading(true)
        }
        try {
            const [foundProduct, priceListsData, campaignsData] = await Promise.all([
                CatalogService.getProductById(productId),
                PriceService.getLists(),
                PromotionService.getCampaigns()
            ])
            
            if (!foundProduct) {
                setFeedbackModal({ visible: true, type: 'error', title: 'Producto no encontrado', message: 'No se pudo encontrar el producto solicitado' })
                return
            }
            setProduct(foundProduct)
            setPriceLists(priceListsData)
            
            // Filtrar campañas activas y vigentes que apliquen a este producto
            const now = new Date()
            const activeCampaignsForProduct: PromotionCampaign[] = []
            
            for (const campaign of campaignsData) {
                const startDate = new Date(campaign.fecha_inicio)
                const endDate = new Date(campaign.fecha_fin)
                if (campaign.activo && now >= startDate && now <= endDate) {
                    try {
                        const campaignProducts = await PromotionService.getProducts(campaign.id)
                        const isInCampaign = campaignProducts.some(cp => cp.producto_id === productId)
                        if (isInCampaign) {
                            activeCampaignsForProduct.push(campaign)
                        }
                    } catch (err: any) {
                        if (err?.message !== 'SESSION_EXPIRED') {
                            console.error('Error loading campaign products:', err)
                        }
                    }
                }
            }
            setActiveCampaigns(activeCampaignsForProduct)
        } catch (error: any) {
            const errorInfo = handleApiError(error)
            console.error('Error loading product:', error)
            setFeedbackModal({ visible: true, type: errorInfo.type as FeedbackType, title: errorInfo.title, message: errorInfo.message })
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const onRefresh = useCallback(() => {
        loadProductDetails(true)
    }, [productId])

    /**
     * Formatea un precio en formato de moneda USD
     */
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)
    }

    /**
     * Calcula el precio con descuento aplicado según el tipo de promoción
     */
    const calculateDiscountedPrice = (basePrice: number, campaign: PromotionCampaign): number => {
        if (!campaign) return basePrice
        if (campaign.tipo_descuento === 'PORCENTAJE') {
            return basePrice * (1 - campaign.valor_descuento / 100)
        } else if (campaign.tipo_descuento === 'MONTO_FIJO') {
            return Math.max(0, basePrice - campaign.valor_descuento)
        }
        return basePrice
    }

    /**
     * Obtiene promociones aplicables para una lista de precios específica
     * Incluye promociones globales y promociones específicas para la lista
     */
    const getPromotionsForList = (listaId: number): PromotionCampaign[] => {
        return activeCampaigns.filter(campaign => {
            if (campaign.alcance === 'GLOBAL') return true
            if (campaign.alcance === 'POR_LISTA') {
                return campaign.lista_precios_objetivo_id === listaId
            }
            return false
        })
    }

    /**
     * Renderiza la tarjeta de precio para cada lista
     * Muestra precio base, promociones aplicables y mejor precio disponible
     */
    const renderPriceCard = (priceItem: { lista_id: number; precio: number }) => {
        const lista = priceLists.find(l => l.id === priceItem.lista_id)
        if (!lista) return null
        
        const basePrice = priceItem.precio
        const isExpanded = expandedCards[priceItem.lista_id] || false
        
        // Obtener promociones para esta lista
        const listPromotions = getPromotionsForList(lista.id)
        const hasPromotions = listPromotions.length > 0
        
        // Calcular mejor precio disponible
        const bestDeal = listPromotions.reduce<{ price: number; campaignId: number | null; discountType: string; discountValue: number }>(
            (best, campaign) => {
                const discounted = calculateDiscountedPrice(basePrice, campaign)
                if (discounted < best.price) {
                    return { 
                        price: discounted, 
                        campaignId: campaign.id,
                        discountType: campaign.tipo_descuento,
                        discountValue: campaign.valor_descuento
                    }
                }
                return best
            },
            { price: basePrice, campaignId: null, discountType: '', discountValue: 0 }
        )
        
        const bestPrice = bestDeal.price
        const bestCampaignId = bestDeal.campaignId

        return (
            <View key={priceItem.lista_id} className="mb-4 bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                {/* Header de la lista de precios */}
                <View className="flex-row items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-100">
                    <View style={{ backgroundColor: BRAND_COLORS.red }} className="px-3 py-1.5 rounded-lg">
                        <Text className="font-bold text-xs uppercase text-white">{lista.nombre}</Text>
                    </View>
                    {hasPromotions && (
                        <View style={{ backgroundColor: `${BRAND_COLORS.red}15` }} className="px-3 py-1.5 rounded-lg flex-row items-center">
                            <Ionicons name="pricetag" size={14} color={BRAND_COLORS.red} />
                            <Text style={{ color: BRAND_COLORS.red }} className="font-bold text-xs ml-1">
                                {listPromotions.length} PROMO{listPromotions.length > 1 ? 'S' : ''}
                            </Text>
                        </View>
                    )}
                </View>
                
                {/* Sección de precios */}
                <View className="px-4 py-4 border-b border-neutral-100">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 rounded-full bg-neutral-100 items-center justify-center mr-3">
                                <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
                            </View>
                            <View>
                                <Text className="text-neutral-500 text-xs">Precio Base</Text>
                                <Text className={`font-bold text-xl ${hasPromotions ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>
                                    {formatPrice(basePrice)}
                                </Text>
                            </View>
                        </View>
                        {hasPromotions && (
                            <View className="items-end">
                                <Text className="text-neutral-500 text-xs">Mejor precio:</Text>
                                <Text style={{ color: BRAND_COLORS.red }} className="font-bold text-xl">{formatPrice(bestPrice)}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Sección expandible de promociones */}
                {hasPromotions && (
                    <>
                        <TouchableOpacity 
                            onPress={() => toggleCardExpanded(priceItem.lista_id)}
                            style={{ backgroundColor: `${BRAND_COLORS.red}10` }}
                            className="flex-row items-center justify-between px-4 py-3"
                            activeOpacity={0.7}
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="gift-outline" size={18} color={BRAND_COLORS.red} />
                                <Text style={{ color: BRAND_COLORS.red }} className="font-semibold text-sm ml-2">
                                    Ver {listPromotions.length} promoción{listPromotions.length > 1 ? 'es' : ''} disponible{listPromotions.length > 1 ? 's' : ''}
                                </Text>
                            </View>
                            <Ionicons 
                                name={isExpanded ? "chevron-up" : "chevron-down"} 
                                size={20} 
                                color={BRAND_COLORS.red} 
                            />
                        </TouchableOpacity>

                        {/* Lista de promociones expandida */}
                        {isExpanded && (
                            <View className="px-4 py-3 bg-neutral-50">
                                {listPromotions.map((campaign, index) => {
                                    const discountedPrice = calculateDiscountedPrice(basePrice, campaign)
                                    const campaignSavings = basePrice - discountedPrice
                                    const isGlobal = campaign.alcance === 'GLOBAL'
                                    const isBestDeal = campaign.id === bestCampaignId

                                    return (
                                        <View 
                                            key={campaign.id} 
                                            className={`bg-white rounded-xl p-4 border ${isBestDeal ? 'border-2' : 'border-neutral-200'} ${index < listPromotions.length - 1 ? 'mb-3' : ''}`}
                                            style={isBestDeal ? { borderColor: BRAND_COLORS.red } : undefined}
                                        >
                                            {/* Header de la promoción */}
                                            <View className="flex-row items-start justify-between mb-3">
                                                <View className="flex-1 mr-2">
                                                    <View className="flex-row items-center mb-1">
                                                        <View style={{ backgroundColor: BRAND_COLORS.red }} className="w-6 h-6 rounded-full items-center justify-center mr-2">
                                                            <Ionicons name="star" size={12} color="white" />
                                                        </View>
                                                        <Text className="text-neutral-900 font-bold text-sm flex-1" numberOfLines={2}>
                                                            {campaign.nombre}
                                                        </Text>
                                                    </View>
                                                    {campaign.descripcion && (
                                                        <Text className="text-neutral-500 text-xs ml-8" numberOfLines={2}>
                                                            {campaign.descripcion}
                                                        </Text>
                                                    )}
                                                </View>
                                                <View className="flex-col items-end">
                                                    {/* Badge de alcance */}
                                                    <View className={`px-2 py-1 rounded ${isGlobal ? 'bg-neutral-100' : 'bg-neutral-100'}`}>
                                                        <Text className="text-[10px] font-bold text-neutral-600">
                                                            {isGlobal ? 'GLOBAL' : 'SOLO ESTA LISTA'}
                                                        </Text>
                                                    </View>
                                                    {/* Badge de mejor oferta */}
                                                    {isBestDeal && (
                                                        <View style={{ backgroundColor: BRAND_COLORS.red }} className="px-2 py-1 rounded mt-1">
                                                            <Text className="text-white text-[10px] font-bold">MEJOR OFERTA</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>

                                            {/* Detalle de precios */}
                                            <View className="bg-neutral-50 rounded-lg p-3">
                                                <View className="flex-row items-center justify-between">
                                                    <View>
                                                        <Text className="text-neutral-500 text-xs">Original:</Text>
                                                        <Text className="text-neutral-400 text-base line-through">{formatPrice(basePrice)}</Text>
                                                    </View>
                                                    <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
                                                    <View className="items-end">
                                                        <Text className="text-neutral-500 text-xs">Con descuento:</Text>
                                                        <Text style={{ color: BRAND_COLORS.red }} className="font-bold text-lg">{formatPrice(discountedPrice)}</Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* Info de ahorro y fechas */}
                                            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-neutral-100">
                                                <View className="flex-row items-center">
                                                    <Ionicons name="checkmark-circle" size={14} color={BRAND_COLORS.red} />
                                                    <Text style={{ color: BRAND_COLORS.red }} className="text-xs font-semibold ml-1">
                                                        Ahorras {formatPrice(campaignSavings)} ({campaign.tipo_descuento === 'PORCENTAJE' ? `${campaign.valor_descuento}%` : 'fijo'})
                                                    </Text>
                                                </View>
                                                <View className="flex-row items-center">
                                                    <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                                                    <Text className="text-neutral-400 text-[10px] ml-1">
                                                        Hasta {new Date(campaign.fecha_fin).toLocaleDateString('es-EC')}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    )
                                })}
                            </View>
                        )}
                    </>
                )}

                {/* Mensaje cuando no hay promociones */}
                {!hasPromotions && (
                    <View className="px-4 py-3 bg-neutral-50">
                        <View className="flex-row items-center">
                            <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" />
                            <Text className="text-neutral-400 text-xs ml-2">Sin promociones activas para esta lista</Text>
                        </View>
                    </View>
                )}
            </View>
        )
    }

    if (loading) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header title="Detalle de Producto" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                    <Text className="text-neutral-500 text-sm mt-3">Cargando producto...</Text>
                </View>
            </View>
        )
    }

    if (!product) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header title="Detalle de Producto" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 items-center justify-center px-6">
                    <View className="bg-neutral-100 w-20 h-20 rounded-full items-center justify-center mb-4">
                        <Ionicons name="alert-circle-outline" size={40} color="#9CA3AF" />
                    </View>
                    <Text className="text-neutral-900 font-bold text-lg text-center mb-2">Producto no encontrado</Text>
                    <Text className="text-neutral-500 text-sm text-center">El producto solicitado no existe o fue eliminado</Text>
                </View>
            </View>
        )
    }

    // Componente de fila de información
    const InfoRow = ({ icon, label, value, valueColor = 'text-neutral-900' }: { icon: keyof typeof Ionicons.glyphMap, label: string, value: string, valueColor?: string }) => (
        <View className="flex-row items-center py-3 border-b border-neutral-100">
            <View className="w-9 h-9 rounded-lg bg-neutral-100 items-center justify-center mr-3">
                <Ionicons name={icon} size={18} color="#6B7280" />
            </View>
            <View className="flex-1">
                <Text className="text-neutral-500 text-xs mb-0.5">{label}</Text>
                <Text className={`font-semibold text-sm ${valueColor}`}>{value || 'No especificado'}</Text>
            </View>
        </View>
    )

    // Componente de badge para características
    const FeatureBadge = ({ icon, label, active }: { icon: keyof typeof Ionicons.glyphMap, label: string, active: boolean }) => (
        <View 
            className="flex-row items-center px-3 py-2 rounded-xl mr-2 mb-2"
            style={active ? { backgroundColor: BRAND_COLORS.red } : { backgroundColor: '#F3F4F6' }}
        >
            <Ionicons name={icon} size={16} color={active ? 'white' : '#9CA3AF'} />
            <Text className={`text-xs font-semibold ml-1.5 ${active ? 'text-white' : 'text-neutral-400'}`}>{label}</Text>
        </View>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Detalle de Producto" variant="standard" onBackPress={() => navigation.goBack()} />
            <ScrollView 
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND_COLORS.red]} tintColor={BRAND_COLORS.red} />
                }
            >
                {/* Hero Section - Imagen y Estado */}
                <View className="bg-white border-b border-neutral-100">
                    <View className="items-center py-6 px-4">
                        {/* Imagen del producto */}
                        <View className="w-40 h-40 bg-neutral-100 rounded-2xl items-center justify-center mb-4 shadow-sm overflow-hidden">
                            {product.imagen_url ? (
                                <Image 
                                    source={{ uri: product.imagen_url }} 
                                    style={{ width: 160, height: 160 }} 
                                    resizeMode="cover"
                                />
                            ) : (
                                <View className="items-center">
                                    <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                                    <Text className="text-neutral-400 text-xs mt-2">Sin imagen</Text>
                                </View>
                            )}
                        </View>
                        
                        {/* Badge de estado */}
                        <View className={`px-4 py-1.5 rounded-full ${product.activo ? 'bg-green-100' : 'bg-red-100'}`}>
                            <View className="flex-row items-center">
                                <View className={`w-2 h-2 rounded-full mr-2 ${product.activo ? 'bg-green-500' : 'bg-red-500'}`} />
                                <Text className={`text-xs font-bold uppercase ${product.activo ? 'text-green-700' : 'text-red-700'}`}>
                                    {product.activo ? 'Producto Activo' : 'Producto Inactivo'}
                                </Text>
                            </View>
                        </View>

                        {/* Nombre del producto */}
                        <Text className="font-bold text-neutral-900 text-xl text-center mt-4 px-4">{product.nombre}</Text>
                        
                        {/* SKU */}
                        <View className="flex-row items-center mt-2 bg-neutral-100 px-3 py-1.5 rounded-lg">
                            <Ionicons name="barcode-outline" size={16} color="#6B7280" />
                            <Text className="text-neutral-600 text-sm font-medium ml-2">SKU: {product.codigo_sku}</Text>
                        </View>

                        {/* Categoría */}
                        <View className="flex-row items-center mt-3">
                            <Ionicons name="folder-outline" size={16} color={BRAND_COLORS.red} />
                            <Text style={{ color: BRAND_COLORS.red }} className="text-sm font-semibold ml-1.5">
                                {product.categoria?.nombre || 'Sin categoría'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Sección: Descripción del Producto */}
                <View className="px-4 pt-5">
                    <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
                        <View className="flex-row items-center px-4 py-3 bg-neutral-50 border-b border-neutral-100">
                            <Ionicons name="document-text-outline" size={20} color={BRAND_COLORS.red} />
                            <Text className="font-bold text-neutral-900 text-base ml-2">Descripción</Text>
                        </View>
                        <View className="p-4">
                            {product.descripcion ? (
                                <Text className="text-neutral-700 text-sm leading-5">{product.descripcion}</Text>
                            ) : (
                                <View className="flex-row items-center">
                                    <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" />
                                    <Text className="text-neutral-400 text-sm italic ml-2">Sin descripción disponible</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Sección: Especificaciones Técnicas */}
                <View className="px-4 pt-5">
                    <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
                        <View className="flex-row items-center px-4 py-3 bg-neutral-50 border-b border-neutral-100">
                            <Ionicons name="settings-outline" size={20} color={BRAND_COLORS.red} />
                            <Text className="font-bold text-neutral-900 text-base ml-2">Especificaciones</Text>
                        </View>
                        <View className="p-4">
                            <InfoRow 
                                icon="scale-outline" 
                                label="Peso Unitario" 
                                value={product.peso_unitario_kg ? `${product.peso_unitario_kg} kg` : 'No especificado'}
                            />
                            <InfoRow 
                                icon="cube-outline" 
                                label="Volumen" 
                                value={product.volumen_m3 ? `${product.volumen_m3} m³` : 'No especificado'}
                            />
                            <InfoRow 
                                icon="resize-outline" 
                                label="Unidad de Medida" 
                                value={product.unidad_medida || 'No especificado'}
                            />
                            
                            {/* Características especiales */}
                            <View className="pt-4 mt-2">
                                <Text className="text-neutral-500 text-xs mb-3 font-medium">CARACTERÍSTICAS ESPECIALES</Text>
                                <View className="flex-row flex-wrap">
                                    <FeatureBadge 
                                        icon="snow-outline" 
                                        label="Requiere Frío" 
                                        active={product.requiere_frio || false}
                                    />
                                    <FeatureBadge 
                                        icon="checkmark-circle-outline" 
                                        label="Disponible" 
                                        active={product.activo}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Sección: Resumen de Promociones Activas */}
                {activeCampaigns.length > 0 && (
                    <View className="px-4 pt-5">
                        <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
                            {/* Header con contador de promociones */}
                            <View 
                                style={{ backgroundColor: `${BRAND_COLORS.red}10` }} 
                                className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-100"
                            >
                                <View className="flex-row items-center">
                                    <View style={{ backgroundColor: BRAND_COLORS.red }} className="w-8 h-8 rounded-full items-center justify-center mr-3">
                                        <Ionicons name="gift" size={16} color="white" />
                                    </View>
                                    <View>
                                        <Text style={{ color: BRAND_COLORS.red700 }} className="font-bold text-base">Promociones Disponibles</Text>
                                        <Text style={{ color: BRAND_COLORS.red }} className="text-xs">
                                            {activeCampaigns.length} promoción{activeCampaigns.length > 1 ? 'es' : ''} activa{activeCampaigns.length > 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ backgroundColor: BRAND_COLORS.red }} className="px-3 py-1.5 rounded-lg">
                                    <Text className="text-white font-bold text-xs">{activeCampaigns.length}</Text>
                                </View>
                            </View>
                            
                            <View className="p-4">
                                {/* Separar promociones por tipo de alcance */}
                                {(() => {
                                    const globalCampaigns = activeCampaigns.filter(c => c.alcance === 'GLOBAL')
                                    const listCampaigns = activeCampaigns.filter(c => c.alcance === 'POR_LISTA')
                                    
                                    return (
                                        <View>
                                            {/* Promociones Globales */}
                                            {globalCampaigns.length > 0 && (
                                                <View className="mb-3">
                                                    <View className="flex-row items-center mb-2">
                                                        <View className="w-5 h-5 rounded-full bg-neutral-100 items-center justify-center mr-2">
                                                            <Ionicons name="globe-outline" size={12} color="#6B7280" />
                                                        </View>
                                                        <Text className="text-neutral-600 font-semibold text-xs">PROMOCIONES GLOBALES ({globalCampaigns.length})</Text>
                                                    </View>
                                                    {globalCampaigns.map(campaign => (
                                                        <View key={campaign.id} style={{ backgroundColor: `${BRAND_COLORS.red}08` }} className="flex-row items-center py-2 px-3 rounded-lg mb-1">
                                                            <Ionicons name="checkmark-circle" size={14} color={BRAND_COLORS.red} />
                                                            <Text className="text-neutral-700 text-sm ml-2 flex-1">{campaign.nombre}</Text>
                                                            <View style={{ backgroundColor: BRAND_COLORS.red }} className="px-2 py-0.5 rounded">
                                                                <Text className="text-white text-[10px] font-bold">
                                                                    {campaign.tipo_descuento === 'PORCENTAJE' ? `${campaign.valor_descuento}%` : formatPrice(campaign.valor_descuento)}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                            
                                            {/* Promociones por Lista */}
                                            {listCampaigns.length > 0 && (
                                                <View>
                                                    <View className="flex-row items-center mb-2">
                                                        <View className="w-5 h-5 rounded-full bg-neutral-100 items-center justify-center mr-2">
                                                            <Ionicons name="list-outline" size={12} color="#6B7280" />
                                                        </View>
                                                        <Text className="text-neutral-600 font-semibold text-xs">PROMOCIONES POR LISTA ({listCampaigns.length})</Text>
                                                    </View>
                                                    {listCampaigns.map(campaign => {
                                                        const targetList = priceLists.find(l => l.id === campaign.lista_precios_objetivo_id)
                                                        return (
                                                            <View key={campaign.id} className="flex-row items-center py-2 px-3 bg-neutral-50 rounded-lg mb-1">
                                                                <Ionicons name="checkmark-circle" size={14} color={BRAND_COLORS.red} />
                                                                <View className="flex-1 ml-2">
                                                                    <Text className="text-neutral-700 text-sm">{campaign.nombre}</Text>
                                                                    <Text className="text-neutral-500 text-[10px]">Aplica solo a: {targetList?.nombre || 'Lista no encontrada'}</Text>
                                                                </View>
                                                                <View style={{ backgroundColor: BRAND_COLORS.red }} className="px-2 py-0.5 rounded">
                                                                    <Text className="text-white text-[10px] font-bold">
                                                                        {campaign.tipo_descuento === 'PORCENTAJE' ? `${campaign.valor_descuento}%` : formatPrice(campaign.valor_descuento)}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        )
                                                    })}
                                                </View>
                                            )}
                                        </View>
                                    )
                                })()}
                                
                                {/* Nota informativa */}
                                <View className="mt-3 pt-3 border-t border-neutral-100">
                                    <View className="flex-row items-start">
                                        <Ionicons name="information-circle-outline" size={14} color="#9CA3AF" />
                                        <Text className="text-neutral-400 text-[11px] ml-1.5 flex-1">
                                            Las promociones globales aplican a todas las listas. Las promociones por lista solo aplican a la lista indicada.
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Sección: Precios por Lista */}
                <View className="px-4 pt-5">
                    <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
                        <View className="flex-row items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-100">
                            <View className="flex-row items-center">
                                <Ionicons name="pricetags-outline" size={20} color={BRAND_COLORS.red} />
                                <Text className="font-bold text-neutral-900 text-base ml-2">Precios por Lista</Text>
                            </View>
                            {product.precios && product.precios.length > 0 && (
                                <View style={{ backgroundColor: `${BRAND_COLORS.red}15` }} className="px-2 py-1 rounded-lg">
                                    <Text style={{ color: BRAND_COLORS.red }} className="text-xs font-bold">{product.precios.length} lista(s)</Text>
                                </View>
                            )}
                        </View>
                        <View className="p-4">
                            {product.precios && product.precios.length > 0 ? (
                                product.precios.map(renderPriceCard)
                            ) : (
                                <View className="items-center py-6">
                                    <View className="w-16 h-16 bg-neutral-100 rounded-full items-center justify-center mb-3">
                                        <Ionicons name="pricetag-outline" size={28} color="#9CA3AF" />
                                    </View>
                                    <Text className="text-neutral-500 text-sm font-medium">Sin precios asignados</Text>
                                    <Text className="text-neutral-400 text-xs mt-1">Este producto no tiene precios configurados</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Sección: Información del Supervisor */}
                <View className="px-4 pt-5">
                    <View 
                        style={{ backgroundColor: `${BRAND_COLORS.red}08`, borderColor: `${BRAND_COLORS.red}20` }} 
                        className="rounded-2xl p-4 border"
                    >
                        <View className="flex-row items-start">
                            <Ionicons name="information-circle" size={20} color={BRAND_COLORS.red} />
                            <View className="flex-1 ml-3">
                                <Text style={{ color: BRAND_COLORS.red700 }} className="font-semibold text-sm mb-1">Información del Supervisor</Text>
                                <Text className="text-neutral-600 text-xs leading-5">
                                    Como supervisor, puedes editar este producto tocando el botón de edición. Los cambios se reflejarán en todas las listas de precios y afectarán a los vendedores asignados.
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* FAB: Botón de Edición */}
            <TouchableOpacity 
                onPress={() => (navigation as any).navigate('SupervisorProductForm', { product: product })} 
                className="absolute right-5 bottom-6 shadow-xl"
                style={{ 
                    backgroundColor: BRAND_COLORS.red,
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    alignItems: 'center',
                    justifyContent: 'center',
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8
                }}
            >
                <Ionicons name="create-outline" size={26} color="white" />
            </TouchableOpacity>
            
            <FeedbackModal visible={feedbackModal.visible} type={feedbackModal.type} title={feedbackModal.title} message={feedbackModal.message} onClose={() => setFeedbackModal(prev => ({ ...prev, visible: false }))} />
        </View>
    )
}
