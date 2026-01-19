import React from 'react'
import { View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Header } from '../../../../components/ui/Header'
import { NotificationList } from '../../../../components/ui/NotificationList'
import { useNotifications } from '../../../../context/NotificationContext'

export function SupervisorAlertsScreen() {
    const navigation = useNavigation()
    const { notifications, markRead, markAllRead, loaded } = useNotifications()

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title="Alertas del Sistema"
                variant="standard"
                showNotification={false}
                onBackPress={() => navigation.goBack()}
                rightAction={{ icon: 'checkmark-done', onPress: markAllRead }}
            />
            <NotificationList
                items={notifications.map(n => ({
                    id: n.id,
                    title: n.title || 'Alerta',
                    message: n.message,
                    date: n.date,
                    type: (n.type as any) || 'info',
                    read: n.read,
                    data: n.data
                }))}
                isLoading={!loaded}
                onMarkRead={markRead}
                emptyState={{ title: 'Sin alertas', message: 'Todo opera con normalidad.' }}
            />
        </View>
    )
}
