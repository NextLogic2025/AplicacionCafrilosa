import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Switch } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { PromotionService, PromotionCampaign, PromotionProduct, PromotionClient } from '../../../services/api/PromotionService'
import { CatalogService, Product } from '../../../services/api/CatalogService'
import { ClientService, Client } from '../../../services/api/ClientService'
import { PriceService, PriceList } from '../../../services/api/PriceService'
import { Header } from '../../../components/ui/Header'
import { FeedbackModal, FeedbackType } from '../../../components/ui/FeedbackModal'
import { ProductPriceDisplay } from '../../../components/ui/ProductPriceDisplay'

export function SupervisorPromotionFormScreen(props: any) {
    const { navigation, route } = props
    const campaign = route.params?.campaign as PromotionCampaign | undefined
    const isEditing = !!campaign

    // --- Loading State ---
    const [loading, setLoading] = useState(false)
    const [initializing, setInitializing] = useState(true)

    // --- Form State ---
    const [nombre, setNombre] = useState(campaign?.nombre || '')
    const [fechaInicio, setFechaInicio] = useState(campaign?.fecha_inicio ? new Date(campaign.fecha_inicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
    const [fechaFin, setFechaFin] = useState(campaign?.fecha_fin ? new Date(campaign.fecha_fin).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
    const [tipoDescuento, setTipoDescuento] = useState<'PORCENTAJE' | 'MONTO_FIJO'>(campaign?.tipo_descuento || 'PORCENTAJE')
    const [valorDescuento, setValorDescuento] = useState(campaign?.valor_descuento?.toString() || '')
    const [alcance, setAlcance] = useState<'GLOBAL' | 'POR_LISTA' | 'POR_CLIENTE'>(campaign?.alcance || 'GLOBAL')
    const [listaId, setListaId] = useState<number | undefined>(campaign?.lista_precios_objetivo_id || undefined)
    const [activo, setActivo] = useState(campaign?.activo ?? true)
    const [imagenBanner, setImagenBanner] = useState(campaign?.imagen_banner_url || '')

    // --- Date Picker State ---
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [dateTarget, setDateTarget] = useState<'start' | 'end'>('start')

    // --- Lists Data ---
    const [promoProducts, setPromoProducts] = useState<PromotionProduct[]>([])
    const [promoClients, setPromoClients] = useState<PromotionClient[]>([])

    // --- Data Sources ---
    const [availableProducts, setAvailableProducts] = useState<Product[]>([])
    const [availableClients, setAvailableClients] = useState<Client[]>([])
    const [priceLists, setPriceLists] = useState<PriceList[]>([])

    // --- Picker UI State ---
    const [pickerType, setPickerType] = useState<'none' | 'products' | 'clients'>('none')
    const [searchText, setSearchText] = useState('')

    // --- Collapse State para productos ---
    const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({})

    // --- Modal State ---
    const [feedbackModal, setFeedbackModal] = useState<{
        visible: boolean
        type: FeedbackType
        title: string
        message: string
        onConfirm?: () => void
        showCancel?: boolean
        confirmText?: string
    }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    })

    const showModal = (
        type: FeedbackType,
        title: string,
        message: string,
        onConfirm?: () => void,
        showCancel: boolean = false,
        confirmText: string = 'Entendido'
    ) => {
        setFeedbackModal({ visible: true, type, title, message, onConfirm, showCancel, confirmText })
    }

    const closeModal = () => {
        setFeedbackModal(prev => ({ ...prev, visible: false }))
    }

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setInitializing(true)
            const [lists, prods, clis] = await Promise.all([
                PriceService.getLists(),
                CatalogService.getProducts(),
                ClientService.getClients()
            ])

            setPriceLists(lists)
            setAvailableProducts(prods)
            setAvailableClients(clis)

            if (isEditing && campaign) {
                const [rawProducts, rawClients] = await Promise.all([
                    PromotionService.getProducts(campaign.id),
                    PromotionService.getClients(campaign.id)
                ])

                // El backend ya retorna los productos con precios desde PromotionService.getProducts
                // Solo necesitamos asegurarnos de que los productos tengan la información completa
                const hydratedProducts = rawProducts.map(rp => {
                    // rp.producto ya viene del backend con precios incluidos
                    return rp
                })

                const hydratedClients = rawClients.map(rc => ({
                    ...rc,
                    cliente: rc.cliente || clis.find(c => c.id === rc.cliente_id)
                }))

                setPromoProducts(hydratedProducts)
                setPromoClients(hydratedClients)
            }
        } catch (e) {
            console.error(e)
            showModal('error', 'Error', 'No se pudieron cargar los datos')
        } finally {
            setInitializing(false)
        }
    }

    // --- Handlers ---

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false)
        if (selectedDate) {
            const dateStr = selectedDate.toISOString().split('T')[0]
            if (dateTarget === 'start') {
                setFechaInicio(dateStr)
            } else {
                setFechaFin(dateStr)
            }
        }
    }

    const openDatePicker = (target: 'start' | 'end') => {
        setDateTarget(target)
        setShowDatePicker(true)
    }

    const handleSave = async () => {
        // Validation
        if (!nombre.trim()) return showModal('warning', 'Faltan datos', 'El nombre es obligatorio')
        if (!valorDescuento || isNaN(Number(valorDescuento)) || Number(valorDescuento) <= 0) return showModal('warning', 'Error', 'Valor de descuento inválido')
        if (alcance === 'POR_LISTA' && !listaId) return showModal('warning', 'Faltan datos', 'Selecciona una lista de precios')

        setLoading(true)
        try {
            const payload: Partial<PromotionCampaign> = {
                nombre,
                descripcion: 'Gestión Móvil',
                fecha_inicio: new Date(fechaInicio).toISOString(),
                fecha_fin: new Date(fechaFin).toISOString(),
                tipo_descuento: tipoDescuento,
                valor_descuento: Number(valorDescuento),
                alcance,
                lista_precios_objetivo_id: alcance === 'POR_LISTA' ? listaId : null,
                activo,
                imagen_banner_url: imagenBanner
            }

            // Clean up unrelated fields based on scope logic
            if (alcance !== 'POR_LISTA') payload.lista_precios_objetivo_id = null;

            let savedId = campaign?.id
            if (isEditing && campaign) {
                await PromotionService.updateCampaign(campaign.id, payload)
                savedId = campaign.id
            } else {
                const newCamp = await PromotionService.createCampaign(payload)
                savedId = newCamp.id

                // Save deferred items (Products & Clients) in parallel
                const productPromises = promoProducts.map(p =>
                    PromotionService.addProduct(newCamp.id, p.producto_id, null)
                )
                const clientPromises = promoClients.map(c =>
                    PromotionService.addClient(newCamp.id, c.cliente_id)
                )

                await Promise.all([...productPromises, ...clientPromises])
            }

            showModal(
                'success',
                'Éxito',
                isEditing ? 'Campaña actualizada correctamente' : 'Campaña creada correctamente',
                () => navigation.goBack()
            )

        } catch (error) {
            console.error(error)
            showModal('error', 'Error', 'No se pudo guardar la campaña')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!campaign) return

        showModal(
            'warning',
            'Eliminar Campaña',
            '¿Estás seguro de que deseas eliminar esta campaña? Esta acción no se puede deshacer.',
            async () => {
                closeModal() // Close confirmation modal
                setLoading(true)
                try {
                    await PromotionService.deleteCampaign(campaign.id)
                    // Show success modal after delete
                    // Use setTimeout to allow modal transition if needed, but here simple state switch usually works
                    // Wait a tick ensures setFeedbackModal defaults aren't overwritten immediately by closeModal
                    setTimeout(() => {
                        showModal(
                            'success',
                            'Éxito',
                            'Campaña eliminada correctamente',
                            () => navigation.goBack()
                        )
                    }, 300)

                } catch (error) {
                    console.error(error)
                    showModal('error', 'Error', 'No se pudo eliminar la campaña')
                } finally {
                    setLoading(false)
                }
            },
            true, // showCancel
            'Eliminar' // confirmText
        )
    }


    const addItem = async (item: any) => {
        try {
            if (pickerType === 'products') {
                if (promoProducts.some(p => p.producto_id === item.id)) return

                // Buscar el producto en availableProducts que ya tiene los precios cargados
                const productoCompleto = availableProducts.find(p => p.id === item.id)

                const newP: any = {
                    producto_id: item.id,
                    producto: productoCompleto || item,
                    precio_oferta_fijo: null,
                    campania_id: campaign?.id || 0
                }

                // Por defecto, expandir el producto recién agregado
                setExpandedProducts(prev => ({ ...prev, [item.id]: true }))

                if (campaign) {
                    await PromotionService.addProduct(campaign.id, item.id, null)
                }

                setPromoProducts([...promoProducts, newP])
            } else {
                if (promoClients.some(c => c.cliente_id === item.id)) return
                const newC: any = {
                    cliente_id: item.id,
                    cliente: item,
                    campania_id: campaign?.id || 0
                }
                if (campaign) {
                    await PromotionService.addClient(campaign.id, item.id)
                }
                setPromoClients([...promoClients, newC])
            }
            setPickerType('none')
            setSearchText('')
        } catch (error) {
            console.error(error)
            showModal('error', 'Error', 'No se pudo agregar el item')
        }
    }

    const toggleProductExpansion = (productId: string) => {
        setExpandedProducts(prev => ({
            ...prev,
            [productId]: !prev[productId]
        }))
    }

    const removeItem = async (id: string, type: 'product' | 'client') => {
        try {
            if (type === 'product') {
                if (campaign) await PromotionService.removeProduct(campaign.id, id)
                setPromoProducts(promoProducts.filter(p => p.producto_id !== id))
            } else {
                if (campaign) await PromotionService.removeClient(campaign.id, id)
                setPromoClients(promoClients.filter(c => c.cliente_id !== id))
            }
        } catch (error) {
            showModal('error', 'Error', 'No se pudo eliminar')
        }
    }

    // --- Render Components ---

    const renderInputSection = () => (
        <View className="bg-white mx-4 mt-4 p-4 rounded-xl shadow-sm border border-gray-100">
            <Text className="text-gray-500 font-bold text-xs mb-1 uppercase tracking-wider">Información Básica</Text>

            <Text className="text-gray-800 font-bold mt-2 mb-1 text-sm">Nombre</Text>
            <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800"
                value={nombre}
                onChangeText={setNombre}
                placeholder="Ej. Descuento Verano"
            />

            <View className="flex-row mt-4">
                <View className="flex-1 mr-2">
                    <Text className="text-gray-800 font-bold mb-1 text-sm">Inicio</Text>
                    <TouchableOpacity
                        onPress={() => openDatePicker('start')}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex-row items-center justify-between"
                    >
                        <Text className="text-gray-800">{fechaInicio}</Text>
                        <Ionicons name="calendar-outline" size={20} color={BRAND_COLORS.red} />
                    </TouchableOpacity>
                </View>
                <View className="flex-1 ml-2">
                    <Text className="text-gray-800 font-bold mb-1 text-sm">Fin</Text>
                    <TouchableOpacity
                        onPress={() => openDatePicker('end')}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex-row items-center justify-between"
                    >
                        <Text className="text-gray-800">{fechaFin}</Text>
                        <Ionicons name="calendar-outline" size={20} color={BRAND_COLORS.red} />
                    </TouchableOpacity>
                </View>
            </View>

            <View className="mt-4">
                <Text className="text-gray-800 font-bold mb-1 text-sm">Descuento</Text>
                <View className="flex-row h-12">
                    <View className="flex-1 flex-row bg-gray-100 rounded-lg p-1 mr-2">
                        <TouchableOpacity
                            onPress={() => setTipoDescuento('PORCENTAJE')}
                            style={{ flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 6, backgroundColor: tipoDescuento === 'PORCENTAJE' ? 'white' : 'transparent' }}
                        >
                            <Text className={`font-bold ${tipoDescuento === 'PORCENTAJE' ? 'text-red-600' : 'text-gray-500'}`}>%</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setTipoDescuento('MONTO_FIJO')}
                            style={{ flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 6, backgroundColor: tipoDescuento === 'MONTO_FIJO' ? 'white' : 'transparent' }}
                        >
                            <Text className={`font-bold ${tipoDescuento === 'MONTO_FIJO' ? 'text-red-600' : 'text-gray-500'}`}>$</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        className="flex-1 bg-white border border-gray-200 rounded-lg px-4 text-right font-bold text-lg text-red-600"
                        value={valorDescuento}
                        onChangeText={setValorDescuento}
                        keyboardType="numeric"
                        placeholder="0"
                    />
                </View>
            </View>

            <View className="mt-4">
                <Text className="text-gray-800 font-bold mb-1 text-sm">URL Banner (Opcional)</Text>
                <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800"
                    value={imagenBanner}
                    onChangeText={setImagenBanner}
                    placeholder="https://..."
                />
            </View>

            <View className="flex-row justify-between items-center mt-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <View>
                    <Text className="text-gray-900 font-bold text-base">Estado de la Campaña</Text>
                    <Text className="text-gray-500 text-xs">Visible cuando está activa</Text>
                </View>
                <Switch
                    trackColor={{ false: '#767577', true: '#bbf7d0' }}
                    thumbColor={activo ? '#16a34a' : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={setActivo}
                    value={activo}
                />
            </View>
        </View>
    )

    const renderScopeSection = () => (
        <View className="bg-white mx-4 mt-4 p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <Text className="text-gray-500 font-bold text-xs mb-3 uppercase tracking-wider">Alcance de la Promoción</Text>

            <View className="flex-row mb-4">
                {[
                    { id: 'GLOBAL', icon: 'globe', label: 'Global' },
                    { id: 'POR_LISTA', icon: 'list', label: 'Por Lista' },
                    { id: 'POR_CLIENTE', icon: 'people', label: 'Por Cliente' }
                ].map((opt, idx) => (
                    <TouchableOpacity
                        key={opt.id}
                        onPress={() => setAlcance(opt.id as any)}
                        className={`flex-1 p-3 rounded-xl items-center border ${idx !== 0 ? 'ml-2' : ''} ${alcance === opt.id ? 'bg-red-50 border-red-500' : 'bg-white border-gray-200'}`}
                    >
                        <Ionicons name={opt.icon as any} size={20} color={alcance === opt.id ? BRAND_COLORS.red : '#9CA3AF'} />
                        <Text className={`text-[10px] font-bold mt-1 ${alcance === opt.id ? 'text-red-600' : 'text-gray-400'}`}>{opt.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Scope I: GLOBAL */}
            {alcance === 'GLOBAL' && (
                <View style={{ height: 10 }} />
            )}

            {/* Scope II: POR LISTA */}
            {alcance === 'POR_LISTA' && (
                <View>
                    <Text className="text-xs font-bold text-gray-400 mb-2">Selecciona Lista de Precios:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {priceLists.map(l => (
                            <TouchableOpacity
                                key={l.id}
                                onPress={() => setListaId(l.id)}
                                className={`mr-2 px-4 py-2 rounded-full border ${listaId === l.id ? 'bg-teal-600 border-teal-600' : 'bg-gray-50 border-gray-200'}`}
                            >
                                <Text className={listaId === l.id ? 'text-white font-bold' : 'text-gray-600'}>{l.nombre}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                </View>
            )}

            {/* Scope III: POR CLIENTE */}
            {alcance === 'POR_CLIENTE' && (
                <View>
                    <View className="flex-row justify-between items-center mb-3 mt-2">
                        <Text className="text-xs font-bold text-neutral-600">
                            Clientes Seleccionados ({promoClients.length})
                        </Text>
                        <TouchableOpacity
                            onPress={() => setPickerType('clients')}
                            className="bg-red-600 px-4 py-2 rounded-lg flex-row items-center"
                        >
                            <Ionicons name="add" size={16} color="white" />
                            <Text className="text-white text-xs font-bold ml-1">Agregar</Text>
                        </TouchableOpacity>
                    </View>

                    {promoClients.length === 0 ? (
                        <View className="bg-neutral-50 p-6 rounded-xl items-center border border-dashed border-neutral-300">
                            <Ionicons name="people-outline" size={40} color="#9CA3AF" />
                            <Text className="text-neutral-500 text-sm text-center mt-2">
                                No hay clientes seleccionados
                            </Text>
                            <Text className="text-neutral-400 text-xs text-center mt-1">
                                Toca "Agregar" para seleccionar clientes
                            </Text>
                        </View>
                    ) : (
                        <View>
                            {promoClients.map(c => (
                                <View
                                    key={c.cliente_id}
                                    className="bg-white rounded-lg p-3 border border-neutral-100 flex-row items-center mb-2"
                                >
                                    {/* Icono */}
                                    <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                                        <Ionicons name="person" size={20} color="#3B82F6" />
                                    </View>

                                    {/* Información */}
                                    <View className="flex-1">
                                        <Text className="text-sm text-neutral-900 font-semibold">
                                            {c.cliente?.razon_social || c.cliente?.nombre || `ID: ${c.cliente_id}`}
                                        </Text>
                                        {c.cliente?.identificacion && (
                                            <Text className="text-xs text-neutral-500 mt-0.5">
                                                {c.cliente.identificacion}
                                            </Text>
                                        )}
                                    </View>

                                    {/* Botón eliminar */}
                                    <TouchableOpacity
                                        onPress={() => removeItem(c.cliente_id, 'client')}
                                        className="w-8 h-8 rounded-full bg-red-100 items-center justify-center"
                                    >
                                        <Ionicons name="close" size={18} color="#DC2626" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}
        </View>
    )

    const renderProductsSection = () => {
        return (
            <View className="bg-white mx-4 mt-0 mb-8 p-4 rounded-xl shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-gray-500 font-bold text-xs uppercase tracking-wider">Productos en Promoción</Text>
                    <TouchableOpacity
                        onPress={() => setPickerType('products')}
                        className="bg-red-600 px-3 py-1.5 rounded-full flex-row items-center"
                    >
                        <Ionicons name="add" color="white" size={16} />
                        <Text className="text-white text-xs font-bold ml-1">Agregar</Text>
                    </TouchableOpacity>
                </View>

                {promoProducts.length === 0 ? (
                    <Text className="text-gray-400 text-sm text-center italic py-4">No hay productos seleccionados.</Text>
                ) : (
                    promoProducts.map(p => {
                        // @ts-ignore
                        const producto = p.producto as Product
                        const isExpanded = expandedProducts[p.producto_id] ?? false
                        const hasPrices = producto && producto.precios && producto.precios.length > 0

                        return (
                            <View key={p.producto_id} className="mb-4 pb-4 border-b border-gray-100">
                                {/* Header del producto - Clickeable para expandir/contraer */}
                                <TouchableOpacity
                                    onPress={() => hasPrices && toggleProductExpansion(p.producto_id)}
                                    className="flex-row items-center mb-3"
                                    activeOpacity={hasPrices ? 0.7 : 1}
                                >
                                    <View className="h-10 w-10 bg-gray-100 rounded-lg items-center justify-center mr-3">
                                        <Ionicons name="cube" size={20} color="gray" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-bold text-gray-800">{producto?.nombre || 'Producto'}</Text>
                                        <View className="flex-row items-center">
                                            <Text className="text-xs text-gray-400">{producto?.codigo_sku || p.producto_id}</Text>
                                            {hasPrices && (
                                                <View className="flex-row items-center ml-2">
                                                    <Ionicons
                                                        name="pricetags"
                                                        size={12}
                                                        color="#10B981"
                                                    />
                                                    <Text className="text-[10px] text-green-600 ml-1">
                                                        {producto.precios.length} {producto.precios.length !== 1 ? 'listas' : 'lista'}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {/* Botón de expandir/contraer o eliminar */}
                                    <View className="flex-row items-center">
                                        {hasPrices && (
                                            <View className="bg-gray-100 rounded-full px-2 py-1 mr-2">
                                                <Ionicons
                                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                                    size={16}
                                                    color="#6B7280"
                                                />
                                            </View>
                                        )}
                                        <TouchableOpacity
                                            onPress={() => removeItem(p.producto_id, 'product')}
                                            className="p-2"
                                        >
                                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>

                                {/* Price breakdown - Mostrar precios por lista (colapsable) */}
                                {hasPrices ? (
                                    isExpanded && (
                                        <View className="ml-2">
                                            <ProductPriceDisplay
                                                precios={producto.precios}
                                                priceLists={priceLists}
                                                showAllPrices={true}
                                                precioOfertaFijo={p.precio_oferta_fijo}
                                                tipoDescuento={tipoDescuento}
                                                valorDescuento={Number(valorDescuento) || undefined}
                                            />
                                        </View>
                                    )
                                ) : (
                                    <View className="ml-2 bg-amber-50 p-4 rounded-lg border border-amber-200">
                                        <View className="flex-row items-center">
                                            <Ionicons name="warning" size={20} color="#F59E0B" />
                                            <View className="flex-1 ml-3">
                                                <Text className="text-amber-800 text-xs font-bold mb-1">
                                                    Sin precios configurados
                                                </Text>
                                                <Text className="text-amber-600 text-[10px]">
                                                    Este producto necesita precios asignados para calcular descuentos. Ve a Catálogo → Listas de Precios para configurarlos.
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )
                    })
                )}

            </View>
        )
    }

    // --- Search Picker (Full Screen Overlay) ---
    if (pickerType !== 'none') {
        const isClient = pickerType === 'clients'
        const items: any[] = isClient
            ? availableClients.filter(c => !promoClients.some(pc => pc.cliente_id === c.id))
            : availableProducts.filter(p => !promoProducts.some(pp => pp.producto_id === p.id))

        const filtered = items.filter(i => {
            const label = isClient ? (i.razon_social || i.nombre) : i.nombre
            const code = isClient ? i.identificacion : i.codigo_sku
            const searchLower = searchText.toLowerCase()
            return (label || '').toLowerCase().includes(searchLower) ||
                   (code || '').toLowerCase().includes(searchLower)
        })

        return (
            <View className="flex-1 bg-neutral-50">
                {/* Header mejorado */}
                <View className="pt-12 px-4 pb-4 bg-white border-b border-neutral-200 shadow-sm">
                    <View className="flex-row items-center mb-3">
                        <TouchableOpacity
                            onPress={() => {
                                setPickerType('none')
                                setSearchText('')
                            }}
                            className="w-10 h-10 items-center justify-center rounded-full bg-neutral-100 mr-3"
                        >
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text className="flex-1 text-lg font-bold text-neutral-900">
                            {isClient ? 'Seleccionar Cliente' : 'Seleccionar Producto'}
                        </Text>
                    </View>

                    {/* Barra de búsqueda mejorada */}
                    <View className="flex-row items-center bg-neutral-100 rounded-xl px-4 h-12">
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            className="flex-1 ml-2 text-base text-neutral-900"
                            placeholder={isClient ? "Buscar por nombre o identificación..." : "Buscar por nombre o SKU..."}
                            placeholderTextColor="#9CA3AF"
                            value={searchText}
                            onChangeText={setSearchText}
                            autoFocus
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchText('')}>
                                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Contador de resultados */}
                    <Text className="text-xs text-neutral-500 mt-2">
                        {`${filtered.length} ${filtered.length === 1 ? 'resultado' : 'resultados'}`}
                    </Text>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 16 }}
                >
                    {filtered.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => addItem(item)}
                            className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-neutral-100"
                            activeOpacity={0.7}
                        >
                            <View className="flex-row items-center">
                                {/* Icono */}
                                <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
                                    isClient ? 'bg-blue-100' : 'bg-purple-100'
                                }`}>
                                    <Ionicons
                                        name={isClient ? "person" : "cube"}
                                        size={24}
                                        color={isClient ? "#3B82F6" : "#9333EA"}
                                    />
                                </View>

                                {/* Información */}
                                <View className="flex-1">
                                    <Text className="font-bold text-neutral-900 text-base mb-1">
                                        {isClient ? (item.razon_social || item.nombre) : item.nombre}
                                    </Text>
                                    <View className="flex-row items-center">
                                        <Ionicons name="pricetag-outline" size={12} color="#9CA3AF" />
                                        <Text className="text-sm text-neutral-500 ml-1">
                                            {isClient ? item.identificacion : item.codigo_sku}
                                        </Text>
                                    </View>
                                    {isClient && item.ciudad && (
                                        <View className="flex-row items-center mt-1">
                                            <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                                            <Text className="text-xs text-neutral-400 ml-1">{item.ciudad}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Icono de agregar */}
                                <View className="w-8 h-8 rounded-full bg-red-100 items-center justify-center">
                                    <Ionicons name="add" size={20} color="#DC2626" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}

                    {filtered.length === 0 && (
                        <View className="items-center justify-center py-12">
                            <View className="w-20 h-20 rounded-full bg-neutral-100 items-center justify-center mb-4">
                                <Ionicons name="search-outline" size={40} color="#9CA3AF" />
                            </View>
                            <Text className="text-center text-neutral-600 font-semibold text-base">
                                No se encontraron resultados
                            </Text>
                            <Text className="text-center text-neutral-400 text-sm mt-1">
                                Intenta con otros términos de búsqueda
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
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
            <Header
                title={isEditing ? 'Editar Promoción' : 'Nueva Promoción'}
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {renderInputSection()}
                {renderScopeSection()}
                {renderProductsSection()}

                {/* Buttons Container - INSIDE ScrollView */}
                <View className="mt-4 mb-10 mx-4">
                    <TouchableOpacity
                        onPress={handleSave}
                        className="bg-red-600 py-4 rounded-xl shadow-lg items-center mb-3"
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="white" /> : (
                            <Text className="text-white font-bold text-lg">{isEditing ? 'GUARDAR CAMBIOS' : 'CREAR CAMPAÑA'}</Text>
                        )}
                    </TouchableOpacity>

                    {isEditing && (
                        <TouchableOpacity
                            onPress={handleDelete}
                            className="bg-white py-4 rounded-xl shadow-sm border border-red-100 items-center"
                            disabled={loading}
                        >
                            <Text className="text-red-600 font-bold text-base">ELIMINAR CAMPAÑA</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {showDatePicker && (
                <DateTimePicker
                    value={dateTarget === 'start' ? new Date(fechaInicio) : new Date(fechaFin)}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
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