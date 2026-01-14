import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { NotificationService, type Notification } from '../../../../services/api/NotificationService'
import { BRAND_COLORS } from '../../../../shared/types'
import { Ionicons } from '@expo/vector-icons'

export function SellerNotificationsScreen() {
    const navigation = useNavigation()
    const [loading, setLoading] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])

    useEffect(() => {
        loadNotifications()
    }, [])

    const loadNotifications = async () => {
        setLoading(true)
        try {
            const data = await NotificationService.getNotifications()
            setNotifications(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Notificaciones" variant="standard" onBackPress={() => navigation.goBack()} showNotification={false} />

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={
                        <EmptyState
                            icon="notifications-outline"
                            title="Sin Notificaciones"
                            description="No tienes nuevas notificaciones."
                            actionLabel="Recargar"
                            onAction={loadNotifications}
                        />
                    }
                    renderItem={({ item }) => (
                        <View className={`bg-white p-4 rounded-xl border mb-3 flex-row items-start ${!item.read ? 'border-l-4 border-l-brand-red border-y-neutral-100 border-r-neutral-100' : 'border-neutral-100'}`}>
                            <View className="mr-3 mt-1">
                                <Ionicons
                                    name={item.type === 'order_status' ? 'cube-outline' : 'information-circle-outline'}
                                    size={24}
                                    color={!item.read ? BRAND_COLORS.red : '#9CA3AF'}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className={`text-sm mb-1 ${!item.read ? 'font-bold text-neutral-900' : 'text-neutral-600'}`}>
                                    {item.title || 'Notificación'}
                                </Text>
                                <Text className="text-neutral-500 text-xs mb-1">{item.message}</Text>
                                <Text className="text-neutral-400 text-[10px]">{item.date}</Text>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    )
}
