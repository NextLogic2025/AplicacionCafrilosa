import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Header } from '../../../components/ui/Header'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ReturnsService, ReturnRequest } from '../../../services/api/ReturnsService'

export function ClientReturnsScreen() {
    const navigation = useNavigation()
    const [returns, setReturns] = useState<ReturnRequest[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadReturns()
    }, [])

    const loadReturns = async () => {
        try {
            const data = await ReturnsService.getReturns()
            setReturns(data)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return '#059669' // green
            case 'rejected': return '#DC2626' // red
            default: return '#D97706' // amber
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'approved': return 'Autorizada'
            case 'rejected': return 'Rechazada'
            default: return 'Pendiente'
        }
    }

    const renderItem = ({ item }: { item: ReturnRequest }) => (
        <View className="bg-white p-4 rounded-xl border border-neutral-100 mb-3 shadow-sm shadow-neutral-100">
            <View className="flex-row justify-between items-start mb-2">
                <View>
                    <Text className="font-bold text-neutral-800 text-base">#{item.id}</Text>
                    <Text className="text-neutral-500 text-xs">{item.date}</Text>
                </View>
                <View className="px-2 py-1 rounded-md bg-neutral-50" style={{ backgroundColor: `${getStatusColor(item.status)}15` }}>
                    <Text style={{ color: getStatusColor(item.status), fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
                        {getStatusLabel(item.status)}
                    </Text>
                </View>
            </View>
            <View className="flex-row justify-between items-end mt-2">
                <View>
                    <Text className="text-neutral-500 text-xs mb-0.5">{item.items} productos</Text>
                    <Text className="text-neutral-700 text-xs italic">"{item.reason}"</Text>
                </View>
                <Text className="font-bold text-lg text-neutral-900">${item.total.toFixed(2)}</Text>
            </View>
        </View>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Devoluciones" variant="standard" onBackPress={() => navigation.goBack()} />

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator color={BRAND_COLORS.red} size="large" />
                </View>
            ) : returns.length > 0 ? (
                <FlatList
                    data={returns}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 20 }}
                />
            ) : (
                <View className="flex-1 justify-center items-center p-8">
                    <EmptyState
                        icon="refresh-circle-outline"
                        title="Sin devoluciones"
                        description="No tienes solicitudes de devolución activas."
                    />
                    <Pressable
                        className="mt-6 bg-brand-red px-6 py-3 rounded-xl shadow-lg shadow-red-500/30"
                        onPress={() => console.log('Nueva devolución')}
                    >
                        <Text className="text-white font-bold">Solicitar Devolución</Text>
                    </Pressable>
                </View>
            )}
        </View>
    )
}
