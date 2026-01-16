import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Image, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { Header } from '../../../../components/ui/Header'
import { Timeline, TimelineStep } from '../../../../components/ui/Timeline'
import { OrderService } from '../../../../services/api/OrderService'
import { BRAND_COLORS } from '../../../../shared/types'
import { Ionicons } from '@expo/vector-icons'

type TrackingRouteProp = RouteProp<{ Tracking: { orderId?: string } }, 'Tracking'>

type TrackingData = {
    id: string | number
    status: 'pending' | 'shipped' | 'delivered'
    carrier?: string
    estimatedDelivery?: string
    evidence?: { photo?: string; signature?: string }
    dates: { confirmed?: string; shipped?: string; delivered?: string }
}

export function ClientTrackingScreen() {
    const navigation = useNavigation()
    const route = useRoute<TrackingRouteProp>()
    const orderId = route.params?.orderId

    const [loading, setLoading] = useState(true)
    const [trackingData, setTrackingData] = useState<TrackingData | null>(null)

    useEffect(() => {
        const fetchTracking = async () => {
            try {
                const data = await OrderService.getTrackingInfo(orderId)
                setTrackingData(data)
            } finally {
                setLoading(false)
            }
        }
        fetchTracking()
    }, [orderId])

    if (loading) {
        return (
            <View className="flex-1 bg-neutral-50 justify-center">
                <ActivityIndicator color={BRAND_COLORS.red} size="large" />
            </View>
        )
    }

    if (!trackingData) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header title="Seguimiento" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 items-center justify-center p-8">
                    <View className="bg-neutral-100 p-4 rounded-full mb-4">
                        <Ionicons name="location-outline" size={48} color="#9CA3AF" />
                    </View>
                    <Text className="text-neutral-500 text-center font-medium">No hay información de seguimiento disponible o no tienes pedidos activos en ruta.</Text>
                </View>
            </View>
        )
    }

    const steps: TimelineStep[] = [
        {
            title: 'Pedido Confirmado',
            description: 'Tu pedido ha sido recibido y validado.',
            status: 'completed',
            date: trackingData.dates.confirmed
        },
        {
            title: 'En Ruta',
            description: 'El conductor está en camino a tu dirección.',
            status: trackingData.status === 'delivered' ? 'completed' : 'current',
            date: trackingData.dates.shipped
        },
        {
            title: 'Entregado',
            description: 'Pedido entregado exitosamente.',
            status: trackingData.status === 'delivered' ? 'completed' : 'pending',
            date: trackingData.dates.delivered
        }
    ]

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title="Seguimiento"
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView className="flex-1 px-5 pt-6">

                <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm shadow-black/5 border border-neutral-100">
                    <Text className="text-neutral-500 text-xs font-bold uppercase mb-1">Pedido Referencia</Text>
                    <Text className="text-neutral-900 font-bold text-2xl mb-1">#{trackingData.id}</Text>
                    <Text className="text-neutral-600 text-sm font-medium mb-1">
                        Transportista: {trackingData.carrier || 'Logística Interna'}
                    </Text>
                    <Text className="text-neutral-400 text-sm">Fecha estimada: {trackingData.estimatedDelivery}</Text>
                </View>

                <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm shadow-black/5 border border-neutral-100">
                    <Text className="text-neutral-900 font-bold text-lg mb-4">Estado del Envío</Text>
                    <Timeline steps={steps} />
                </View>

                {trackingData.status === 'delivered' && (
                    <View className="mb-10">
                        <Text className="text-neutral-900 font-bold text-lg mb-3 pl-1">Evidencias de Entrega</Text>

                        <View className="flex-row gap-4">
                            <View className="flex-1 bg-white rounded-2xl p-3 shadow-sm shadow-black/5 border border-neutral-100 items-center">
                                <View className="w-full h-32 bg-neutral-100 rounded-xl mb-2 overflow-hidden items-center justify-center">
                                    {trackingData.evidence?.photo ? (
                                        <Image source={{ uri: trackingData.evidence.photo }} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        <Ionicons name="image-outline" size={30} color="#9CA3AF" />
                                    )}
                                </View>
                                <Text className="text-neutral-500 text-xs font-medium">Foto Paquete</Text>
                            </View>

                            <View className="flex-1 bg-white rounded-2xl p-3 shadow-sm shadow-black/5 border border-neutral-100 items-center">
                                <View className="w-full h-32 bg-neutral-100 rounded-xl mb-2 overflow-hidden items-center justify-center">
                                    {trackingData.evidence?.signature ? (
                                        <Image source={{ uri: trackingData.evidence.signature }} className="w-full h-full" resizeMode="contain" />
                                    ) : (
                                        <Ionicons name="create-outline" size={30} color="#9CA3AF" />
                                    )}
                                </View>
                                <Text className="text-neutral-500 text-xs font-medium">Firma Recibido</Text>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    )
}
