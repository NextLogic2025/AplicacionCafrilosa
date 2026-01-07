import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Header } from '../../../components/ui/Header'
import { FeedbackModal, FeedbackType } from '../../../components/ui/FeedbackModal'
import { CatalogService, Product } from '../../../services/api/CatalogService'
import { PriceService, PriceList } from '../../../services/api/PriceService'
import { PromotionService } from '../../../services/api/PromotionService'
import { handleApiError } from '../../../utils/errorHandlers'

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
                CatalogService.getProducts(), // Obtener todos y filtrar
                PriceService.getLists(),
                PromotionService.getCampaigns()
            ])

            const foundProduct = productData.find(p => p.id === productId)
            if (!foundProduct) {
                setFeedbackModal({
                    visible: true,
                    type: 'error',
                    title: 'Producto no encontrado',
                    message: 'No se pudo encontrar el producto solicitado'
                })
                return
            }

            setProduct(foundProduct)
            setPriceLists(priceListsData)

            // Filtrar campañas activas que incluyan este producto
            const now = new Date()
            const activeCampaignsForProduct: any[] = []

            for (const campaign of campaignsData) {
                const startDate = new Date(campaign.fecha_inicio)
                const endDate = new Date(campaign.fecha_fin)

                if (campaign.activo && now >= startDate && now <= endDate) {
                    // Verificar si el producto está en esta campaña
                    try {
                        const campaignProducts = await PromotionService.getProducts(campaign.id)
                        const isInCampaign = campaignProducts.some(cp => cp.producto_id === productId)

                        if (isInCampaign) {
                            activeCampaignsForProduct.push(campaign)
                        }
                    } catch (err: any) {
                        // Ignorar errores de sesión expirada en subconsultas
                        if (err?.message !== 'SESSION_EXPIRED') {
                            console.error('Error loading campaign products:', err)
                        }
                    }
                }
            }

            setActiveCampaigns(activeCampaignsForProduct)
        } catch (error: any) {
            // Manejar errores de forma elegante usando la utilidad
            const errorInfo = handleApiError(error)
            console.error('Error loading product:', error)

            setFeedbackModal({
                visible: true,
                type: errorInfo.type as FeedbackType,
                title: errorInfo.title,
                message: errorInfo.message
            })
        } finally {
            setLoading(false)
        }
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price)
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

        // Encontrar promociones aplicables a esta lista
        // GLOBAL: aplica a todas las listas
        // POR_LISTA: solo aplica a la lista específica
        // POR_CLIENTE: se muestra para supervisores (ellos ven todo)
        const applicableCampaigns = activeCampaigns.filter(campaign => {
            if (campaign.alcance === 'GLOBAL') return true
            if (campaign.alcance === 'POR_LISTA' && campaign.lista_precios_objetivo_id === lista.id) return true
            if (campaign.alcance === 'POR_CLIENTE') return true
            return false
        })

        return (
            <View key={priceItem.lista_id} className="mb-4">
                {/* Header de la lista */}
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

                {/* Precio base */}
                <View className={`bg-white p-4 border-l border-r ${colors.border} ${applicableCampaigns.length === 0 ? 'rounded-b-xl border-b' : ''}`}>
                    <Text className="text-neutral-500 text-xs mb-1">Precio Normal</Text>
                    <Text className={`font-bold text-2xl ${applicableCampaigns.length > 0 ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>
                        {formatPrice(basePrice)}
                    </Text>
                </View>

                {/* Promociones aplicables */}
                {applicableCampaigns.map((campaign, idx) => {
                    const discountedPrice = calculateDiscountedPrice(basePrice, campaign)
                    const savings = basePrice - discountedPrice

                    return (
                        <View
                            key={campaign.id}
                            className={`bg-red-50 p-4 border-l border-r border-red-200 ${idx === applicableCampaigns.length - 1 ? 'rounded-b-xl border-b' : ''}`}
                        >
                            {/* Nombre de campaña */}
                            <View className="flex-row items-center mb-2">
                                <View className="bg-red-500 rounded-full w-6 h-6 items-center justify-center mr-2">
                                    <Ionicons name="star" size={14} color="white" />
                                </View>
                                <Text className="font-bold text-red-700 text-sm flex-1">{campaign.nombre}</Text>
                                <View className="bg-green-100 px-2 py-1 rounded-md">
                                    <Text className="text-green-700 text-[9px] font-bold">
                                        {campaign.alcance === 'GLOBAL' ? 'GLOBAL' : 'LISTA ESPECÍFICA'}
                                    </Text>
                                </View>
                            </View>

                            {/* Cálculo visual del descuento: Precio - Descuento = Final */}
                            <View className="bg-white p-4 rounded-lg border border-red-200 mb-2">
                                {/* Fila 1: Precio Normal */}
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-neutral-600 text-sm font-semibold">Precio Normal:</Text>
                                    <Text className="text-neutral-900 font-bold text-lg">{formatPrice(basePrice)}</Text>
                                </View>

                                {/* Fila 2: Menos Descuento */}
                                <View className="flex-row items-center justify-between mb-2 pb-2 border-b border-neutral-100">
                                    <View className="flex-row items-center">
                                        <Ionicons name="remove-circle" size={16} color="#DC2626" />
                                        <Text className="text-red-600 text-sm font-semibold ml-1">
                                            {campaign.tipo_descuento === 'PORCENTAJE'
                                                ? `Promo ${campaign.valor_descuento}%:`
                                                : 'Promo:'
                                            }
                                        </Text>
                                    </View>
                                    <Text className="text-red-600 font-bold text-lg">- {formatPrice(savings)}</Text>
                                </View>

                                {/* Fila 3: Igual a Precio Final */}
                                <View className="flex-row items-center justify-between bg-green-50 p-3 rounded-lg">
                                    <View className="flex-row items-center">
                                        <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                                        <Text className="text-green-700 text-sm font-bold ml-1">Precio Final:</Text>
                                    </View>
                                    <Text className="text-green-600 font-bold text-2xl">{formatPrice(discountedPrice)}</Text>
                                </View>
                            </View>

                            {/* Vigencia */}
                            <View className="flex-row items-center mt-2">
                                <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                                <Text className="text-neutral-400 text-[10px] ml-1">
                                    Válido: {new Date(campaign.fecha_inicio).toLocaleDateString()} - {new Date(campaign.fecha_fin).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                    )
                })}
            </View>
        )
    }

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-neutral-50">
                <ActivityIndicator size="large" color={BRAND_COLORS.red} />
            </View>
        )
    }

    if (!product) {
        return (
            <View className="flex-1 justify-center items-center bg-neutral-50">
                <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
                <Text className="text-neutral-400 mt-4">Producto no encontrado</Text>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title="Detalle de Producto"
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Sección de información del producto */}
                <View className="bg-white p-6 mb-4">
                    {/* Imagen placeholder */}
                    <View className="items-center mb-4">
                        <View className="w-32 h-32 bg-neutral-100 rounded-2xl items-center justify-center">
                            {product.imagen_url ? (
                                <Ionicons name="image" size={48} color="#2563EB" />
                            ) : (
                                <Ionicons name="cube" size={48} color="#9CA3AF" />
                            )}
                        </View>
                    </View>

                    {/* Nombre y estado */}
                    <View className="items-center mb-4">
                        <Text className="font-bold text-2xl text-neutral-900 text-center mb-2">{product.nombre}</Text>
                        <View className={`px-3 py-1 rounded-full ${product.activo ? 'bg-green-100' : 'bg-neutral-100'}`}>
                            <Text className={`text-xs font-bold ${product.activo ? 'text-green-700' : 'text-neutral-500'}`}>
                                {product.activo ? 'ACTIVO' : 'INACTIVO'}
                            </Text>
                        </View>
                    </View>

                    {/* Información básica */}
                    <View className="bg-neutral-50 p-4 rounded-xl">
                        <InfoRow icon="barcode-outline" label="SKU" value={product.codigo_sku} />
                        {product.categoria && <InfoRow icon="grid-outline" label="Categoría" value={product.categoria.nombre} />}
                        {product.peso_unitario_kg && <InfoRow icon="scale-outline" label="Peso" value={`${product.peso_unitario_kg} kg`} />}
                        {product.unidad_medida && <InfoRow icon="cube-outline" label="Unidad" value={product.unidad_medida} />}
                        {product.requiere_frio !== undefined && (
                            <InfoRow
                                icon={product.requiere_frio ? "snow" : "sunny"}
                                label="Refrigeración"
                                value={product.requiere_frio ? 'Requiere frío' : 'No requiere'}
                            />
                        )}
                    </View>

                    {product.descripcion && (
                        <View className="mt-4">
                            <Text className="text-neutral-500 text-xs font-bold mb-1">DESCRIPCIÓN</Text>
                            <Text className="text-neutral-700 text-sm">{product.descripcion}</Text>
                        </View>
                    )}
                </View>

                {/* Sección de precios y promociones */}
                <View className="px-4 mb-6">
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="pricetags" size={24} color={BRAND_COLORS.red} />
                        <Text className="font-bold text-xl text-neutral-900 ml-2">Precios y Promociones</Text>
                    </View>

                    {product.precios && product.precios.length > 0 ? (
                        <>
                            {product.precios
                                .map(renderPriceCard)
                                .filter(card => card !== null)}
                        </>
                    ) : (
                        <View className="bg-white p-6 rounded-xl items-center">
                            <Ionicons name="cash-outline" size={48} color="#9CA3AF" />
                            <Text className="text-neutral-400 text-sm mt-2">Sin precios asignados</Text>
                        </View>
                    )}
                </View>

                {/* Botón de editar */}
                <View className="px-4 mb-8">
                    <TouchableOpacity
                        className="bg-red-600 py-4 rounded-xl shadow-lg items-center"
                        onPress={() => (navigation as any).navigate('SupervisorProductForm', { product, priceLists })}
                    >
                        <Text className="text-white font-bold text-base">EDITAR PRODUCTO</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

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

// Componente auxiliar para mostrar información
function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <View className="flex-row items-center py-2 border-b border-neutral-100">
            <Ionicons name={icon as any} size={16} color="#9CA3AF" />
            <Text className="text-neutral-500 text-xs font-semibold ml-2 w-24">{label}:</Text>
            <Text className="text-neutral-900 text-sm flex-1">{value}</Text>
        </View>
    )
}
