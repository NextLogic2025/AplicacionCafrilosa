import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  LayoutAnimation,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native'
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../shared/types'
import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { CatalogService, Product } from '../../../../services/api/CatalogService'
import { PriceService } from '../../../../services/api/PriceService'
import { PromotionService, PromotionCampaign } from '../../../../services/api/PromotionService'
import { handleApiError } from '../../../../utils/errorHandlers'
import { ProductActivePromotionsSummary } from './components/ProductActivePromotionsSummary'
import { ProductFeatureBadge } from './components/ProductFeatureBadge'
import { ProductInfoRow } from './components/ProductInfoRow'
import { ProductPriceListCard } from './components/ProductPriceListCard'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

export function SupervisorProductDetailScreen() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const isFocused = useIsFocused()
  const { productId } = route.params as { productId: string }

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [priceLists, setPriceLists] = useState<PriceList[]>([])
  const [activeCampaigns, setActiveCampaigns] = useState<PromotionCampaign[]>([])
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({})

  const [feedbackModal, setFeedbackModal] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  })

  const toggleCardExpanded = useCallback((listId: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpandedCards(prev => ({ ...prev, [listId]: !prev[listId] }))
  }, [])

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)
  }, [])

  const calculateDiscountedPrice = useCallback((basePrice: number, campaign: PromotionCampaign): number => {
    if (!campaign) return basePrice
    if (campaign.tipo_descuento === 'PORCENTAJE') return basePrice * (1 - campaign.valor_descuento / 100)
    if (campaign.tipo_descuento === 'MONTO_FIJO') return Math.max(0, basePrice - campaign.valor_descuento)
    return basePrice
  }, [])

  const getPromotionsForList = useCallback(
    (listaId: number): PromotionCampaign[] => {
      return activeCampaigns.filter(campaign => {
        if (campaign.alcance === 'GLOBAL') return true
        if (campaign.alcance === 'POR_LISTA') return campaign.lista_precios_objetivo_id === listaId
        return false
      })
    },
    [activeCampaigns],
  )

  const loadProductDetails = useCallback(
    async (isRefresh: boolean = false) => {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      try {
        const [foundProduct, priceListsData, campaignsData] = await Promise.all([
          CatalogService.getProductById(productId),
          PriceService.getLists(),
          PromotionService.getCampaigns(),
        ])

        if (!foundProduct) {
          setFeedbackModal({
            visible: true,
            type: 'error',
            title: 'Producto no encontrado',
            message: 'No se pudo encontrar el producto solicitado',
          })
          return
        }

        setProduct(foundProduct)
        setPriceLists(priceListsData)

        const now = new Date()
        const activeCampaignsForProduct: PromotionCampaign[] = []

        for (const campaign of campaignsData) {
          const startDate = new Date(campaign.fecha_inicio)
          const endDate = new Date(campaign.fecha_fin)
          if (!campaign.activo || now < startDate || now > endDate) continue

          try {
            const campaignProducts = await PromotionService.getProducts(campaign.id)
            const isInCampaign = campaignProducts.some(cp => cp.producto_id === productId)
            if (isInCampaign) activeCampaignsForProduct.push(campaign)
          } catch (err: any) {
            if (err?.message === 'SESSION_EXPIRED') throw err
          }
        }

        setActiveCampaigns(activeCampaignsForProduct)
      } catch (error: any) {
        const errorInfo = handleApiError(error)
        setFeedbackModal({ visible: true, type: errorInfo.type as FeedbackType, title: errorInfo.title, message: errorInfo.message })
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [productId],
  )

  useEffect(() => {
    if (isFocused && productId) loadProductDetails()
  }, [isFocused, productId, loadProductDetails])

  const onRefresh = useCallback(() => {
    loadProductDetails(true)
  }, [loadProductDetails])

  if (loading) {
    return (
      <View className="flex-1 bg-neutral-50">
        <Header title="Detalle de producto" variant="standard" onBackPress={() => navigation.goBack()} />
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
        <Header title="Detalle de producto" variant="standard" onBackPress={() => navigation.goBack()} />
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

  return (
    <View className="flex-1 bg-neutral-50">
      <Header title="Detalle de producto" variant="standard" onBackPress={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND_COLORS.red]} tintColor={BRAND_COLORS.red} />}
      >
        <View className="bg-white border-b border-neutral-100">
          <View className="items-center py-6 px-4">
            <View className="w-40 h-40 bg-neutral-100 rounded-2xl items-center justify-center mb-4 shadow-sm overflow-hidden">
              {product.imagen_url ? (
                <Image source={{ uri: product.imagen_url }} style={{ width: 160, height: 160 }} resizeMode="cover" />
              ) : (
                <View className="items-center">
                  <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                  <Text className="text-neutral-400 text-xs mt-2">Sin imagen</Text>
                </View>
              )}
            </View>

            <View className={`px-4 py-1.5 rounded-full ${product.activo ? 'bg-green-100' : 'bg-red-100'}`}>
              <View className="flex-row items-center">
                <View className={`w-2 h-2 rounded-full mr-2 ${product.activo ? 'bg-green-500' : 'bg-red-500'}`} />
                <Text className={`text-xs font-bold uppercase ${product.activo ? 'text-green-700' : 'text-red-700'}`}>
                  {product.activo ? 'Producto activo' : 'Producto inactivo'}
                </Text>
              </View>
            </View>

            <Text className="font-bold text-neutral-900 text-xl text-center mt-4 px-4">{product.nombre}</Text>

            <View className="flex-row items-center mt-2 bg-neutral-100 px-3 py-1.5 rounded-lg">
              <Ionicons name="barcode-outline" size={16} color="#6B7280" />
              <Text className="text-neutral-600 text-sm font-medium ml-2">SKU: {product.codigo_sku}</Text>
            </View>

            <View className="flex-row items-center mt-3">
              <Ionicons name="folder-outline" size={16} color={BRAND_COLORS.red} />
              <Text style={{ color: BRAND_COLORS.red }} className="text-sm font-semibold ml-1.5">
                {product.categoria?.nombre || 'Sin categoría'}
              </Text>
            </View>
          </View>
        </View>

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

        <View className="px-4 pt-5">
          <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
            <View className="flex-row items-center px-4 py-3 bg-neutral-50 border-b border-neutral-100">
              <Ionicons name="settings-outline" size={20} color={BRAND_COLORS.red} />
              <Text className="font-bold text-neutral-900 text-base ml-2">Especificaciones</Text>
            </View>
            <View className="p-4">
              <ProductInfoRow icon="scale-outline" label="Peso unitario" value={product.peso_unitario_kg ? `${product.peso_unitario_kg} kg` : 'No especificado'} />
              <ProductInfoRow icon="cube-outline" label="Volumen" value={product.volumen_m3 ? `${product.volumen_m3} m³` : 'No especificado'} />
              <ProductInfoRow icon="resize-outline" label="Unidad de medida" value={product.unidad_medida || 'No especificado'} />

              <View className="pt-4 mt-2">
                <Text className="text-neutral-500 text-xs mb-3 font-medium">CARACTERÍSTICAS ESPECIALES</Text>
                <View className="flex-row flex-wrap">
                  <ProductFeatureBadge icon="snow-outline" label="Requiere frío" active={product.requiere_frio || false} />
                  <ProductFeatureBadge icon="checkmark-circle-outline" label="Disponible" active={product.activo} />
                </View>
              </View>
            </View>
          </View>
        </View>

        <ProductActivePromotionsSummary campaigns={activeCampaigns} priceLists={priceLists} formatPrice={formatPrice} />

        <View className="px-4 pt-5">
          <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
            <View className="flex-row items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-100">
              <View className="flex-row items-center">
                <Ionicons name="pricetags-outline" size={20} color={BRAND_COLORS.red} />
                <Text className="font-bold text-neutral-900 text-base ml-2">Precios por lista</Text>
              </View>
              {product.precios?.length ? (
                <View style={{ backgroundColor: `${BRAND_COLORS.red}15` }} className="px-2 py-1 rounded-lg">
                  <Text style={{ color: BRAND_COLORS.red }} className="text-xs font-bold">
                    {product.precios.length} lista(s)
                  </Text>
                </View>
              ) : null}
            </View>
            <View className="p-4">
              {product.precios?.length ? (
                product.precios.map((priceItem: { lista_id: number; precio: number }) => {
                  const list = priceLists.find(l => l.id === priceItem.lista_id)
                  if (!list) return null
                  const promotions = getPromotionsForList(list.id)
                  const expanded = !!expandedCards[list.id]
                  return (
                    <ProductPriceListCard
                      key={list.id}
                      list={list}
                      basePrice={priceItem.precio}
                      promotions={promotions}
                      expanded={expanded}
                      onToggleExpanded={() => toggleCardExpanded(list.id)}
                      formatPrice={formatPrice}
                      calculateDiscountedPrice={calculateDiscountedPrice}
                    />
                  )
                })
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

        <View className="px-4 pt-5">
          <View style={{ backgroundColor: `${BRAND_COLORS.red}08`, borderColor: `${BRAND_COLORS.red}20` }} className="rounded-2xl p-4 border">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color={BRAND_COLORS.red} />
              <View className="flex-1 ml-3">
                <Text style={{ color: BRAND_COLORS.red700 }} className="font-semibold text-sm mb-1">
                  Información del supervisor
                </Text>
                <Text className="text-neutral-600 text-xs leading-5">
                  Como supervisor, puedes editar este producto tocando el botón de edición. Los cambios se reflejarán en todas las listas de precios y
                  afectarán a los vendedores asignados.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={() => navigation.navigate('SupervisorProductForm', { product })}
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
          shadowRadius: 8,
        }}
      >
        <Ionicons name="create-outline" size={26} color="white" />
      </TouchableOpacity>

      <FeedbackModal
        visible={feedbackModal.visible}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        onClose={() => setFeedbackModal(prev => ({ ...prev, visible: false }))}
      />
    </View>
  )
}
