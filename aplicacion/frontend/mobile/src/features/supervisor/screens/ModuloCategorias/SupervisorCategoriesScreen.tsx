import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { GenericList } from '../../../../components/ui/GenericList'
import { GenericModal } from '../../../../components/ui/GenericModal'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { ToggleSwitch } from '../../../../components/ui/ToggleSwitch'
import { CatalogService, Category } from '../../../../services/api/CatalogService'
import { BRAND_COLORS } from '../../../../shared/types'
import { SearchBar } from '../../../../components/ui/SearchBar'

export function SupervisorCategoriesScreen() {
    const navigation = useNavigation()
    const [categories, setCategories] = useState<Category[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)

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

    const filteredCategories = categories.filter(c =>
        c.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const buildCategoryPayload = (): Partial<Category> => {
        const payload: Partial<Category> = {
            nombre: name.trim(),
            activo: active
        }

        const trimmedDescription = description.trim()
        if (trimmedDescription) {
            payload.descripcion = trimmedDescription
        } else if (editingCategory?.descripcion) {
            payload.descripcion = null
        }

        const trimmedImageUrl = imageUrl.trim()
        if (trimmedImageUrl) {
            payload.imagen_url = trimmedImageUrl
        } else if (editingCategory?.imagen_url) {
            payload.imagen_url = null
        }

        return payload
    }

    const fetchCategories = async () => {
        setLoading(true)
        try {
            const data = await CatalogService.getCategories()
            setCategories(data)
        } catch (error: any) {
            if (error?.message !== 'SESSION_EXPIRED') {
                showFeedback('error', 'Error', 'No se pudieron cargar las categorias')
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
            setActive(category.activo ?? true)
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
            showFeedback('warning', 'Campo requerido', 'El nombre de la categoria es obligatorio.')
            return
        }
        try {
            const payload = buildCategoryPayload()
            if (editingCategory) {
                await CatalogService.updateCategory(editingCategory.id, payload)
                showFeedback('success', 'Exito', 'Categoria actualizada correctamente', () => {
                    setFeedbackVisible(false)
                    setModalVisible(false)
                    fetchCategories()
                })
            } else {
                await CatalogService.createCategory(payload)
                showFeedback('success', 'Exito', 'Categoria creada correctamente', () => {
                    setFeedbackVisible(false)
                    setModalVisible(false)
                    fetchCategories()
                })
            }
        } catch (error: any) {
            if (error?.message !== 'SESSION_EXPIRED') {
                showFeedback('error', 'Error', 'No se pudo guardar la categoria. Intenta nuevamente.')
            }
        }
    }

    const handleDelete = (category: Category) => {
        showFeedback('warning', 'Eliminar categoria', `Seguro de eliminar "${category.nombre}"? Esta accion no se puede deshacer.`, async () => {
            setFeedbackVisible(false)
            try {
                await CatalogService.deleteCategory(category.id)
                fetchCategories()
            } catch (error: any) {
                if (error?.message !== 'SESSION_EXPIRED') {
                    setTimeout(() => { showFeedback('error', 'Error', 'No se pudo eliminar la categoria.') }, 300)
                }
            }
        }, true)
    }

    const renderItem = (item: Category) => (
        <TouchableOpacity
            className="flex-row items-center bg-white mb-4 rounded-2xl shadow-sm border border-neutral-100"
            onPress={() => handleOpenModal(item)}
            activeOpacity={0.8}
            style={{
                paddingVertical: 18,
                paddingHorizontal: 18,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 3
            }}
        >
            <View className={`w-16 h-16 rounded-xl items-center justify-center mr-4 ${item.activo ? 'bg-blue-50' : 'bg-neutral-100'}`}>
                <Ionicons name="grid-outline" size={24} color={item.activo ? '#2563EB' : '#9CA3AF'} />
            </View>
            <View className="flex-1">
                <Text className="font-bold text-neutral-900 text-base" numberOfLines={2}>{item.nombre}</Text>
                {item.descripcion ? (<Text className="text-neutral-500 text-sm mt-1" numberOfLines={2}>{item.descripcion}</Text>) : null}
            </View>
            <View className="items-end ml-3">
                <View className={`px-2.5 py-1 rounded-md ${item.activo ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Text className={`text-[10px] font-bold uppercase ${item.activo ? 'text-green-700' : 'text-red-700'}`}>{item.activo ? 'Activa' : 'Inactiva'}</Text>
                </View>
                <TouchableOpacity className="mt-3 p-2.5 bg-neutral-50 rounded-full" onPress={() => handleDelete(item)}>
                    <Ionicons name="trash-outline" size={18} color={BRAND_COLORS.red || '#EF4444'} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Categorias" variant="standard" onBackPress={() => navigation.goBack()} />
            <View className="px-5 py-4 bg-white shadow-sm z-10 mb-2 flex-row items-center">
                <View className="flex-1 mr-3">
                    <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar categoria..." onClear={() => setSearchQuery('')} />
                </View>
                <TouchableOpacity className="w-12 h-12 rounded-xl items-center justify-center shadow-sm" style={{ backgroundColor: BRAND_COLORS.red }} onPress={() => handleOpenModal()}>
                    <Ionicons name="add" size={30} color="white" />
                </TouchableOpacity>
            </View>
            <GenericList items={filteredCategories} isLoading={loading} onRefresh={fetchCategories} renderItem={renderItem} emptyState={{ icon: 'grid-outline', title: 'Sin Categorias', message: 'No hay categorias que coincidan con la busqueda.' }} />
            <GenericModal visible={modalVisible} onClose={() => setModalVisible(false)} title={editingCategory ? 'Editar Categoria' : 'Nueva Categoria'}>
                <View className="p-2">
                    <TextInput className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-neutral-900 mb-3" placeholder="Nombre" value={name} onChangeText={setName} />
                    <TextInput className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-neutral-900 mb-3" placeholder="Descripcion (opcional)" value={description} onChangeText={setDescription} />
                    <TextInput className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-neutral-900 mb-3" placeholder="URL de imagen (opcional)" value={imageUrl} onChangeText={setImageUrl} />
                    <View className="flex-row items-center justify-between bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                        <Text className="text-neutral-700 font-medium">Activa</Text>
                        <ToggleSwitch
                            checked={active}
                            onToggle={() => {
                                const newState = !active
                                showFeedback(
                                    'warning',
                                    `¿${newState ? 'Activar' : 'Desactivar'} categoría?`,
                                    `¿Estás seguro de ${newState ? 'activar' : 'desactivar'} esta categoría?`,
                                    () => setActive(newState)
                                )
                            }}
                            colorOn="#22c55e"
                            colorOff="#d1d5db"
                        />
                    </View>
                    <TouchableOpacity className="mt-4 py-3 rounded-xl items-center" style={{ backgroundColor: BRAND_COLORS.red }} onPress={handleSave}>
                        <Text className="text-white font-bold">Guardar</Text>
                    </TouchableOpacity>
                </View>
            </GenericModal>
            <FeedbackModal visible={feedbackVisible} type={feedbackConfig.type} title={feedbackConfig.title} message={feedbackConfig.message} onClose={() => setFeedbackVisible(false)} onConfirm={feedbackConfig.onConfirm} showCancel={feedbackConfig.showCancel} />
        </View>
    )
}
