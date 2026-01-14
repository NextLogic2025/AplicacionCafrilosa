import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { BRAND_COLORS } from '../../../../shared/types'
import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { ReturnsService, type ReturnRequest } from '../../../../services/api/ReturnsService'

export function WarehouseReturnsScreen() {
    const navigation = useNavigation()
    const [loading, setLoading] = useState(false)
    const [returns, setReturns] = useState<ReturnRequest[]>([])

    useEffect(() => {
        loadReturns()
    }, [])

    const loadReturns = async () => {
        setLoading(true)
        try {
            const data = await ReturnsService.getReturns()
            // Filter approved returns that need warehouse processing
            const approvedReturns = data.filter(r => r.status === 'approved')
            setReturns(approvedReturns)
        } catch (error) {
            console.error('Error loading returns', error)
        } finally {
            setLoading(false)
        }
    }

    const handleProcessReturn = (ret: ReturnRequest, action: 'reintegrate' | 'discard') => {
        Alert.alert(
            action === 'reintegrate' ? 'Reintegrar Stock' : 'Descartar Producto',
            `¿Confirmar acción para la devolución #${ret.id}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        setLoading(true)
                        await ReturnsService.processReturn(ret.id, action)
                        setLoading(false)
                        Alert.alert('Procesado', 'La devolución ha sido gestionada.')
                        loadReturns()
                    }
                }
            ]
        )
    }

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header title="Devoluciones" variant="standard" onBackPress={() => navigation.goBack()} />

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                </View>
            ) : (
                <FlatList
                    data={returns}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={
                        <EmptyState
                            icon="refresh-circle-outline"
                            title="Sin Devoluciones Pendientes"
                            description="No hay mercadería pendiente de ingreso."
                            actionLabel="Actualizar"
                            onAction={loadReturns}
                        />
                    }
                    renderItem={({ item }) => (
                        <View className="bg-white p-4 rounded-xl border border-neutral-100 mb-3 shadow-sm">
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-base font-bold text-neutral-900">Devolución #{item.id}</Text>
                                <View className="bg-purple-100 px-2 py-1 rounded">
                                    <Text className="text-purple-700 text-[10px] font-bold uppercase">AUTORIZADA</Text>
                                </View>
                            </View>
                            <Text className="text-sm text-neutral-600 mb-2">Motivo: {item.reason}</Text>

                            <View className="flex-row gap-2 mt-2">
                                <TouchableOpacity
                                    onPress={() => handleProcessReturn(item, 'discard')}
                                    className="flex-1 bg-neutral-100 py-2.5 rounded-lg items-center border border-neutral-200"
                                >
                                    <Text className="text-neutral-700 font-bold text-xs">Descartar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleProcessReturn(item, 'reintegrate')}
                                    className="flex-1 bg-brand-red py-2.5 rounded-lg items-center"
                                >
                                    <Text className="text-white font-bold text-xs">Reintegrar Stock</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    )
}
