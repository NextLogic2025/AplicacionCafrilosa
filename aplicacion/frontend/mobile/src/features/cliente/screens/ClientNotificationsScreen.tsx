import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, ActivityIndicator, Pressable, Animated } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Swipeable } from 'react-native-gesture-handler'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Header } from '../../../components/ui/Header'
import { EmptyState } from '../../../components/ui/EmptyState'
import { NotificationService, Notification } from '../../../services/api/NotificationService'

export function ClientNotificationsScreen() {
    const navigation = useNavigation()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadNotifications()
    }, [])

    const loadNotifications = async () => {
        try {
            const data = await NotificationService.getNotifications()
            setNotifications(data)
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }

    const renderRightActions = (progress: any, dragX: any, item: Notification) => {
        const trans = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        })

        return (
            <Pressable
                className="bg-brand-red justify-center items-center w-24 h-full"
                onPress={() => markAsRead(item.id)}
            >
                <Animated.View style={{ transform: [{ scale: trans }] }}>
                    <Ionicons name="checkmark-done-circle-outline" size={30} color="white" />
                    <Text className="text-white text-xs font-bold mt-1">Leída</Text>
                </Animated.View>
            </Pressable>
        )
    }

    const renderItem = ({ item }: { item: Notification }) => (
        <Swipeable renderRightActions={(p, d) => renderRightActions(p, d, item)}>
            <View className={`p-4 border-b border-neutral-100 ${item.read ? 'bg-white' : 'bg-red-50'}`}>
                <View className="flex-row justify-between mb-1">
                    <Text className={`flex-1 text-sm ${item.read ? 'text-neutral-600' : 'text-neutral-900 font-bold'}`}>
                        {item.message}
                    </Text>
                    {!item.read && <View className="h-2 w-2 bg-brand-red rounded-full" />}
                </View>
                <Text className="text-neutral-400 text-xs">{item.date}</Text>
            </View>
        </Swipeable>
    )

    return (
        <View className="flex-1 bg-white">
            <Header title="Notificaciones" variant="standard" onBackPress={() => navigation.goBack()} showNotification={false} />

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator color={BRAND_COLORS.red} size="large" />
                </View>
            ) : notifications.length > 0 ? (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            ) : (
                <View className="flex-1 justify-center items-center p-8">
                    <EmptyState
                        icon="notifications-off-outline"
                        title="Sin notificaciones"
                        description="No tienes mensajes nuevos en este momento."
                    />
                </View>
            )}
        </View>
    )
}
