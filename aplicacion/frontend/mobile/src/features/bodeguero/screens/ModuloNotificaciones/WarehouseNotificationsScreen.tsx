import React, { useEffect, useState } from 'react'
import { View, FlatList, ActivityIndicator, Text } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { BRAND_COLORS } from '../../../../shared/types'
import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { NotificationService, type Notification } from '../../../../services/api/NotificationService'
import { Ionicons } from '@expo/vector-icons'
import { Swipeable } from 'react-native-gesture-handler'

export function WarehouseNotificationsScreen() {
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
            console.error('Error loading notifications', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header title="Notificaciones" variant="standard" onBackPress={() => navigation.goBack()} />

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
                            title="Estás al día"
                            description="No tienes nuevas notificaciones de bodega."
                            actionLabel="Actualizar"
                            onAction={loadNotifications}
                        />
                    }
                    renderItem={({ item }) => (
                        <View className={`bg-white p-4 rounded-xl border mb-3 shadow-sm flex-row gap-3 ${item.read ? 'border-neutral-100 opacity-60' : 'border-red-100 bg-red-50/10'}`}>
                            <View className={`h-10 w-10 rounded-full items-center justify-center ${item.read ? 'bg-neutral-100' : 'bg-red-100'}`}>
                                <Ionicons name="notifications" size={20} color={item.read ? '#9CA3AF' : BRAND_COLORS.red} />
                            </View>
                            <View className="flex-1">
                                <Text className={`text-sm ${item.read ? 'font-medium text-neutral-600' : 'font-bold text-neutral-900'}`}>{item.title}</Text>
                                <Text className="text-xs text-neutral-500 mt-1">{item.message}</Text>
                                <Text className="text-[10px] text-neutral-400 mt-2">{item.date}</Text>
                            </View>
                            {!item.read && <View className="h-2 w-2 rounded-full bg-red-500 mt-1" />}
                        </View>
                    )}
                />
            )}
        </View>
    )
}
