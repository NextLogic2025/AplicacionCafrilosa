import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { ClientService, type Client } from '../../../services/api/ClientService'

export function SellerClientDetailScreen() {
    const navigation = useNavigation()
    const route = useRoute()
    // @ts-ignore
    const { clientId } = route.params || {}
    const [loading, setLoading] = useState(true)
    const [client, setClient] = useState<Client | null>(null)

    useEffect(() => {
        loadDetail()
    }, [clientId])

    const loadDetail = async () => {
        setLoading(true)
        try {
            const data = await ClientService.getClientDetails(clientId)
            setClient(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <View className="flex-1 bg-neutral-50 items-center justify-center">
                <ActivityIndicator size="large" color={BRAND_COLORS.red} />
            </View>
        )
    }

    if (!client) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header title="Detalle Cliente" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="p-8 items-center"><Text>Cliente no encontrado</Text></View>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Detalle Cliente" variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header Info */}
                <View className="bg-white p-5 mb-4 border-b border-neutral-100">
                    <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1">
                            <Text className="text-xl font-bold text-neutral-900">{client.businessName}</Text>
                            <Text className="text-neutral-500 text-sm">{client.name}</Text>
                        </View>
                        {client.status === 'blocked' && (
                            <View className="bg-red-100 px-3 py-1 rounded-full">
                                <Text className="text-red-700 text-xs font-bold">BLOQUEADO</Text>
                            </View>
                        )}
                    </View>

                    <View className="flex-row gap-4 mt-2">
                        <View className="flex-row items-center">
                            <Ionicons name="location-outline" size={16} color="#6B7280" />
                            <Text className="text-neutral-600 ml-1 text-sm">{client.zone}</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
                            <Text className="text-neutral-600 ml-1 text-sm">Cat. {client.category}</Text>
                        </View>
                    </View>
                </View>

                {/* KPI Cards */}
                <View className="flex-row px-5 mb-6 justify-between">
                    <View className="bg-white p-3 rounded-xl w-[48%] border border-neutral-100 shadow-sm">
                        <Text className="text-neutral-500 text-xs font-bold uppercase mb-1">Crédito Dispon.</Text>
                        <Text className="text-lg font-bold text-green-600">${(client.creditLimit - client.creditUsed).toFixed(2)}</Text>
                        <View className="h-1 bg-neutral-100 mt-2 rounded-full overflow-hidden">
                            <View
                                className="h-full bg-green-500"
                                style={{ width: `${Math.max(0, 100 - (client.creditUsed / client.creditLimit * 100))}%` }}
                            />
                        </View>
                    </View>
                    <View className="bg-white p-3 rounded-xl w-[48%] border border-neutral-100 shadow-sm">
                        <Text className="text-neutral-500 text-xs font-bold uppercase mb-1">Saldo Vencido</Text>
                        <Text className={`text-lg font-bold ${client.outstandingBalance > 0 ? 'text-red-600' : 'text-neutral-900'}`}>
                            ${client.outstandingBalance.toFixed(2)}
                        </Text>
                        <Text className="text-[10px] text-neutral-400 mt-1">
                            Status: {client.paymentStatus === 'overdue' ? 'VENCIDO ⚠️' : 'AL DÍA ✅'}
                        </Text>
                    </View>
                </View>

                {/* Actions */}
                <View className="px-5 mb-6 space-y-3">
                    <Pressable
                        className="bg-brand-red p-4 rounded-xl flex-row items-center justify-center shadow-sm active:bg-red-700"
                        // @ts-ignore
                        onPress={() => navigation.navigate('SellerOrder', { preselectedClient: client })}
                    >
                        <Ionicons name="cart" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold text-base">Iniciar Pedido</Text>
                    </Pressable>

                    <Pressable
                        className="bg-white border border-neutral-200 p-4 rounded-xl flex-row items-center justify-center active:bg-neutral-50"
                        onPress={() => Alert.alert('Solicitud de Alta', 'Se enviará una solicitud al supervisor.')}
                    >
                        <Ionicons name="document-text-outline" size={20} color={BRAND_COLORS.red} style={{ marginRight: 8 }} />
                        <Text className="text-brand-red font-bold text-base">Solicitar Alta / Modif.</Text>
                    </Pressable>
                </View>

                {/* Historial */}
                <View className="px-5">
                    <Text className="text-lg font-bold text-neutral-900 mb-3">Últimos Pedidos</Text>
                    {client.lastOrders?.map(order => (
                        <View key={order.id} className="bg-white p-4 rounded-xl border border-neutral-100 mb-2 flex-row justify-between items-center">
                            <View>
                                <Text className="font-bold text-neutral-900">#{order.id.slice(0, 8)}</Text>
                                <Text className="text-neutral-500 text-xs">{order.date}</Text>
                            </View>
                            <View className="items-end">
                                <Text className="font-bold text-neutral-900">${order.total.toFixed(2)}</Text>
                                <Text className={`text-[10px] font-bold ${order.status === 'completed' ? 'text-green-600' :
                                        order.status === 'cancelled' ? 'text-red-600' : 'text-amber-600'
                                    }`}>
                                    {order.status.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    ))}
                    {!client.lastOrders?.length && (
                        <Text className="text-neutral-400 italic">Sin historial reciente.</Text>
                    )}
                </View>

            </ScrollView>
        </View>
    )
}
