import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useNavigation, useRoute } from '@react-navigation/native'
import { BRAND_COLORS } from '../../../../shared/types'
import { PromotionService, PromotionCampaign, PromotionProduct, PromotionClient } from '../../../../services/api/PromotionService'
import { CatalogService, Product } from '../../../../services/api/CatalogService'
import { ClientService, Client } from '../../../../services/api/ClientService'
import { PriceService, PriceList } from '../../../../services/api/PriceService'
import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { PromotionBasicInfoSection } from './components/PromotionBasicInfoSection'
import { PromotionItemPickerScreen } from './components/PromotionItemPickerScreen'
import { PromotionProductsSection } from './components/PromotionProductsSection'
import { PromotionScopeSection } from './components/PromotionScopeSection'

type PickerType = 'none' | 'products' | 'clients'

export function SupervisorPromotionFormScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()

  const campaign = route.params?.campaign as PromotionCampaign | undefined
  const isEditing = !!campaign

  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  const [nombre, setNombre] = useState(campaign?.nombre || '')
  const [fechaInicio, setFechaInicio] = useState(
    campaign?.fecha_inicio ? new Date(campaign.fecha_inicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  )
  const [fechaFin, setFechaFin] = useState(campaign?.fecha_fin ? new Date(campaign.fecha_fin).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  const [tipoDescuento, setTipoDescuento] = useState<'PORCENTAJE' | 'MONTO_FIJO'>(campaign?.tipo_descuento || 'PORCENTAJE')
  const [valorDescuento, setValorDescuento] = useState(campaign?.valor_descuento?.toString() || '')
  const [alcance, setAlcance] = useState<'GLOBAL' | 'POR_LISTA' | 'POR_CLIENTE'>(campaign?.alcance || 'GLOBAL')
  const [listaId, setListaId] = useState<number | undefined>(campaign?.lista_precios_objetivo_id || undefined)
  const [activo, setActivo] = useState(campaign?.activo ?? true)
  const [imagenBanner, setImagenBanner] = useState(campaign?.imagen_banner_url || '')

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateTarget, setDateTarget] = useState<'start' | 'end'>('start')

  const [promoProducts, setPromoProducts] = useState<PromotionProduct[]>([])
  const [promoClients, setPromoClients] = useState<PromotionClient[]>([])

  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [availableClients, setAvailableClients] = useState<Client[]>([])
  const [priceLists, setPriceLists] = useState<PriceList[]>([])

  const [pickerType, setPickerType] = useState<PickerType>('none')
  const [searchText, setSearchText] = useState('')
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({})

  const [feedbackModal, setFeedbackModal] = useState<{
    visible: boolean
    type: FeedbackType
    title: string
    message: string
    onConfirm?: () => void
    showCancel?: boolean
    confirmText?: string
  }>({ visible: false, type: 'info', title: '', message: '' })

  const showModal = useCallback(
    (type: FeedbackType, title: string, message: string, onConfirm?: () => void, showCancel: boolean = false, confirmText: string = 'Entendido') => {
      setFeedbackModal({ visible: true, type, title, message, onConfirm, showCancel, confirmText })
    },
    [],
  )

  const closeModal = useCallback(() => {
    setFeedbackModal(prev => ({ ...prev, visible: false }))
  }, [])

  const loadData = useCallback(async () => {
    try {
      setInitializing(true)
      const [lists, prods, clis] = await Promise.all([PriceService.getLists(), CatalogService.getProducts(), ClientService.getClients()])

      setPriceLists(lists)
      setAvailableProducts(prods)
      setAvailableClients(clis)

      if (isEditing && campaign) {
        const [rawProducts, rawClients] = await Promise.all([PromotionService.getProducts(campaign.id), PromotionService.getClients(campaign.id)])

        const hydratedClients = rawClients.map(rc => ({
          ...rc,
          cliente: rc.cliente || clis.find(c => c.id === rc.cliente_id),
        }))

        setPromoProducts(rawProducts)
        setPromoClients(hydratedClients)
      }
    } catch {
      showModal('error', 'Error', 'No se pudieron cargar los datos')
    } finally {
      setInitializing(false)
    }
  }, [campaign, isEditing, showModal])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onDateChange = useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      setShowDatePicker(false)
      if (!selectedDate) return
      const dateStr = selectedDate.toISOString().split('T')[0]
      if (dateTarget === 'start') setFechaInicio(dateStr)
      else setFechaFin(dateStr)
    },
    [dateTarget],
  )

  const openDatePicker = useCallback((target: 'start' | 'end') => {
    setDateTarget(target)
    setShowDatePicker(true)
  }, [])

  const addProduct = useCallback(
    async (product: Product) => {
      try {
        if (promoProducts.some(p => p.producto_id === product.id)) return

        const full = availableProducts.find(p => p.id === product.id) || product
        const newP: PromotionProduct = { campania_id: campaign?.id || 0, producto_id: product.id, precio_oferta_fijo: null, producto: full }

        setExpandedProducts(prev => ({ ...prev, [product.id]: true }))
        if (campaign) await PromotionService.addProduct(campaign.id, product.id, null)
        setPromoProducts(prev => [...prev, newP])

        setPickerType('none')
        setSearchText('')
      } catch {
        showModal('error', 'Error', 'No se pudo agregar el producto')
      }
    },
    [availableProducts, campaign, promoProducts, showModal],
  )

  const addClient = useCallback(
    async (client: Client) => {
      try {
        if (promoClients.some(c => c.cliente_id === client.id)) return
        const newC: PromotionClient = { campania_id: campaign?.id || 0, cliente_id: client.id, cliente: client }
        if (campaign) await PromotionService.addClient(campaign.id, client.id)
        setPromoClients(prev => [...prev, newC])

        setPickerType('none')
        setSearchText('')
      } catch {
        showModal('error', 'Error', 'No se pudo agregar el cliente')
      }
    },
    [campaign, promoClients, showModal],
  )

  const toggleProductExpansion = useCallback((productId: string) => {
    setExpandedProducts(prev => ({ ...prev, [productId]: !prev[productId] }))
  }, [])

  const removeProduct = useCallback(
    async (productId: string) => {
      try {
        if (campaign) await PromotionService.removeProduct(campaign.id, productId)
        setPromoProducts(prev => prev.filter(p => p.producto_id !== productId))
      } catch {
        showModal('error', 'Error', 'No se pudo eliminar')
      }
    },
    [campaign, showModal],
  )

  const removeClient = useCallback(
    async (clientId: string) => {
      try {
        if (campaign) await PromotionService.removeClient(campaign.id, clientId)
        setPromoClients(prev => prev.filter(c => c.cliente_id !== clientId))
      } catch {
        showModal('error', 'Error', 'No se pudo eliminar')
      }
    },
    [campaign, showModal],
  )

  const handleSave = useCallback(async () => {
    if (!nombre.trim()) return showModal('warning', 'Faltan datos', 'El nombre es obligatorio')
    if (!valorDescuento || isNaN(Number(valorDescuento)) || Number(valorDescuento) <= 0) return showModal('warning', 'Error', 'Valor de descuento inválido')
    if (alcance === 'POR_LISTA' && !listaId) return showModal('warning', 'Faltan datos', 'Selecciona una lista de precios')

    setLoading(true)
    try {
      const payload: Partial<PromotionCampaign> = {
        nombre,
        descripcion: 'Gestión móvil',
        fecha_inicio: new Date(fechaInicio).toISOString(),
        fecha_fin: new Date(fechaFin).toISOString(),
        tipo_descuento: tipoDescuento,
        valor_descuento: Number(valorDescuento),
        alcance,
        lista_precios_objetivo_id: alcance === 'POR_LISTA' ? listaId : null,
        activo,
        imagen_banner_url: imagenBanner,
      }

      let savedId = campaign?.id
      if (isEditing && campaign) {
        await PromotionService.updateCampaign(campaign.id, payload)
        savedId = campaign.id
      } else {
        const newCamp = await PromotionService.createCampaign(payload)
        savedId = newCamp.id

        const productPromises = promoProducts.map(p => PromotionService.addProduct(newCamp.id, p.producto_id, null))
        const clientPromises = promoClients.map(c => PromotionService.addClient(newCamp.id, c.cliente_id))
        await Promise.all([...productPromises, ...clientPromises])
      }

      showModal('success', 'Éxito', isEditing ? 'Campaña actualizada correctamente' : 'Campaña creada correctamente', () => navigation.goBack())
    } catch {
      showModal('error', 'Error', 'No se pudo guardar la campaña')
    } finally {
      setLoading(false)
    }
  }, [activo, alcance, campaign, fechaFin, fechaInicio, imagenBanner, isEditing, listaId, navigation, nombre, promoClients, promoProducts, showModal, tipoDescuento, valorDescuento])

  const handleDelete = useCallback(async () => {
    if (!campaign) return

    showModal(
      'warning',
      'Eliminar campaña',
      '¿Estás seguro de que deseas eliminar esta campaña? Esta acción no se puede deshacer.',
      async () => {
        closeModal()
        setLoading(true)
        try {
          await PromotionService.deleteCampaign(campaign.id)
          setTimeout(() => {
            showModal('success', 'Éxito', 'Campaña eliminada correctamente', () => navigation.goBack())
          }, 300)
        } catch {
          showModal('error', 'Error', 'No se pudo eliminar la campaña')
        } finally {
          setLoading(false)
        }
      },
      true,
      'Eliminar',
    )
  }, [campaign, closeModal, navigation, showModal])

  if (pickerType !== 'none') {
    return (
      <PromotionItemPickerScreen
        type={pickerType}
        availableClients={availableClients}
        availableProducts={availableProducts}
        promoClients={promoClients}
        promoProducts={promoProducts}
        searchText={searchText}
        setSearchText={setSearchText}
        onClose={() => {
          setPickerType('none')
          setSearchText('')
        }}
        onAddClient={addClient}
        onAddProduct={addProduct}
      />
    )
  }

  if (initializing) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color={BRAND_COLORS.red} />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header title={isEditing ? 'Editar promoción' : 'Nueva promoción'} variant="standard" onBackPress={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <PromotionBasicInfoSection
          nombre={nombre}
          setNombre={setNombre}
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          onOpenDatePicker={openDatePicker}
          tipoDescuento={tipoDescuento}
          setTipoDescuento={setTipoDescuento}
          valorDescuento={valorDescuento}
          setValorDescuento={setValorDescuento}
          imagenBanner={imagenBanner}
          setImagenBanner={setImagenBanner}
          activo={activo}
          setActivo={setActivo}
        />

        <PromotionScopeSection
          alcance={alcance}
          setAlcance={next => {
            setAlcance(next)
            if (next !== 'POR_LISTA') setListaId(undefined)
          }}
          listaId={listaId}
          setListaId={setListaId}
          priceLists={priceLists}
          promoClients={promoClients}
          onAddClient={() => setPickerType('clients')}
          onRemoveClient={removeClient}
        />

        <PromotionProductsSection
          promoProducts={promoProducts}
          expandedProducts={expandedProducts}
          onToggleProductExpansion={toggleProductExpansion}
          onRemoveProduct={removeProduct}
          onAddProduct={() => setPickerType('products')}
          priceLists={priceLists}
          tipoDescuento={tipoDescuento}
          valorDescuento={Number(valorDescuento) || undefined}
        />

        <View className="mt-4 mb-10 mx-4">
          <TouchableOpacity onPress={handleSave} className="bg-red-600 py-4 rounded-xl shadow-lg items-center mb-3" disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">{isEditing ? 'GUARDAR CAMBIOS' : 'CREAR CAMPAÑA'}</Text>}
          </TouchableOpacity>
          {isEditing && (
            <TouchableOpacity onPress={handleDelete} className="bg-white py-4 rounded-xl shadow-sm border border-red-100 items-center" disabled={loading}>
              <Text className="text-red-600 font-bold text-base">ELIMINAR CAMPAÑA</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker value={dateTarget === 'start' ? new Date(fechaInicio) : new Date(fechaFin)} mode="date" display="default" onChange={onDateChange} />
      )}

      <FeedbackModal
        visible={feedbackModal.visible}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        onClose={closeModal}
        onConfirm={feedbackModal.onConfirm}
        showCancel={feedbackModal.showCancel}
        confirmText={feedbackModal.confirmText}
      />
    </View>
  )
}
