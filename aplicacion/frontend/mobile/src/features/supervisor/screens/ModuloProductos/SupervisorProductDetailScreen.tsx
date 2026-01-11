import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { CatalogService, Product } from '../../../../services/api/CatalogService'
import { PriceService, PriceList } from '../../../../services/api/PriceService'
import { PromotionService } from '../../../../services/api/PromotionService'
import { handleApiError } from '../../../../utils/errorHandlers'

export function SupervisorProductDetailScreen() {
    const route = useRoute()
    const navigation = useNavigation()
    const { productId } = route.params as { productId: string }

    const [loading, setLoading] = useState(true)
    const [product, setProduct] = useState<Product | null>(null)
    const [priceLists, setPriceLists] = useState<PriceList[]>([])
    const [activeCampaigns, setActiveCampaigns] = useState<any[]>([])

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

    useEffect(() => {
        loadProductDetails()
    }, [productId])

    const loadProductDetails = async () => {
        setLoading(true)
        try {
            const [productData, priceListsData, campaignsData] = await Promise.all([
                CatalogService.getProducts(),
                PriceService.getLists(),
                PromotionService.getCampaigns()
            ])
            const foundProduct = productData.find(p => p.id === productId)
            if (!foundProduct) {
                setFeedbackModal({ visible: true, type: 'error', title: 'Producto no encontrado', message: 'No se pudo encontrar el producto solicitado' })
                return
            }
            setProduct(foundProduct)
            setPriceLists(priceListsData)
            const now = new Date()
            const activeCampaignsForProduct: any[] = []
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
        }
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)
    }

    const calculateDiscountedPrice = (basePrice: number, campaign: any): number => {
        if (!campaign) return basePrice
        if (campaign.tipo_descuento === 'PORCENTAJE') {
            return basePrice * (1 - campaign.valor_descuento / 100)
        } else if (campaign.tipo_descuento === 'MONTO_FIJO') {
            return Math.max(0, basePrice - campaign.valor_descuento)
        }
        return basePrice
    }

    const getListColor = (listName: string) => {
        if (listName === 'General') return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' }
        if (listName === 'Mayorista') return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' }
        return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' }
    }

    const renderPriceCard = (priceItem: { lista_id: number; precio: number }) => {
        const lista = priceLists.find(l => l.id === priceItem.lista_id)
        if (!lista) return null
        const basePrice = priceItem.precio
        const colors = getListColor(lista.nombre)
        const applicableCampaigns = activeCampaigns.filter(campaign => {
            if (campaign.alcance === 'GLOBAL') return true
            if (campaign.alcance === 'POR_LISTA' && campaign.lista_precios_objetivo_id === lista.id) return true
            if (campaign.alcance === 'POR_CLIENTE') return true
            return false
        })
        return (
            <View key={priceItem.lista_id} className="mb-4">
                <View className={`flex-row items-center justify-between mb-2 p-3 rounded-t-xl border ${colors.border} ${colors.bg}`}>
                    <View className="flex-row items-center">
                        <Ionicons name="pricetags" size={20} color={colors.text.includes('blue') ? '#2563EB' : colors.text.includes('purple') ? '#7C3AED' : '#D97706'} />
                        <Text className={`font-bold text-base ml-2 ${colors.text}`}>{lista.nombre}</Text>
                    </View>
                    {applicableCampaigns.length > 0 && (
                        <View className="bg-red-500 px-2 py-1 rounded-full">
                            <Text className="text-white text-[9px] font-bold">{applicableCampaigns.length} PROMOCIÓN(ES)</Text>
                        </View>
                    )}
                </View>
                <View className={`bg-white p-4 border-l border-r ${colors.border} ${applicableCampaigns.length === 0 ? 'rounded-b-xl border-b' : ''}`}>
                    <Text className="text-neutral-500 text-xs mb-1">Precio Normal</Text>
                    <Text className={`font-bold text-2xl ${applicableCampaigns.length > 0 ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>{formatPrice(basePrice)}</Text>
                </View>
                {applicableCampaigns.map((campaign, idx) => {
                    const discountedPrice = calculateDiscountedPrice(basePrice, campaign)
                    const savings = basePrice - discountedPrice
                    return (
                        <View key={campaign.id} className={`bg-red-50 p-4 border-l border-r border-red-200 ${idx === applicableCampaigns.length - 1 ? 'rounded-b-xl border-b' : ''}`}>
                            <View className="flex-row items-center mb-2">
                                <View className="bg-red-500 rounded-full w-6 h-6 items-center justify-center mr-2">
                                    <Ionicons name="star" size={14} color="white" />
                                </View>
                                <Text className="font-bold text-red-700 text-sm flex-1">{campaign.nombre}</Text>
                                <View className="bg-green-100 px-2 py-1 rounded-md">
                                    <Text className="text-green-700 text-[9px] font-bold">{campaign.alcance === 'GLOBAL' ? 'GLOBAL' : 'LISTA ESPECÍFICA'}</Text>
                                </View>
                            </View>
                            <View className="bg-white p-4 rounded-lg border border-red-200 mb-2">
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-neutral-600 text-sm font-semibold">Precio Normal:</Text>
                                    <Text className="text-neutral-900 font-bold text-lg">{formatPrice(basePrice)}</Text>
                                </View>
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-red-700 text-sm font-semibold">Descuento:</Text>
                                    <Text className="text-red-600 font-bold text-lg">{campaign.tipo_descuento === 'PORCENTAJE' ? `${campaign.valor_descuento}%` : formatPrice(campaign.valor_descuento)}</Text>
                                </View>
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-green-700 text-sm font-semibold">Precio Final:</Text>
                                    <Text className="text-green-600 font-bold text-lg">{formatPrice(discountedPrice)}</Text>
                                </View>
                            </View>
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <Ionicons name="calendar-outline" size={12} color="#EF4444" />
                                    <Text className="text-[10px] text-neutral-500 ml-1">{new Date(campaign.fecha_inicio).toLocaleDateString()} - {new Date(campaign.fecha_fin).toLocaleDateString()}</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <Ionicons name="cash-outline" size={12} color="#16A34A" />
                                    <Text className="text-[10px] text-green-700 ml-1">Ahorro: {formatPrice(savings)}</Text>
                                </View>
                            </View>
                        </View>
                    )
                })}
            </View>
        )
    }

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color={BRAND_COLORS.red} />
            </View>
        )
    }

    if (!product) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text>Producto no encontrado</Text>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Detalle de Producto" variant="standard" onBackPress={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View className="px-4 pt-4">
                    <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4 mb-4">
                        <View className="flex-row">
                            <View className="w-20 h-20 bg-neutral-100 rounded-xl items-center justify-center mr-4">
                                {product.imagen_url ? (
                                    <Image source={{ uri: product.imagen_url }} style={{ width: 80, height: 80, borderRadius: 12 }} />
                                ) : (
                                    <Ionicons name="image-outline" size={28} color="#9CA3AF" />
                                )}
                            </View>
                            <View className="flex-1">
                                <Text className="font-bold text-neutral-900 text-lg" numberOfLines={2}>{product.nombre}</Text>
                                <Text className="text-neutral-500 text-xs mt-1">SKU: {product.codigo_sku}</Text>
                                <View className="flex-row items-center mt-2">
                                    <Ionicons name="grid-outline" size={14} color="#6B7280" />
                                    <Text className="text-neutral-600 text-xs ml-1">{product.categoria?.nombre || 'Sin categoría'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4 mb-6">
                        <Text className="font-bold text-neutral-900 text-base mb-2">Precios por Lista</Text>
                        {product.precios && product.precios.length > 0 ? (
                            product.precios.map(renderPriceCard)
                        ) : (
                            <Text className="text-neutral-500 text-sm italic">Sin precios asignados</Text>
                        )}
                    </View>
                </View>
            </ScrollView>
            <TouchableOpacity onPress={() => (navigation as any).navigate('SupervisorProductForm', { product: product })} className="absolute right-6 bottom-6 bg-red-600 w-14 h-14 rounded-full items-center justify-center shadow-lg">
                <Ionicons name="pencil" size={22} color="white" />
            </TouchableOpacity>
            <FeedbackModal visible={feedbackModal.visible} type={feedbackModal.type} title={feedbackModal.title} message={feedbackModal.message} onClose={() => setFeedbackModal(prev => ({ ...prev, visible: false }))} />
        </View>
    )
}
