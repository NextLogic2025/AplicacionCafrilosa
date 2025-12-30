import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, Switch } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'
import { GenericModal } from '../../../components/ui/GenericModal'
import { FeedbackModal, FeedbackType } from '../../../components/ui/FeedbackModal'
import { CatalogService, Category } from '../../../services/api/CatalogService'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { SearchBar } from '../../../components/ui/SearchBar'

export function SupervisorCategoriesScreen() {
    const navigation = useNavigation()
    const [categories, setCategories] = useState<Category[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)

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

    // Form State
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [active, setActive] = useState(true)

    useEffect(() => {
        fetchCategories()
    }, [])

    const showFeedback = (type: FeedbackType, title: string, message: string, onConfirm?: () => void, showCancel = false) => {
        setFeedbackConfig({ type, title, message, onConfirm, showCancel })
        setFeedbackVisible(true)
    }

    // Filter Logic
    const filteredCategories = categories.filter(c =>
        c.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const fetchCategories = async () => {
        setLoading(true)
        try {
            const data = await CatalogService.getCategories()
            setCategories(data)
        } catch (error: any) {
            // Suppress SESSION_EXPIRED log
            if (error?.message !== 'SESSION_EXPIRED') {
                console.error(error)
                showFeedback('error', 'Error', 'No se pudieron cargar las categorías')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category)
            setName(category.nombre)
            setDescription(category.descripcion || '')
            setImageUrl(category.imagen_url || '')
            setActive(category.activo)
        } else {
            setEditingCategory(null)
            setName('')
            setDescription('')
            setImageUrl('')
            setActive(true)
        }
        setModalVisible(true)
    }

    const handleSave = async () => {
        if (!name.trim()) {
            showFeedback('warning', 'Campo Requerido', 'El nombre de la categoría es obligatorio.')
            return
        }

        try {
            if (editingCategory) {
                await CatalogService.updateCategory(editingCategory.id, {
                    nombre: name,
                    descripcion: description,
                    imagen_url: imageUrl,
                    activo: active
                })
                showFeedback('success', 'Éxito', 'Categoría actualizada correctamente', () => {
                    setFeedbackVisible(false)
                    setModalVisible(false)
                    fetchCategories()
                })
            } else {
                await CatalogService.createCategory({
                    nombre: name,
                    descripcion: description,
                    imagen_url: imageUrl,
                    activo: active
                })
                showFeedback('success', 'Éxito', 'Categoría creada correctamente', () => {
                    setFeedbackVisible(false)
                    setModalVisible(false)
                    fetchCategories()
                })
            }
        } catch (error: any) {
            if (error?.message !== 'SESSION_EXPIRED') {
                showFeedback('error', 'Error', 'No se pudo guardar la categoría. Intente nuevamente.')
            }
        }
    }

    const handleDelete = (category: Category) => {
        showFeedback(
            'warning',
            'Eliminar Categoría',
            `¿Estás seguro de eliminar "${category.nombre}"? Esta acción no se puede deshacer.`,
            async () => {
                setFeedbackVisible(false) // Close confirm modal
                try {
                    await CatalogService.deleteCategory(category.id)
                    fetchCategories()
                } catch (error: any) {
                    if (error?.message !== 'SESSION_EXPIRED') {
                        // Small delay to show error after modal closes
                        setTimeout(() => {
                            showFeedback('error', 'Error', 'No se pudo eliminar la categoría.')
                        }, 300)
                    }
                }
            },
            true // showCancel
        )
    }

    const renderItem = (item: Category) => (
        <TouchableOpacity
            className="flex-row items-center bg-white p-4 mb-3 rounded-xl shadow-sm border border-neutral-100"
            onPress={() => handleOpenModal(item)}
            activeOpacity={0.7}
        >
            <View className={`w-12 h-12 rounded-lg items-center justify-center mr-4 ${item.activo ? 'bg-blue-50' : 'bg-neutral-100'}`}>
                <Ionicons
                    name="grid-outline"
                    size={24}
                    color={item.activo ? '#2563EB' : '#9CA3AF'}
                />
            </View>
            <View className="flex-1">
                <Text className="font-bold text-neutral-800 text-lg">{item.nombre}</Text>
                {item.descripcion ? (
                    <Text className="text-neutral-500 text-sm" numberOfLines={1}>{item.descripcion}</Text>
                ) : null}
            </View>
            <View className="items-end">
                <View className={`px-2 py-1 rounded-md ${item.activo ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Text className={`text-[10px] font-bold uppercase ${item.activo ? 'text-green-700' : 'text-red-700'}`}>
                        {item.activo ? 'Activa' : 'Inactiva'}
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                className="ml-3 p-2 bg-neutral-50 rounded-full"
                onPress={() => handleDelete(item)}
            >
                <Ionicons name="trash-outline" size={18} color={BRAND_COLORS.red || '#EF4444'} />
            </TouchableOpacity>
        </TouchableOpacity>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Categorías" variant="standard" onBackPress={() => navigation.goBack()} />

            <View className="px-5 py-4 bg-white shadow-sm z-10 mb-2">
                <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Buscar categoría..."
                    onClear={() => setSearchQuery('')}
                />
            </View>

            <GenericList
                items={filteredCategories}
                isLoading={loading}
                onRefresh={fetchCategories}
                renderItem={renderItem}
                emptyState={{
                    icon: 'grid-outline',
                    title: 'Sin Categorías',
                    message: searchQuery ? 'No se encontraron categorías.' : 'No hay categorías registradas.'
                }}
            />

            {/* FAB for Add */}
            <TouchableOpacity
                className="absolute bottom-6 right-6 w-14 h-14 bg-red-600 rounded-full items-center justify-center shadow-lg shadow-red-500/40 z-50 elevation-5"
                onPress={() => handleOpenModal()}
                style={{ position: 'absolute', bottom: 30, right: 30 }}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>

            {/* Modal Edit/Create */}
            <GenericModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            >
                <Text className="font-semibold text-neutral-700 mb-2">Nombre</Text>
                <TextInput
                    className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 mb-4 text-base"
                    placeholder="Ej. Bebidas, Lácteos"
                    value={name}
                    onChangeText={setName}
                    maxLength={50}
                />

                <Text className="font-semibold text-neutral-700 mb-2">Descripción</Text>
                <TextInput
                    className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 mb-4 text-base h-24"
                    placeholder="Descripción corta..."
                    multiline
                    textAlignVertical="top"
                    value={description}
                    onChangeText={setDescription}
                    maxLength={150}
                />

                <Text className="font-semibold text-neutral-700 mb-2">URL Imagen</Text>
                <TextInput
                    className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 mb-4 text-base"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={imageUrl}
                    onChangeText={setImageUrl}
                    autoCapitalize="none"
                />

                <View className="flex-row items-center justify-between bg-neutral-50 p-4 rounded-xl mb-6">
                    <Text className="font-semibold text-neutral-700">Estado Activo</Text>
                    <Switch
                        value={active}
                        onValueChange={setActive}
                        trackColor={{ false: "#767577", true: '#2563EB' }}
                        thumbColor={active ? "#fff" : "#f4f3f4"}
                    />
                </View>

                <TouchableOpacity
                    className="bg-brand-red p-4 rounded-xl items-center shadow-sm"
                    onPress={handleSave}
                    style={{ backgroundColor: BRAND_COLORS.red || '#EF4444' }}
                >
                    <Text className="text-white font-bold text-lg">Guardar</Text>
                </TouchableOpacity>
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
