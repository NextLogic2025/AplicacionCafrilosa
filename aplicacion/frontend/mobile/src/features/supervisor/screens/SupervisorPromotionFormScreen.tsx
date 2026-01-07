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

                // Hydrate Names (Backend might not return relations)
                const hydratedProducts = rawProducts.map(rp => ({
                    ...rp,
                    producto: rp.producto || prods.find(p => p.id === rp.producto_id)
                }))

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
                    PromotionService.addProduct(newCamp.id, p.producto_id, 0)
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
                if (promoProducts.some(p => p.producto_id === item.id)) return;
                const newP: any = { producto_id: item.id, producto: item, precio_oferta_fijo: 0 }
                if (campaign) await PromotionService.addProduct(campaign.id, item.id, 0)
                setPromoProducts([...promoProducts, newP])
            } else {
                if (promoClients.some(c => c.cliente_id === item.id)) return;
                const newC: any = { cliente_id: item.id, cliente: item }
                if (campaign) await PromotionService.addClient(campaign.id, item.id)
                setPromoClients([...promoClients, newC])
            }
            setPickerType('none')
            setSearchText('')
        } catch (error) {
            console.error(error)
            showModal('error', 'Error', 'No se pudo agregar el item')
        }
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

            <View className="flex-row gap-4 mt-4">
                <View className="flex-1">
                    <Text className="text-gray-800 font-bold mb-1 text-sm">Inicio</Text>
                    <TouchableOpacity
                        onPress={() => openDatePicker('start')}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex-row items-center justify-between"
                    >
                        <Text className="text-gray-800">{fechaInicio}</Text>
                        <Ionicons name="calendar-outline" size={20} color={BRAND_COLORS.red} />
                    </TouchableOpacity>
                </View>
                <View className="flex-1">
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
                <View className="flex-row h-12 gap-2">
                    <View className="flex-1 flex-row bg-gray-100 rounded-lg p-1">
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

            <View className="flex-row gap-2 mb-4">
                {[
                    { id: 'GLOBAL', icon: 'globe', label: 'Global' },
                    { id: 'POR_LISTA', icon: 'list', label: 'Por Lista' },
                    { id: 'POR_CLIENTE', icon: 'people', label: 'Por Cliente' }
                ].map(opt => (
                    <TouchableOpacity
                        key={opt.id}
                        onPress={() => setAlcance(opt.id as any)}
                        className={`flex-1 p-3 rounded-xl items-center border ${alcance === opt.id ? 'bg-red-50 border-red-500' : 'bg-white border-gray-200'}`}
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
                    <View className="flex-row justify-between items-center mb-2 mt-2">
                        <Text className="text-xs font-bold text-gray-400">Clientes Seleccionados ({promoClients.length})</Text>
                        <TouchableOpacity
                            onPress={() => setPickerType('clients')}
                            className="bg-red-100 px-3 py-1 rounded-full"
                        >
                            <Text className="text-red-600 text-xs font-bold">+ Agregar Cliente</Text>
                        </TouchableOpacity>
                    </View>

                    {promoClients.length === 0 && (
                        <Text className="text-gray-400 text-xs text-center italic py-2">Ningún cliente seleccionado aún.</Text>
                    )}

                    {promoClients.map(c => (
                        <View key={c.cliente_id} className="flex-row justify-between items-center py-2 border-b border-gray-50">
                            {/* @ts-ignore */}
                            <Text className="text-sm text-gray-700 font-medium flex-1">{c.cliente?.razon_social || `ID: ${c.cliente_id}`}</Text>
                            <TouchableOpacity onPress={() => removeItem(c.cliente_id, 'client')}>
                                <Ionicons name="trash" size={16} color="red" />
                            </TouchableOpacity>
                        </View>
                    ))}

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
                    promoProducts.map(p => (
                        <View key={p.producto_id} className="flex-row items-center py-3 border-b border-gray-50">
                            <View className="h-10 w-10 bg-gray-100 rounded-lg items-center justify-center mr-3">
                                <Ionicons name="cube" size={20} color="gray" />
                            </View>
                            <View className="flex-1">
                                {/* @ts-ignore */}
                                <Text className="font-bold text-gray-800">{p.producto?.nombre}</Text>
                                {/* @ts-ignore */}
                                <Text className="text-xs text-gray-400">{p.producto?.codigo_sku}</Text>
                            </View>
                            <TouchableOpacity onPress={() => removeItem(p.producto_id, 'product')} className="p-2">
                                <Ionicons name="close-circle" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ))
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
            const label = isClient ? i.razon_social : i.nombre;
            return (label || '').toLowerCase().includes(searchText.toLowerCase())
        })

        return (
            <View className="flex-1 bg-white">
                <View className="pt-12 px-4 pb-4 border-b border-gray-100 flex-row items-center gap-3 bg-white">
                    <TouchableOpacity onPress={() => setPickerType('none')}>
                        <Ionicons name="close" size={28} color="black" />
                    </TouchableOpacity>
                    <TextInput
                        className="flex-1 bg-gray-100 rounded-full px-4 h-10 text-base"
                        placeholder={isClient ? "Buscar Cliente..." : "Buscar Producto..."}
                        value={searchText}
                        onChangeText={setSearchText}
                        autoFocus
                    />
                </View>
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    {filtered.map(item => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => addItem(item)}
                            className="py-4 border-b border-gray-100"
                        >
                            <Text className="font-bold text-gray-800 text-base">{isClient ? item.razon_social : item.nombre}</Text>
                            <Text className="text-sm text-gray-500">{isClient ? item.identificacion : item.codigo_sku}</Text>
                        </TouchableOpacity>
                    ))}
                    {filtered.length === 0 && (
                        <Text className="text-center text-gray-400 mt-10">No se encontraron resultados</Text>
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
                <View className="mt-4 mb-10 mx-4 gap-3">
                    <TouchableOpacity
                        onPress={handleSave}
                        className="bg-red-600 py-4 rounded-xl shadow-lg items-center"
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