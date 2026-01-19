import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PriceService, type PriceList } from '../../services/api/PriceService'

interface PriceListPickerProps {
    selectedListId: number
    onSelectList: (listId: number) => void
    style?: any
}

export function PriceListPicker({ selectedListId, onSelectList, style }: PriceListPickerProps) {
    const [priceLists, setPriceLists] = useState<PriceList[]>([])
    const [loading, setLoading] = useState(true)
    const [modalVisible, setModalVisible] = useState(false)

    const COLOR_PRIMARY = '#DC2626'

    useEffect(() => {
        loadPriceLists()
    }, [])

    const loadPriceLists = async () => {
        try {
            setLoading(true)
            const lists = await PriceService.getLists()
            const activeLists = lists.filter(list => list.activa)
            setPriceLists(activeLists)
        } catch (error) {
            console.error('Error loading price lists:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectList = (listId: number) => {
        onSelectList(listId)
        setModalVisible(false)
    }

    const selectedList = priceLists.find(list => list.id === selectedListId)

    if (loading) {
        return (
            <View className="flex-row items-center justify-center py-3 gap-2" style={style}>
                <ActivityIndicator size="small" color={COLOR_PRIMARY} />
                <Text className="text-[13px] text-gray-500 font-medium">Cargando...</Text>
            </View>
        )
    }

    return (
        <>
            <TouchableOpacity
                className="flex-row items-center justify-between bg-white px-3 py-2.5 rounded-xl border-[1.5px] border-gray-200 shadow-sm"
                style={style}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
            >
                <View className="flex-row items-center flex-1 gap-2.5">
                    <View
                        className="w-8 h-8 rounded-2xl justify-center items-center"
                        style={{ backgroundColor: `${COLOR_PRIMARY}15` }}
                    >
                        <Ionicons name="pricetag" size={16} color={COLOR_PRIMARY} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                            Lista
                        </Text>
                        <Text className="text-[13px] font-bold text-gray-900" numberOfLines={1}>
                            {selectedList ? selectedList.nombre : 'Seleccionar'}
                        </Text>
                    </View>
                </View>
                <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/60 justify-end"
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View
                        className="bg-white rounded-t-3xl max-h-[75%] shadow-2xl"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 12,
                            elevation: 12
                        }}
                    >
                        <View className="flex-row items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                            <View>
                                <Text className="text-xl font-extrabold text-gray-900 mb-1">
                                    Seleccionar Lista
                                </Text>
                                <Text className="text-[13px] text-gray-500 font-medium">
                                    Filtra productos por lista de precios
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                className="p-1"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={priceLists}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                            renderItem={({ item }) => {
                                const isSelected = item.id === selectedListId

                                return (
                                    <TouchableOpacity
                                        className="flex-row items-center justify-between px-4 py-4 rounded-2xl mb-2.5 bg-gray-50 border-2"
                                        style={{
                                            backgroundColor: isSelected ? `${COLOR_PRIMARY}08` : '#F9FAFB',
                                            borderColor: isSelected ? COLOR_PRIMARY : 'transparent'
                                        }}
                                        onPress={() => handleSelectList(item.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View className="flex-row items-center flex-1 gap-3.5">
                                            <View
                                                className="w-11 h-11 rounded-full justify-center items-center"
                                                style={{ backgroundColor: `${COLOR_PRIMARY}15` }}
                                            >
                                                <Ionicons
                                                    name="pricetag"
                                                    size={20}
                                                    color={COLOR_PRIMARY}
                                                />
                                            </View>
                                            <View className="flex-1">
                                                <Text
                                                    className="text-base font-bold mb-0.5"
                                                    style={{ color: isSelected ? COLOR_PRIMARY : '#1F2937' }}
                                                >
                                                    {item.nombre}
                                                </Text>
                                                <Text className="text-[13px] text-gray-500 font-medium">
                                                    {item.moneda}
                                                </Text>
                                            </View>
                                        </View>
                                        {isSelected && (
                                            <View
                                                className="w-7 h-7 rounded-full justify-center items-center"
                                                style={{ backgroundColor: COLOR_PRIMARY }}
                                            >
                                                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                )
                            }}
                            ListEmptyComponent={
                                <View className="items-center justify-center py-12">
                                    <Ionicons name="file-tray-outline" size={48} color="#D1D5DB" />
                                    <Text className="text-[15px] text-gray-400 mt-3 font-medium text-center">
                                        No hay listas disponibles
                                    </Text>
                                </View>
                            }
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    )
}
