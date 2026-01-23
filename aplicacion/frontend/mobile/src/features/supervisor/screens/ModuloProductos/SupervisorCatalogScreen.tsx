import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { GenericList } from '../../../../components/ui/GenericList'
import { ExpandableFab } from '../../../../components/ui/ExpandableFab'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { BRAND_COLORS } from '../../../../shared/types'
import { SearchBar } from '../../../../components/ui/SearchBar'
import { ComboBox, type ComboBoxOption } from '../../../../components/ui/ComboBox'
import { CatalogService, Product, Category } from '../../../../services/api/CatalogService'
import { PromotionService, PromotionCampaign } from '../../../../services/api/PromotionService'

type CatalogCategoryValue = number | 'all'

export function SupervisorCatalogScreen() {
  const navigation = useNavigation<any>()
  const isFocused = useIsFocused()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<CatalogCategoryValue>('all')

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCampaigns, setActiveCampaigns] = useState<PromotionCampaign[]>([])
  const [loading, setLoading] = useState(false)

  const [feedbackModal, setFeedbackModal] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
    visible: false,
    type: 'error',
    title: '',
    message: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [productsData, categoriesData, campaignsData] = await Promise.all([
        CatalogService.getProducts(),
        CatalogService.getCategories(),
        PromotionService.getCampaigns(),
      ])

      setProducts(productsData)
      setCategories(categoriesData)

      const now = new Date()
      const active = campaignsData.filter(c => {
        const start = new Date(c.fecha_inicio)
        const end = new Date(c.fecha_fin)
        return c.activo && now >= start && now <= end
      })
      setActiveCampaigns(active)
    } catch {
      setFeedbackModal({ visible: true, type: 'error', title: 'Error al cargar', message: 'No se pudo cargar el catalogo. Intenta nuevamente' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isFocused) fetchData()
  }, [isFocused])

  const filteredProducts = useMemo(() => {
    const searchLower = searchQuery.toLowerCase()
    return products.filter(p => {
      const matchesSearch = p.nombre.toLowerCase().includes(searchLower) || p.codigo_sku.toLowerCase().includes(searchLower)
      const matchesCategory = selectedCategoryId === 'all' || p.categoria_id === selectedCategoryId
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategoryId])

  const categoryOptions = useMemo<ComboBoxOption<CatalogCategoryValue>[]>(() => {
    const baseOption: ComboBoxOption<CatalogCategoryValue> = {
      value: 'all',
      label: 'Todas',
      description: 'Mostrar todo el catálogo',
    }
    const categoryEntries = categories.map(category => ({
      value: category.id,
      label: category.nombre,
      description: category.descripcion,
    }))

    return [baseOption, ...categoryEntries]
  }, [categories])

  const getTotalPromotionsForProduct = (item: Product): number => {
    const directPromos = (item.promociones || []).filter(p => p.precio_oferta != null).length
    const productListIds = item.precios?.map(p => p.lista_id) || []
    const listPromos = activeCampaigns.filter(c => {
      if (c.alcance !== 'POR_LISTA' || !c.lista_precios_objetivo_id) return false
      return productListIds.includes(c.lista_precios_objetivo_id)
    }).length
    return directPromos + listPromos
  }

  const renderProductItem = (item: Product) => {
    const hasPromotion = item.precio_oferta != null && item.precio_oferta < (item.precio_original || Infinity)
    const totalPromos = getTotalPromotionsForProduct(item)
    const showPromos = totalPromos > 0 || hasPromotion

    return (
      <TouchableOpacity
        className="w-full bg-white mb-4 rounded-2xl shadow-sm border border-neutral-100"
        activeOpacity={0.8}
        onPress={() => navigation.navigate('SupervisorProductDetail', { productId: item.id })}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 3,
          paddingVertical: 18,
          paddingHorizontal: 18
        }}
      >
        <View className="flex-row">
          <View className="w-20 h-20 bg-neutral-100 rounded-xl items-center justify-center mr-4">
            <Ionicons name={item.imagen_url ? 'image' : 'image-outline'} size={26} color={item.imagen_url ? BRAND_COLORS.red : '#9CA3AF'} />
            {showPromos && (
              <View
                style={{ position: 'absolute', top: -6, right: -6, backgroundColor: BRAND_COLORS.red }}
                className="rounded-full w-6 h-6 items-center justify-center border-2 border-white"
              >
                <Text className="text-white text-[10px] font-bold">{totalPromos}</Text>
              </View>
            )}
          </View>

          <View className="flex-1 justify-center">
            <View className="flex-row justify-between items-start mb-2">
              <Text className="font-bold text-neutral-900 text-base flex-1 mr-2" numberOfLines={2}>{item.nombre}</Text>
              <View className={`px-2 py-0.5 rounded-md ${item.activo ? 'bg-green-100' : 'bg-neutral-100'}`}>
                <Text className={`text-[10px] font-bold uppercase ${item.activo ? 'text-green-700' : 'text-neutral-500'}`}>{item.activo ? 'Activo' : 'Inactivo'}</Text>
              </View>
            </View>

            <Text className="text-neutral-500 text-xs mb-2">SKU: {item.codigo_sku}</Text>

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

              {showPromos && (
                <View style={{ backgroundColor: `${BRAND_COLORS.red}15` }} className="px-2 py-1 rounded-md ml-2">
                  <Text style={{ color: BRAND_COLORS.red }} className="text-[10px] font-bold">
                    {totalPromos} PROMO{totalPromos > 1 ? 'S' : ''}
                  </Text>
                </View>
              )}
            </View>

            {hasPromotion && item.precio_oferta != null && (
              <View className="flex-row items-center mt-2">
                <Text className="text-neutral-400 text-xs line-through mr-2">
                  {new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
                    item.precio_original || 0,
                  )}
                </Text>
                <Text style={{ color: BRAND_COLORS.red }} className="font-bold text-sm">
                  {new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
                    item.precio_oferta,
                  )}
                </Text>
              </View>
            )}

            <View className="flex-row items-center mt-3 pt-2 border-t border-neutral-100">
              <Text style={{ color: BRAND_COLORS.red }} className="text-xs font-semibold">
                Ver detalles completos
              </Text>
              <Ionicons name="chevron-forward" size={14} color={BRAND_COLORS.red} style={{ marginLeft: 4 }} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View className="flex-1 bg-neutral-50 relative">
      <Header title="Catalogo general" variant="standard" onBackPress={() => navigation.goBack()} />

      <View className="bg-white shadow-sm z-10 pb-3">
        <View className="px-5 py-4 flex-row items-center">
          <View className="flex-1 mr-3">
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar producto..." onClear={() => setSearchQuery('')} />
          </View>
          <TouchableOpacity
            style={{ backgroundColor: BRAND_COLORS.red }}
            className="w-12 h-12 rounded-xl items-center justify-center shadow-lg"
            onPress={() => navigation.navigate('SupervisorProductForm')}
          >
            <Ionicons name="add" size={26} color="white" />
          </TouchableOpacity>
        </View>

        <View className="px-5 pb-4">
          <View className="border border-[#F1F3F5] rounded-3xl shadow-sm bg-white" style={{ maxWidth: 520, width: '100%', alignSelf: 'center' }}>
          <ComboBox
            options={categoryOptions}
            value={selectedCategoryId}
            onValueChange={setSelectedCategoryId}
            placeholder="Todas"
            description="Elige una categoría para filtrar"
          />
          </View>
        </View>
      </View>

      <View className="flex-1 mt-4">
        <GenericList
          items={filteredProducts}
          isLoading={loading}
          onRefresh={fetchData}
          renderItem={renderProductItem}
          emptyState={{ icon: 'cube-outline', title: 'Sin productos', message: 'No hay productos que coincidan con los filtros.' }}
        />
      </View>

      <ExpandableFab
        actions={[
          { icon: 'pricetags', label: 'Listas de precio', onPress: () => navigation.navigate('SupervisorPriceLists') },
          { icon: 'grid', label: 'Categorias', onPress: () => navigation.navigate('SupervisorCategories') },
        ]}
      />

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
