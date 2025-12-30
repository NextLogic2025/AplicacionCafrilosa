
import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, Switch, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { GenericModal } from '../../../components/ui/GenericModal'
import { FeedbackModal, FeedbackType } from '../../../components/ui/FeedbackModal'
import { CatalogService, Category } from '../../../services/api/CatalogService'
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

    useEffect(() => {
        loadCategories()
        if (isEditing && params.product) {
            const p = params.product
            setForm({
                nombre: p.nombre,
                sku: p.codigo_sku,
                description: p.descripcion || '',
                categoryId: p.categoria_id || 0,
                unit: p.unidad_medida || 'UNIDAD',
                weight: p.peso_unitario_kg?.toString() || '',
                volume: p.volumen_m3?.toString() || '',
                imageUrl: p.imagen_url || '',
                requiresCold: p.requiere_frio,
                active: p.activo
            })
        }
    }, [isEditing, params.product])

    useEffect(() => {
        if (categories.length > 0 && form.categoryId) {
            const cat = categories.find(c => c.id === form.categoryId)
            if (cat) setSelectedCategoryName(cat.nombre)
        }
    }, [categories, form.categoryId])

    const showFeedback = (type: FeedbackType, title: string, message: string, onConfirm?: () => void, showCancel = false) => {
        setFeedbackConfig({ type, title, message, onConfirm, showCancel })
        setFeedbackVisible(true)
    }

    const loadCategories = async () => {
        try {
            const data = await CatalogService.getCategories()
            setCategories(data)
        } catch (error) {
            console.error('Failed to load categories', error)
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
                nombre: form.nombre,
                codigo_sku: form.sku,
                descripcion: form.description,
                peso_unitario_kg: weightVal,
                volumen_m3: parseFloat(form.volume) || 0,
                requiere_frio: form.requiresCold,
                unidad_medida: form.unit,
                imagen_url: form.imageUrl,
                activo: form.active,
                categoria_id: form.categoryId
            }

            if (isEditing && params.product?.id) {
                await CatalogService.updateProduct(params.product.id, productData)
                showFeedback('success', 'Éxito', 'Producto actualizado correctamente.', () => {
                    navigation.goBack()
                })
            } else {
                await CatalogService.createProduct(productData)
                showFeedback('success', 'Éxito', 'Producto creado correctamente.', () => {
                    navigation.goBack()
                })
            }
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

                {/* 3. Estado */}
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

