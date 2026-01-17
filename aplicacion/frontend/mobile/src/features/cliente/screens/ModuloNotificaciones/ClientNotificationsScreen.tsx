import React from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { BRAND_COLORS } from '../../../../shared/types'
import { Header } from '../../../../components/ui/Header'
import { useNotifications } from '../../../../context/NotificationContext'
import { NotificationList } from '../../../../components/ui/NotificationList'

export function ClientNotificationsScreen() {
    const navigation = useNavigation()
    const { notifications, markRead, markAllRead, loaded } = useNotifications()

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title="Notificaciones"
                variant="standard"
                onBackPress={() => navigation.goBack()}
                showNotification={false}
                rightAction={{ icon: 'checkmark-done', onPress: markAllRead }}
            />

            {!loaded ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator color={BRAND_COLORS.red} size="large" />
                </View>
            ) : (
                <NotificationList
                    items={notifications.map(n => ({
                        id: n.id,
                        title: n.title,
                        message: n.message,
                        date: n.date,
                        read: n.read,
                        type: (n.type as any) || 'info'
                    }))}
                    isLoading={false}
                    onMarkRead={markRead}
                    emptyState={{ title: 'Sin notificaciones', message: 'No tienes mensajes nuevos en este momento.' }}
                />
            )}
        </View>
    )
}
