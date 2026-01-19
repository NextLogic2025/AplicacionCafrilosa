import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Switch, TextInput } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { GenericList } from '../../../../components/ui/GenericList'
import { PriceService, PriceList } from '../../../../services/api/PriceService'
import { SearchBar } from '../../../../components/ui/SearchBar'
import { BRAND_COLORS } from '../../../../shared/types'
import { GenericModal } from '../../../../components/ui/GenericModal'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'

export function SupervisorPriceListsScreen({ navigation }: { navigation: any }) {
    const [lists, setLists] = useState<PriceList[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const [modalVisible, setModalVisible] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [editingList, setEditingList] = useState<PriceList | null>(null)

    const [listName, setListName] = useState('')
    const [isActive, setIsActive] = useState(true)

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

    const showFeedback = (type: FeedbackType, title: string, message: string, onConfirm?: () => void, showCancel = false) => {
        setFeedbackConfig({ type, title, message, onConfirm, showCancel })
        setFeedbackVisible(true)
    }

    const fetchLists = async () => {
        setLoading(true)
        try {
            const data = await PriceService.getLists()
            setLists(data)
        } catch (error) {
            console.error(error)
            showFeedback('error', 'Error', 'No se pudieron cargar las listas de precios.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLists()
    }, [])

    const handleOpenCreate = () => {
        setEditingList(null)
        setListName('')
        setIsActive(true)
        setModalVisible(true)
    }

    const handleOpenEdit = (item: PriceList) => {
        setEditingList(item)
        setListName(item.nombre)
        setIsActive(item.activa)
        setModalVisible(true)
    }

    const handleSave = async () => {
        if (!listName.trim()) {
            showFeedback('warning', 'Validación', 'El nombre de la lista es obligatorio.')
            return
        }
        setProcessing(true)
        try {
            if (editingList) {
                const updated = await PriceService.updateList(editingList.id, {
                    nombre: listName,
                    activa: isActive
                })
                setLists(prev => prev.map(l => l.id === updated.id ? updated : l))
                setModalVisible(false) // Close modal first
                setTimeout(() => {
                    showFeedback('success', 'Éxito', 'Lista actualizada correctamente')
                }, 300)
            } else {
                const newList = await PriceService.createList({
                    nombre: listName,
                    activa: isActive,
                    moneda: 'USD'
                })
                setLists(prev => [...prev, newList])
                setModalVisible(false)
                setTimeout(() => {
                    showFeedback('success', 'Éxito', 'Lista creada correctamente')
                }, 300)
            }
        } catch (error: any) {
            console.error(error)
            showFeedback('error', 'Error', error.message || 'No se pudo guardar la lista.')
        } finally {
            setProcessing(false)
        }
    }

    const handleDelete = (item: PriceList) => {
        if (item.nombre.toLowerCase() === 'general') {
            showFeedback('warning', 'Restricción', 'La lista General no se puede eliminar porque es fundamental para el sistema.')
            return
        }

        showFeedback(
            'warning',
            'Eliminar Lista',
            `¿Estás seguro de eliminar la lista "${item.nombre}"? Esto podría afectar a los productos asociados.`,
            async () => {
                try {
                    setLoading(true)
                    await PriceService.deleteList(item.id)
                    setLists(prev => prev.filter(l => l.id !== item.id))
                    showFeedback('success', 'Eliminado', 'La lista se ha eliminado correctamente.')
                } catch (error) {
                    showFeedback('error', 'Error', 'No se pudo eliminar la lista.')
                } finally {
                    setLoading(false)
                }
            },
            true // Show cancel button
        )
    }

    const filteredLists = lists.filter(l =>
        l.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const renderItem = (item: PriceList) => (
        <TouchableOpacity
            className="flex-row items-center bg-white p-4 mb-3 rounded-xl shadow-sm border border-neutral-100"
            activeOpacity={0.7}
            onPress={() => handleOpenEdit(item)}
            onLongPress={() => handleDelete(item)}
        >
            <View className="w-12 h-12 bg-amber-50 rounded-lg items-center justify-center mr-4">
                <Ionicons name="pricetag-outline" size={24} color="#D97706" />
            </View>
            <View className="flex-1">
                <Text className="font-bold text-neutral-900 text-lg">{item.nombre}</Text>
                <Text className="text-neutral-500 text-sm">Moneda: {item.moneda || 'USD'}</Text>
            </View>
            <View className={`px-2 py-1 rounded-md ml-2 ${item.activa ? 'bg-green-100' : 'bg-neutral-100'}`}>
                <Text className={`text-[10px] font-bold uppercase ${item.activa ? 'text-green-700' : 'text-neutral-400'}`}>
                    {item.activa ? 'Activa' : 'Inactiva'}
                </Text>
            </View>
            <TouchableOpacity
                onPress={() => handleDelete(item)}
                className="p-2 ml-2"
            >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
        </TouchableOpacity>
    )

    const SUGGESTIONS = ['Mayorista', 'Horeca', 'Minorista']

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Gestión de Listas" variant="standard" onBackPress={() => navigation.goBack()} />

            <View className="px-5 py-4 bg-white shadow-sm z-10 mb-2 flex-row items-center">
                <View className="flex-1">
                    <SearchBar
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Buscar lista..."
                        onClear={() => setSearchQuery('')}
                    />
                </View>
                <TouchableOpacity
                    className="w-12 h-12 rounded-xl items-center justify-center shadow-sm ml-3"
                    style={{ backgroundColor: BRAND_COLORS.red }}
                    onPress={handleOpenCreate}
                >
                    <Ionicons name="add" size={30} color="white" />
                </TouchableOpacity>
            </View>

            <GenericList
                items={filteredLists}
                isLoading={loading}
                onRefresh={fetchLists}
                renderItem={renderItem}
                emptyState={{
                    icon: 'pricetags-outline',
                    title: 'Sin Listas',
                    message: 'No hay listas de precios configuradas.'
                }}
            />

            <GenericModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                title={editingList ? "Editar Lista" : "Nueva Lista"}
            >
                <View className="w-full">
                    <Text className="text-neutral-600 mb-2 font-medium">Nombre de la Lista</Text>

                    <TextInput
                        className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 mb-3 text-lg"
                        placeholder="Ej. Distribuidor A"
                        value={listName}
                        onChangeText={setListName}
                    />

                    {!editingList && (
                        <View className="flex-row flex-wrap gap-2 mb-4">
                            {SUGGESTIONS.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    onPress={() => setListName(option)}
                                    className={`px-3 py-1.5 rounded-full border ${listName === option
                                        ? 'bg-red-50 border-red-500'
                                        : 'bg-white border-neutral-200'
                                        }`}
                                >
                                    <Text
                                        className={`text-xs font-medium ${listName === option ? 'text-red-600' : 'text-neutral-600'
                                            }`}
                                    >
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View className="flex-row items-center justify-between bg-neutral-50 p-3 rounded-xl mb-6 border border-neutral-200">
                        <View>
                            <Text className="text-neutral-700 font-medium">Estado Activo</Text>
                            <Text className="text-neutral-400 text-xs">Visible para asignar precios</Text>
                        </View>
                        <Switch
                            value={isActive}
                            onValueChange={setIsActive}
                            trackColor={{ false: "#d1d5db", true: "#22c55e" }}
                            thumbColor={isActive ? "#ffffff" : "#f4f3f4"}
                        />
                    </View>

                    <TouchableOpacity
                        className={`w-full py-4 rounded-xl items-center shadow-sm ${processing ? 'opacity-70' : ''}`}
                        style={{ backgroundColor: BRAND_COLORS.red }}
                        onPress={handleSave}
                        disabled={processing}
                    >
                        <Text className="text-white font-bold text-base">
                            {processing ? 'Guardando...' : 'Guardar Lista'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </GenericModal>

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
