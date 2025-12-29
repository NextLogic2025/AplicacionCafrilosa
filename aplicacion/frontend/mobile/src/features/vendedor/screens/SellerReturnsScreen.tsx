import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, ActivityIndicator, Pressable, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ReturnsService, type ReturnRequest } from '../../../services/api/ReturnsService'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Ionicons } from '@expo/vector-icons'

export function SellerReturnsScreen() {
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
            setReturns(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleAuthorize = (id: string) => {
        Alert.alert('Autorizar Devolución', '¿Estás seguro de autorizar esta solicitud?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Autorizar', onPress: () => Alert.alert('Autorizado', 'La solicitud ha sido aprobada.') }
        ])
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Solicitudes de Devolución" variant="standard" onBackPress={() => navigation.goBack()} notificationRoute="SellerNotifications" />

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
                            title="Sin Devoluciones"
                            description="No hay solicitudes de devolución pendientes."
                            actionLabel="Recargar"
                            onAction={loadReturns}
                        />
                    }
                    renderItem={({ item }) => (
                        <View className="bg-white p-4 rounded-xl border border-neutral-100 mb-3 shadow-sm">
                            <View className="flex-row justify-between mb-2">
                                <Text className="font-bold text-neutral-900">Pedido #{item.orderId?.slice(0, 8)}</Text>
                                <View className={`px-2 py-1 rounded ${item.status === 'pending' ? 'bg-amber-100' : 'bg-green-100'}`}>
                                    <Text className={`text-[10px] font-bold uppercase ${item.status === 'pending' ? 'text-amber-700' : 'text-green-700'}`}>
                                        {item.status === 'pending' ? 'PENDIENTE' : 'AUTORIZADO'}
                                    </Text>
                                </View>
                            </View>
                            <Text className="text-neutral-600 text-sm mb-1">{item.reason}</Text>
                            <Text className="text-neutral-400 text-xs mb-3">{item.date}</Text>

                            {item.status === 'pending' && (
                                <Pressable
                                    className="bg-brand-red py-2 rounded-lg items-center"
                                    onPress={() => handleAuthorize(item.id)}
                                >
                                    <Text className="text-white font-bold text-sm">Autorizar</Text>
                                </Pressable>
                            )}
                        </View>
                    )}
                />
            )}
        </View>
    )
}
