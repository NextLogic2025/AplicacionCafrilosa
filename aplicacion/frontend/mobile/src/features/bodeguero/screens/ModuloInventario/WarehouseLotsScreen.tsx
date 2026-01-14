import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { BRAND_COLORS } from '../../../../shared/types'
import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { ProductService, type Lot } from '../../../../services/api/ProductService'

export function WarehouseLotsScreen() {
    const navigation = useNavigation()
    const [loading, setLoading] = useState(false)
    const [lots, setLots] = useState<Lot[]>([])

    useEffect(() => {
        loadLots()
    }, [])

    const loadLots = async () => {
        setLoading(true)
        try {
            const data = await ProductService.getLots()
            // FEFO Sort: First Expired, First Out
            const sorted = data.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
            setLots(sorted)
        } catch (error) {
            console.error('Error loading lots', error)
        } finally {
            setLoading(false)
        }
    }

    const handleBlockLot = (lot: Lot) => {
        Alert.alert('Bloquear Lote', `¿Desea bloquear el lote ${lot.code}? No podrá ser usado en pedidos.`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Bloquear',
                style: 'destructive',
                onPress: async () => {
                    setLoading(true)
                    await ProductService.blockLot(lot.id)
                    setLoading(false)
                    Alert.alert('Lote Bloqueado', 'El lote ha sido marcado como bloqueado.')
                    loadLots()
                }
            }
        ])
    }

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header title="Lotes y Vencimientos" variant="standard" onBackPress={() => navigation.goBack()} />

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                </View>
            ) : (
                <FlatList
                    data={lots}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={
                        <EmptyState
                            icon="warning-outline"
                            title="Sin Lotes Activos"
                            description="No hay lotes registrados o próximos a vencer."
                            actionLabel="Actualizar"
                            onAction={loadLots}
                        />
                    }
                    renderItem={({ item }) => (
                        <View className="bg-white p-4 rounded-xl border border-neutral-100 mb-3 shadow-sm">
                            <View className="flex-row justify-between mb-2">
                                <View>
                                    <Text className="text-[10px] font-bold text-neutral-500 uppercase">Lote #{item.code}</Text>
                                    <Text className="text-neutral-900 font-bold text-base">{item.productName}</Text>
                                </View>
                                {item.status === 'blocked' ? (
                                    <View className="bg-red-100 px-2 py-1 rounded self-start">
                                        <Text className="text-red-700 text-[10px] font-bold">BLOQUEADO</Text>
                                    </View>
                                ) : (
                                    <View className="bg-green-100 px-2 py-1 rounded self-start">
                                        <Text className="text-green-700 text-[10px] font-bold">ACTIVO</Text>
                                    </View>
                                )}
                            </View>

                            <View className="flex-row justify-between items-end mt-2">
                                <View>
                                    <View className="flex-row items-center gap-1">
                                        <Ionicons name="calendar-outline" size={14} color="#EF4444" />
                                        <Text className="text-xs text-neutral-500">Vence: <Text className="text-red-600 font-bold">{item.expirationDate}</Text></Text>
                                    </View>
                                    <Text className="text-xs text-neutral-500 mt-1">Disponible: <Text className="font-bold text-neutral-800">{item.quantity}</Text></Text>
                                </View>

                                {item.status === 'active' && (
                                    <TouchableOpacity
                                        onPress={() => handleBlockLot(item)}
                                        className="bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-lg flex-row items-center"
                                    >
                                        <Ionicons name="lock-closed-outline" size={14} color="#4B5563" />
                                        <Text className="text-xs font-bold text-neutral-700 ml-1">Bloquear</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    )
}
