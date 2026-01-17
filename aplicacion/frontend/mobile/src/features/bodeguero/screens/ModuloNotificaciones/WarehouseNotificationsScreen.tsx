import React from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Header } from '../../../../components/ui/Header'
import { NotificationList } from '../../../../components/ui/NotificationList'
import { useNotifications } from '../../../../context/NotificationContext'
import { BRAND_COLORS } from '../../../../shared/types'

export function WarehouseNotificationsScreen() {
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
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                </View>
            ) : (
                <NotificationList
                    items={notifications.map(n => ({
                        id: n.id,
                        title: n.title,
                        message: n.message,
                        date: n.date,
                        type: (n.type as any) || 'info',
                        read: n.read
                    }))}
                    onMarkRead={markRead}
                    emptyState={{ title: 'Estás al día', message: 'No tienes nuevas notificaciones de bodega.' }}
                />
            )}
        </View>
    )
}
