import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, Switch } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { GenericList } from '../../../../components/ui/GenericList'
import { GenericModal } from '../../../../components/ui/GenericModal'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { CatalogService, Category } from '../../../../services/api/CatalogService'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
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

    const fetchCategories = async () => {
        setLoading(true)
        try {
            const data = await CatalogService.getCategories()
            setCategories(data)
        } catch (error: any) {
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
                showFeedback('success', 'Éxito', 'Categoría actualizada correctamente', () => { setFeedbackVisible(false); setModalVisible(false); fetchCategories() })
            } else {
                await CatalogService.createCategory({ nombre: name, descripcion: description, imagen_url: imageUrl, activo: active })
                showFeedback('success', 'Éxito', 'Categoría creada correctamente', () => { setFeedbackVisible(false); setModalVisible(false); fetchCategories() })
            }
        } catch (error: any) {
            if (error?.message !== 'SESSION_EXPIRED') {
                showFeedback('error', 'Error', 'No se pudo guardar la categoría. Intente nuevamente.')
            }
        }
    }

    const handleDelete = (category: Category) => {
        showFeedback('warning', 'Eliminar Categoría', `¿Estás seguro de eliminar "${category.nombre}"? Esta acción no se puede deshacer.`, async () => {
            setFeedbackVisible(false)
            try {
                await CatalogService.deleteCategory(category.id)
                fetchCategories()
            } catch (error: any) {
                if (error?.message !== 'SESSION_EXPIRED') {
                    setTimeout(() => { showFeedback('error', 'Error', 'No se pudo eliminar la categoría.') }, 300)
                }
            }
        }, true)
    }

    const renderItem = (item: Category) => (
        <TouchableOpacity className="flex-row items-center bg-white p-4 mb-3 rounded-xl shadow-sm border border-neutral-100" onPress={() => handleOpenModal(item)} activeOpacity={0.7}>
            <View className={`w-12 h-12 rounded-lg items-center justify-center mr-4 ${item.activo ? 'bg-blue-50' : 'bg-neutral-100'}`}>
                <Ionicons name="grid-outline" size={24} color={item.activo ? '#2563EB' : '#9CA3AF'} />
            </View>
            <View className="flex-1">
                <Text className="font-bold text-neutral-800 text-lg">{item.nombre}</Text>
                {item.descripcion ? (<Text className="text-neutral-500 text-sm" numberOfLines={1}>{item.descripcion}</Text>) : null}
            </View>
            <View className="items-end">
                <View className={`px-2 py-1 rounded-md ${item.activo ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Text className={`text-[10px] font-bold uppercase ${item.activo ? 'text-green-700' : 'text-red-700'}`}>{item.activo ? 'Activa' : 'Inactiva'}</Text>
                </View>
            </View>
            <TouchableOpacity className="ml-3 p-2 bg-neutral-50 rounded-full" onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={18} color={BRAND_COLORS.red || '#EF4444'} />
            </TouchableOpacity>
        </TouchableOpacity>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Categorías" variant="standard" onBackPress={() => navigation.goBack()} />
            <View className="px-5 py-4 bg-white shadow-sm z-10 mb-2 flex-row items-center">
                <View className="flex-1 mr-3">
                    <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar categoría..." onClear={() => setSearchQuery('')} />
                </View>
                <TouchableOpacity className="w-12 h-12 rounded-xl items-center justify-center shadow-sm" style={{ backgroundColor: BRAND_COLORS.red }} onPress={() => handleOpenModal()}>
                    <Ionicons name="add" size={30} color="white" />
                </TouchableOpacity>
            </View>
            <GenericList items={filteredCategories} isLoading={loading} onRefresh={fetchCategories} renderItem={renderItem} emptyState={{ icon: 'grid-outline', title: 'Sin Categorías', message: 'No hay categorías que coincidan con la búsqueda.' }} />
            <GenericModal visible={modalVisible} onClose={() => setModalVisible(false)} title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}>
                <View className="p-2">
                    <TextInput className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-neutral-900 mb-3" placeholder="Nombre" value={name} onChangeText={setName} />
                    <TextInput className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-neutral-900 mb-3" placeholder="Descripción (opcional)" value={description} onChangeText={setDescription} />
                    <TextInput className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-neutral-900 mb-3" placeholder="URL de imagen (opcional)" value={imageUrl} onChangeText={setImageUrl} />
                    <View className="flex-row items-center justify-between bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                        <Text className="text-neutral-700 font-medium">Activa</Text>
                        <Switch value={active} onValueChange={setActive} trackColor={{ false: '#D1D5DB', true: '#16A34A' }} />
                    </View>
                    <TouchableOpacity className="mt-4 bg-red-600 py-3 rounded-xl items-center" onPress={handleSave}>
                        <Text className="text-white font-bold">Guardar</Text>
                    </TouchableOpacity>
                </View>
            </GenericModal>
            <FeedbackModal visible={feedbackVisible} type={feedbackConfig.type} title={feedbackConfig.title} message={feedbackConfig.message} onClose={() => setFeedbackVisible(false)} onConfirm={feedbackConfig.onConfirm} showCancel={feedbackConfig.showCancel} />
        </View>
    )
}
