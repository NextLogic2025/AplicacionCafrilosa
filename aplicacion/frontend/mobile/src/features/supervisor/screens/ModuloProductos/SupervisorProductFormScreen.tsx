import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native'
import { RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { GenericModal } from '../../../../components/ui/GenericModal'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { CatalogService, Category } from '../../../../services/api/CatalogService'
import { PriceService, PriceList } from '../../../../services/api/PriceService'
import type { RootStackParamList } from '../../../../navigation/types'

type ProductFormRouteProp = RouteProp<RootStackParamList, 'SupervisorProductForm'>

export function SupervisorProductFormScreen({ navigation, route }: { navigation: any, route: ProductFormRouteProp }) {
    const params = route.params || {}
    const isEditing = !!params.product

    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [categoryModalVisible, setCategoryModalVisible] = useState(false)
    const [selectedCategoryName, setSelectedCategoryName] = useState('')

    const [activeLists, setActiveLists] = useState<PriceList[]>([])
    const [priceValues, setPriceValues] = useState<Record<number, string>>({})
    const [initialPriceValues, setInitialPriceValues] = useState<Record<number, string>>({})

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

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [cats, lists] = await Promise.all([
                CatalogService.getCategories(),
                PriceService.getLists()
            ])
            setCategories(cats)
            const active = lists.filter(l => l.activa).sort((a, b) => {
                const isAGen = a.nombre.toLowerCase().includes('general')
                const isBGen = b.nombre.toLowerCase().includes('general')
                if (isAGen && !isBGen) return -1
                if (!isAGen && isBGen) return 1
                return a.nombre.localeCompare(b.nombre)
            })
            setActiveLists(active)
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
                if (p.categoria?.nombre) {
                    setSelectedCategoryName(p.categoria.nombre)
                } else if (p.categoria_id) {
                    const c = cats.find(x => x.id === p.categoria_id)
                    if (c) setSelectedCategoryName(c.nombre)
                }
                loadExistingPrices(p.id)
            }
        } catch (error) {
            console.error('Failed to load initial data', error)
            showFeedback('error', 'Error de Carga', 'No se pudieron cargar los datos necesarios.')
        }
    }

    const loadExistingPrices = async (productId: string) => {
        try {
            const existingPrices = await PriceService.getByProduct(productId)
            const map: Record<number, string> = {}
            existingPrices.forEach((p: any) => {
                if (p.lista_id) {
                    map[p.lista_id] = p.precio ? p.precio.toString() : ''
                }
            })
            setPriceValues(map)
            setInitialPriceValues(map)
        } catch (error) {
            console.warn('Could not load existing prices', error)
        }
    }

    const showFeedback = useCallback((type: FeedbackType, title: string, message: string, onConfirm?: () => void, showCancel = false) => {
        setFeedbackConfig({ type, title, message, onConfirm, showCancel })
        setFeedbackVisible(true)
    }, [])

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
                peso_unitario_kg: parseFloat(form.weight),
                volumen_m3: parseFloat(form.volume) || 0,
                unidad_medida: form.unit,
                requiere_frio: form.requiresCold,
                activo: form.active,
                imagen_url: form.imageUrl,
            }
            let targetProductId = params.product?.id
            if (isEditing && targetProductId) {
                await CatalogService.updateProduct(targetProductId, productData)
            } else {
                const newProduct = await CatalogService.createProduct(productData)
                targetProductId = newProduct.id
            }
            if (targetProductId) {
                const pricePromises = activeLists.map(async (list) => {
                    const rawVal = priceValues[list.id]
                    if (rawVal && rawVal.trim() !== '') {
                        const numVal = parseFloat(rawVal)
                        if (!isNaN(numVal) && numVal >= 0) {
                            return PriceService.assignPrice({ productoId: targetProductId!, listaId: list.id, precio: numVal })
                        }
                    }
                    const hadPriceOriginally = !!initialPriceValues[list.id]
                    if (isEditing && hadPriceOriginally && (!rawVal || rawVal.trim() === '')) {
                        try {
                            await PriceService.deletePrice(targetProductId!, list.id)
                        } catch (error) {
                            console.log('Delete skipped or failed', error)
                        }
                    }
                    return Promise.resolve()
                })
                await Promise.all(pricePromises)
            }
            showFeedback('success', 'Éxito', isEditing ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.', () => navigation.goBack())
        } catch (error: any) {
            console.error('Save failed', error)
            showFeedback('error', 'Error', 'Ocurrió un error al guardar. Verifica tu conexión.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title={isEditing ? 'Editar Producto' : 'Nuevo Producto'} variant="standard" onBackPress={() => navigation.goBack()} />
            <ScrollView className="flex-1 px-5 pt-6 pb-20" keyboardShouldPersistTaps="handled">
                <View className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 mb-6">
                    <Text className="text-neutral-900 font-bold text-lg mb-4">Información Principal</Text>
                    <View className="mb-4">
                        <Text className="text-neutral-500 font-medium mb-1.5">Nombre del Producto</Text>
                        <TextInput className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900" placeholder="Ej. Leche Entera 1L" value={form.nombre} onChangeText={t => setForm({ ...form, nombre: t })} maxLength={150} />
                    </View>
                    <View className="mb-4">
                        <Text className="text-neutral-500 font-medium mb-1.5">Descripción</Text>
                        <TextInput className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 h-24" placeholder="Descripción detallada del producto..." multiline textAlignVertical="top" value={form.description} onChangeText={t => setForm({ ...form, description: t })} />
                    </View>
                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <Text className="text-neutral-500 font-medium mb-1.5">Código SKU</Text>
                            <TextInput className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900" placeholder="Ej. LEC-001" value={form.sku} onChangeText={t => setForm({ ...form, sku: t })} maxLength={50} autoCapitalize="characters" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-neutral-500 font-medium mb-1.5">Categoría</Text>
                            <TouchableOpacity className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex-row justify-between items-center" onPress={() => setCategoryModalVisible(true)}>
                                <Text className={selectedCategoryName ? "text-neutral-900" : "text-neutral-400"} numberOfLines={1}>{selectedCategoryName || 'Seleccionar'}</Text>
                                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View className="mb-2">
                        <Text className="text-neutral-500 font-medium mb-1.5">URL de Imagen</Text>
                        <TextInput className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900" placeholder="https://ejemplo.com/imagen.jpg" value={form.imageUrl} onChangeText={t => setForm({ ...form, imageUrl: t })} autoCapitalize="none" />
                    </View>
                </View>
                <View className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 mb-6">
                    <Text className="text-neutral-900 font-bold text-lg mb-4">Detalles Logísticos</Text>
                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <Text className="text-neutral-500 font-medium mb-1.5">Cant. / U. Medida</Text>
                            <TextInput className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900" placeholder="Ej. UNIDAD" value={form.unit} onChangeText={t => setForm({ ...form, unit: t })} autoCapitalize="characters" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-neutral-500 font-medium mb-1.5">Peso (kg)</Text>
                            <TextInput className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900" placeholder="0.00" keyboardType="numeric" value={form.weight} onChangeText={t => setForm({ ...form, weight: t })} />
                        </View>
                    </View>
                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <Text className="text-neutral-500 font-medium mb-1.5">Volumen (m³)</Text>
                            <TextInput className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900" placeholder="0.0000" keyboardType="numeric" value={form.volume} onChangeText={t => setForm({ ...form, volume: t })} />
                        </View>
                    </View>
                    <View className="flex-row items-center justify-between bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                        <View className="flex-row items-center"><Ionicons name="snow-outline" size={20} color={'#2563EB'} style={{ marginRight: 8 }} /><Text className="text-neutral-700 font-medium">¿Requiere Frío?</Text></View>
                        <Switch value={form.requiresCold} onValueChange={v => setForm({ ...form, requiresCold: v })} trackColor={{ false: "#D1D5DB", true: '#2563EB' }} />
                    </View>
                </View>
                <View className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 mb-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <View><Text className="text-neutral-900 font-bold text-lg">Precios por Lista</Text><Text className="text-neutral-500 text-xs">Asigna el valor para cada canal activo</Text></View>
                        <TouchableOpacity onPress={loadData} className="bg-neutral-50 p-2 rounded-full"><Ionicons name="refresh" size={20} color="#6B7280" /></TouchableOpacity>
                    </View>
                    {activeLists.length === 0 ? (
                        <View className="py-4 items-center"><Text className="text-neutral-400">No hay listas de precios activas.</Text></View>
                    ) : (
                        <View className="gap-3">
                            {activeLists.map((list) => (
                                <View key={list.id} className="flex-row items-center gap-3">
                                    <View className="flex-1">
                                        <Text className="text-neutral-700 font-medium mb-1 text-sm">{list.nombre} ({list.moneda})</Text>
                                        <View className="flex-row items-center bg-neutral-50 border border-neutral-200 rounded-xl px-3">
                                            <Text className="text-neutral-500 text-lg mr-2">$</Text>
                                            <TextInput className="flex-1 py-3 text-neutral-900 text-base font-medium" placeholder="0.00" keyboardType="numeric" value={priceValues[list.id] || ''} onChangeText={(val) => { setPriceValues(prev => ({ ...prev, [list.id]: val })) }} />
                                            {priceValues[list.id] && priceValues[list.id] !== '' ? (
                                                <TouchableOpacity onPress={() => setPriceValues(prev => ({ ...prev, [list.id]: '' }))} className="p-2">
                                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                                </TouchableOpacity>
                                            ) : null}
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
                <View className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 mb-8">
                    <View className="flex-row items-center justify-between">
                        <View><Text className="text-neutral-900 font-bold text-lg">Estado del Producto</Text><Text className="text-neutral-500 text-xs">Visible para ventas cuando está activo</Text></View>
                        <Switch value={form.active} onValueChange={v => setForm({ ...form, active: v })} trackColor={{ false: "#D1D5DB", true: "#16A34A" }} />
                    </View>
                </View>
                <TouchableOpacity className="p-4 rounded-xl items-center shadow-lg shadow-red-500/30 mb-8" onPress={handleSave} disabled={loading} style={{ backgroundColor: '#EF4444' }}>
                    {loading ? (<ActivityIndicator color="white" />) : (<Text className="text-white font-bold text-lg">{isEditing ? 'Guardar Cambios' : 'Crear Producto'}</Text>)}
                </TouchableOpacity>
            </ScrollView>
            <GenericModal visible={categoryModalVisible} onClose={() => setCategoryModalVisible(false)} title="Seleccionar Categoría" height="70%">
                <ScrollView>
                    {categories.map((cat) => (
                        <TouchableOpacity key={cat.id} className="p-4 border-b border-neutral-100 flex-row items-center justify-between bg-neutral-50 rounded-xl mb-2" onPress={() => { setForm({ ...form, categoryId: cat.id }); setSelectedCategoryName(cat.nombre); setCategoryModalVisible(false) }}>
                            <View>
                                <Text className="text-base font-semibold text-neutral-800">{cat.nombre}</Text>
                                {cat.descripcion ? <Text className="text-sm text-neutral-500">{cat.descripcion}</Text> : null}
                            </View>
                            {form.categoryId === cat.id && (<Ionicons name="checkmark-circle" size={24} color={'#2563EB'} />)}
                        </TouchableOpacity>
                    ))}
                    {categories.length === 0 && (<View className="items-center py-10"><Text className="text-neutral-400">No hay categorías disponibles</Text></View>)}
                </ScrollView>
            </GenericModal>
            <FeedbackModal visible={feedbackVisible} type={feedbackConfig.type} title={feedbackConfig.title} message={feedbackConfig.message} onClose={() => setFeedbackVisible(false)} onConfirm={feedbackConfig.onConfirm} showCancel={feedbackConfig.showCancel} />
        </View>
    )
}
