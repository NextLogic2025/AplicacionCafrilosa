
import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { GenericModal } from '../../../components/ui/GenericModal'
import { FeedbackModal, FeedbackType } from '../../../components/ui/FeedbackModal'
import { CatalogService, Category } from '../../../services/api/CatalogService'
import { PriceService, PriceList } from '../../../services/api/PriceService'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import type { RootStackParamList } from '../../../navigation/types'

type ProductFormRouteProp = RouteProp<RootStackParamList, 'SupervisorProductForm'>

export function SupervisorProductFormScreen() {
    const navigation = useNavigation()
    const route = useRoute<ProductFormRouteProp>()
    const params = route.params || {}
    const isEditing = !!params.product

    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [categoryModalVisible, setCategoryModalVisible] = useState(false)
    const [selectedCategoryName, setSelectedCategoryName] = useState('')

    // Price Management State
    const [priceLists, setPriceLists] = useState<PriceList[]>([])
    const [priceValues, setPriceValues] = useState<Record<number, string>>({})

    // Feedback State
    const [feedbackVisible, setFeedbackVisible] = useState(false)
    const [feedbackConfig, setFeedbackConfig] = useState<{
        type: FeedbackType
        title: string
        message: string
        onConfirm?: () => void
        showCancel?: boolean
    }>({
        type: 'info',
        title: '',
        message: ''
    })

    const [form, setForm] = useState({
        nombre: '',
        sku: '',
        description: '',
        categoryId: 0,
        unit: 'UNIDAD',
        weight: '',
        volume: '',
        imageUrl: '',
        requiresCold: false,
        active: true
    })

    useFocusEffect(
        useCallback(() => {
            loadData()
        }, [])
    )

    useEffect(() => {
        if (isEditing && params.product) {
            const p = params.product
            setForm({
                nombre: p.nombre,
                sku: p.codigo_sku,
                description: p.descripcion || '',
                categoryId: p.categoria_id || p.categoria?.id || 0,
                unit: p.unidad_medida || 'UNIDAD',
                weight: p.peso_unitario_kg?.toString() || '',
                volume: p.volumen_m3?.toString() || '',
                imageUrl: p.imagen_url || '',
                requiresCold: p.requiere_frio,
                active: p.activo
            })
            // Load existing prices separately if needed, or include in loadData
            loadExistingPrices(p.id)
        }
    }, [isEditing, params.product])

    useEffect(() => {
        if (categories.length > 0 && form.categoryId) {
            const cat = categories.find(c => c.id === form.categoryId)
            if (cat) setSelectedCategoryName(cat.nombre)
        }
    }, [categories, form.categoryId])

    const loadData = async () => {
        try {
            const [cats, lists] = await Promise.all([
                CatalogService.getCategories(),
                PriceService.getLists()
            ])
            setCategories(cats)

            // Sort: General first, then others alphabetically
            const activeLists = lists.filter(l => l.activa).sort((a, b) => {
                const isAGen = a.nombre.toLowerCase().includes('general')
                const isBGen = b.nombre.toLowerCase().includes('general')
                if (isAGen && !isBGen) return -1
                if (!isAGen && isBGen) return 1
                return a.nombre.localeCompare(b.nombre)
            })
            setPriceLists(activeLists)

            if (isEditing && params.product) {
                const p = params.product
                setForm({
                    nombre: p.nombre,
                    sku: p.codigo_sku,
                    description: p.descripcion || '',
                    categoryId: p.categoria_id || p.categoria?.id || 0,
                    unit: p.unidad_medida || 'UNIDAD',
                    weight: p.peso_unitario_kg?.toString() || '',
                    volume: p.volumen_m3?.toString() || '',
                    imageUrl: p.imagen_url || '',
                    requiresCold: p.requiere_frio,
                    active: p.activo
                })

                // Load existing prices
                loadExistingPrices(p.id)
            }
        } catch (error) {
            console.error('Failed to load initial data', error)
        }
    }

    const loadExistingPrices = async (productId: string) => {
        try {
            const prices = await PriceService.getByProduct(productId)
            const map: Record<number, string> = {}
            prices.forEach((p: any) => {
                if (p.lista_id) {
                    map[p.lista_id] = p.precio.toString()
                }
            })
            setPriceValues(map)
        } catch (error) {
            console.warn('Could not load prices for product', error)
        }
    }

    const showFeedback = (type: FeedbackType, title: string, message: string, onConfirm?: () => void, showCancel = false) => {
        setFeedbackConfig({ type, title, message, onConfirm, showCancel })
        setFeedbackVisible(true)
    }

    const handleConfirmDeletePrice = (list: PriceList) => {
        if (!params.product?.id) {
            // Only local state clear if product not created yet
            const newPrices = { ...priceValues }
            delete newPrices[list.id]
            setPriceValues(newPrices)
            return
        }

        showFeedback(
            'warning',
            'Eliminar Precio',
            `¿Deseas eliminar el precio de la lista "${list.nombre}"? Se borrará de la base de datos.`,
            async () => {
                try {
                    setLoading(true)
                    await PriceService.deletePrice(params.product!.id, list.id)

                    const newPrices = { ...priceValues }
                    delete newPrices[list.id]
                    setPriceValues(newPrices)

                    showFeedback('success', 'Eliminado', 'Precio eliminado correctamente.')
                } catch (error) {
                    showFeedback('error', 'Error', 'No se pudo eliminar el precio.')
                } finally {
                    setLoading(false)
                }
            },
            true
        )
    }

    const handlePriceChange = (listId: number, text: string) => {
        // Validate numeric input
        if (/^\d*\.?\d*$/.test(text)) {
            setPriceValues(prev => ({ ...prev, [listId]: text }))
        }
    }

    const handleSave = async () => {
        if (!form.nombre.trim() || !form.sku.trim()) {
            showFeedback('warning', 'Campos Requeridos', 'El nombre y el SKU son obligatorios.')
            return
        }

        if (!form.categoryId) {
            showFeedback('warning', 'Campo Requerido', 'Debes seleccionar una categoría.')
            return
        }

        const weightVal = parseFloat(form.weight)
        if (isNaN(weightVal) || weightVal <= 0) {
            showFeedback('warning', 'Valor Inválido', 'El peso debe ser mayor a 0.')
            return
        }

        setLoading(true)
        try {
            const productData = {
                codigo_sku: form.sku,
                nombre: form.nombre,
                descripcion: form.description,
                categoria_id: form.categoryId,
                peso_unitario_kg: parseFloat(form.weight) || 0,
                volumen_m3: parseFloat(form.volume) || 0,
                unidad_medida: form.unit,
                requiere_frio: form.requiresCold,
                activo: form.active, // CatalogService uses 'activo' (product)
                imagen_url: form.imageUrl,
            }

            let productId = params.product?.id

            if (isEditing && productId) {
                await CatalogService.updateProduct(productId, productData)
                showFeedback('success', 'Producto Actualizado', 'Los cambios se guardaron correctamente.')
            } else {
                const newProduct = await CatalogService.createProduct(productData)
                productId = newProduct.id // Backend returns string UUID
                showFeedback('success', 'Producto Creado', 'El nuevo producto se agregó al catálogo.')
            }

            // Save Prices
            if (productId) {
                // Filter only active lists
                const activeLists = priceLists.filter(l => l.activa)

                const pricePromises = activeLists.map(list => {
                    const val = priceValues[list.id]
                    if (val && parseFloat(val) >= 0) {
                        return PriceService.assignPrice({
                            productoId: productId!,
                            listaId: list.id,
                            precio: parseFloat(val)
                        })
                    }
                    return Promise.resolve()
                })

                await Promise.all(pricePromises)
            }

            showFeedback('success', 'Éxito', isEditing ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.', () => {
                navigation.goBack()
            })

        } catch (error: any) {
            if (error?.message !== 'SESSION_EXPIRED') {
                showFeedback('error', 'Error', 'No se pudo guardar el producto. Verifica tu conexión.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title={isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView className="flex-1 px-5 pt-6 pb-20">
                {/* 1. Información Principal */}
                <View className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 mb-6">
                    <Text className="text-neutral-900 font-bold text-lg mb-4">Información Principal</Text>

                    <View className="mb-4">
                        <Text className="text-neutral-500 font-medium mb-1.5">Nombre del Producto</Text>
                        <TextInput
                            className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900"
                            placeholder="Ej. Leche Entera 1L"
                            value={form.nombre}
                            onChangeText={t => setForm({ ...form, nombre: t })}
                            maxLength={150}
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-neutral-500 font-medium mb-1.5">Descripción</Text>
                        <TextInput
                            className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 h-24"
                            placeholder="Descripción detallada del producto..."
                            multiline
                            textAlignVertical="top"
                            value={form.description}
                            onChangeText={t => setForm({ ...form, description: t })}
                        />
                    </View>

                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <Text className="text-neutral-500 font-medium mb-1.5">Código SKU</Text>
                            <TextInput
                                className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900"
                                placeholder="Ej. LEC-001"
                                value={form.sku}
                                onChangeText={t => setForm({ ...form, sku: t })}
                                maxLength={50}
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-neutral-500 font-medium mb-1.5">Categoría</Text>
                            <TouchableOpacity
                                className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex-row justify-between items-center"
                                onPress={() => setCategoryModalVisible(true)}
                            >
                                <Text className={selectedCategoryName ? "text-neutral-900" : "text-neutral-400"} numberOfLines={1}>
                                    {selectedCategoryName || 'Seleccionar'}
                                </Text>
                                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="mb-2">
                        <Text className="text-neutral-500 font-medium mb-1.5">URL de Imagen</Text>
                        <TextInput
                            className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900"
                            placeholder="https://ejemplo.com/imagen.jpg"
                            value={form.imageUrl}
                            onChangeText={t => setForm({ ...form, imageUrl: t })}
                            autoCapitalize="none"
                        />
                    </View>
                </View>

                {/* 2. Detalles Logísticos */}
                <View className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 mb-6">
                    <Text className="text-neutral-900 font-bold text-lg mb-4">Detalles Logísticos</Text>

                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <Text className="text-neutral-500 font-medium mb-1.5">Cant. / U. Medida</Text>
                            <TextInput
                                className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900"
                                placeholder="Ej. UNIDAD, KG"
                                value={form.unit}
                                onChangeText={t => setForm({ ...form, unit: t })}
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-neutral-500 font-medium mb-1.5">Peso (kg)</Text>
                            <TextInput
                                className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900"
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={form.weight}
                                onChangeText={t => setForm({ ...form, weight: t })}
                            />
                        </View>
                    </View>

                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <Text className="text-neutral-500 font-medium mb-1.5">Volumen (m³)</Text>
                            <TextInput
                                className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900"
                                placeholder="0.0000"
                                keyboardType="numeric"
                                value={form.volume}
                                onChangeText={t => setForm({ ...form, volume: t })}
                            />
                        </View>
                    </View>

                    <View className="flex-row items-center justify-between bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                        <View className="flex-row items-center">
                            <Ionicons name="snow-outline" size={20} color={'#2563EB'} style={{ marginRight: 8 }} />
                            <Text className="text-neutral-700 font-medium">¿Requiere Frío?</Text>
                        </View>
                        <Switch
                            value={form.requiresCold}
                            onValueChange={v => setForm({ ...form, requiresCold: v })}
                            trackColor={{ false: "#D1D5DB", true: '#2563EB' }}
                        />
                    </View>
                </View>

                {/* 3. Estrategia de Precios */}
                <View className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 mb-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <View>
                            <Text className="text-neutral-900 font-bold text-lg">Estrategia de Precios</Text>
                            <Text className="text-neutral-500 text-xs">Define el valor para cada canal</Text>
                        </View>
                        <TouchableOpacity onPress={() => loadData()} className="bg-neutral-50 p-2 rounded-full">
                            <Ionicons name="refresh" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {priceLists.length === 0 ? (
                        <View className="items-center py-6 bg-orange-50 rounded-xl border border-orange-100">
                            <Ionicons name="pricetags-outline" size={32} color="#F97316" className="mb-2" />
                            <Text className="text-orange-800 font-medium mb-1">Sin Listas Configuradas</Text>
                            <Text className="text-orange-600 text-center px-4 text-xs mb-3">
                                No se encontraron listas de precios activas.
                            </Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('SupervisorPriceLists' as never)}
                                className="bg-white px-4 py-2 rounded-lg border border-orange-200 shadow-sm"
                            >
                                <Text className="text-orange-700 font-bold text-sm">Gestionar Listas</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="gap-3">
                            {priceLists.map((list) => {
                                const isGeneral = list.nombre.toLowerCase().includes('general')
                                const isActive = priceValues[list.id] !== undefined

                                // Dynamic Styles
                                const containerStyle = isActive
                                    ? (isGeneral ? 'bg-blue-50 border-blue-200' : 'bg-white border-green-200 shadow-sm')
                                    : 'bg-neutral-50 border-neutral-200 opacity-80'

                                const titleColor = isActive
                                    ? (isGeneral ? 'text-blue-800' : 'text-green-700')
                                    : 'text-neutral-500'

                                return (
                                    <View
                                        key={list.id}
                                        className={`p-3 rounded-xl border ${containerStyle}`}
                                    >
                                        <View className="flex-row items-center justify-between mb-2">
                                            <View className="flex-row items-center">
                                                {isGeneral && (
                                                    <Ionicons name="star" size={14} color="#2563EB" style={{ marginRight: 4 }} />
                                                )}
                                                <Text className={`font-bold ${titleColor}`}>
                                                    {list.nombre}
                                                </Text>
                                            </View>

                                            {/* Action Buttons */}
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (isActive) {
                                                        handleConfirmDeletePrice(list)
                                                    } else {
                                                        // Activate: Set empty string or '0' to enable input
                                                        setPriceValues(prev => ({ ...prev, [list.id]: '' }))
                                                    }
                                                }}
                                                className={`px-3 py-1 rounded-full border ${isActive
                                                    ? 'bg-red-50 border-red-100'
                                                    : 'bg-neutral-200 border-neutral-300'}`}
                                            >
                                                <Text className={`text-xs font-bold ${isActive ? 'text-red-600' : 'text-neutral-600'}`}>
                                                    {isActive ? 'Desactivar' : 'Activar'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        {isActive ? (
                                            <View className="flex-row items-center bg-white border border-neutral-200 rounded-xl px-3 h-12">
                                                <Text className="text-neutral-400 mr-2 text-lg">$</Text>
                                                <TextInput
                                                    className="flex-1 text-neutral-900 font-bold text-lg text-right"
                                                    placeholder="0.00"
                                                    placeholderTextColor="#D1D5DB"
                                                    keyboardType="numeric"
                                                    value={priceValues[list.id]}
                                                    onChangeText={(text) => handlePriceChange(list.id, text)}
                                                    selectTextOnFocus
                                                />
                                            </View>
                                        ) : (
                                            <View className="h-10 justify-center">
                                                <Text className="text-xs text-neutral-400 italic text-center">
                                                    Precio inactivo. Pulse activar para asignar.
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )
                            })}
                        </View>
                    )}
                </View>

                {/* 4. Estado */}
                <View className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 mb-8">
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-neutral-900 font-bold text-lg">Estado del Producto</Text>
                            <Text className="text-neutral-500 text-xs">Visible para ventas cuando está activo</Text>
                        </View>
                        <Switch
                            value={form.active}
                            onValueChange={v => setForm({ ...form, active: v })}
                            trackColor={{ false: "#D1D5DB", true: "#16A34A" }}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    className="bg-brand-red p-4 rounded-xl items-center shadow-lg shadow-red-500/30 mb-8"
                    onPress={handleSave}
                    disabled={loading}
                    style={{ backgroundColor: '#EF4444' }}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">
                            {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
                        </Text>
                    )}
                </TouchableOpacity>

            </ScrollView>

            <GenericModal
                visible={categoryModalVisible}
                onClose={() => setCategoryModalVisible(false)}
                title="Seleccionar Categoría"
                height="70%"
            >
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        className="p-4 border-b border-neutral-100 flex-row items-center justify-between bg-neutral-50 rounded-xl mb-2"
                        onPress={() => {
                            setForm({ ...form, categoryId: cat.id })
                            setSelectedCategoryName(cat.nombre)
                            setCategoryModalVisible(false)
                        }}
                    >
                        <View>
                            <Text className="text-base font-semibold text-neutral-800">{cat.nombre}</Text>
                            {cat.descripcion ? <Text className="text-sm text-neutral-500">{cat.descripcion}</Text> : null}
                        </View>
                        {form.categoryId === cat.id && (
                            <Ionicons name="checkmark-circle" size={24} color={'#2563EB'} />
                        )}
                    </TouchableOpacity>
                ))}
                {categories.length === 0 && (
                    <View className="items-center py-10">
                        <Text className="text-neutral-400">No hay categorías disponibles</Text>
                    </View>
                )}
            </GenericModal>

            {/* Feedback Modal */}
            <FeedbackModal
                visible={feedbackVisible}
                type={feedbackConfig.type}
                title={feedbackConfig.title}
                message={feedbackConfig.message}
                onClose={() => setFeedbackVisible(false)}
                onConfirm={feedbackConfig.onConfirm}
                showCancel={feedbackConfig.showCancel}
            />
        </View>
    )
}

