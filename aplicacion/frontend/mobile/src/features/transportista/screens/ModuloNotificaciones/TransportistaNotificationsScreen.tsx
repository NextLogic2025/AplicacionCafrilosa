import { useFocusEffect, useNavigation } from '@react-navigation/native'
import React, { useState, useCallback } from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../shared/types'

import { Header } from '../../../../components/ui/Header'
import { GenericList } from '../../../../components/ui/GenericList'
import { TransportistaService, type Notification } from '../../../../services/api/TransportistaService'

export function TransportistaNotificationsScreen() {
    const navigation = useNavigation()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadNotifications = async () => {
        try {
            setIsLoading(true)
            const data = await TransportistaService.getNotifications()
            setNotifications(data)
        } catch (error) {
            console.error('Error loading notifications', error)
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(useCallback(() => { loadNotifications() }, []))

    const getIcon = (type: string) => {
        switch (type) {
            case 'order': return 'cube';
            case 'route': return 'map';
            default: return 'notifications';
        }
    }

    const renderItem = (item: Notification) => (
        <View className={`bg-white p-4 rounded-xl border mb-3 flex-row shadow-sm ${item.read ? 'border-neutral-100 opacity-80' : 'border-red-100 bg-red-50/10'}`}>
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${item.read ? 'bg-neutral-100' : 'bg-red-100'}`}>
                <Ionicons name={getIcon(item.type) as any} size={20} color={item.read ? 'gray' : BRAND_COLORS.red} />
            </View>
            <View className="flex-1">
                <View className="flex-row justify-between mb-1">
                    <Text className={`text-sm font-bold ${item.read ? 'text-neutral-700' : 'text-brand-red'}`}>{item.title}</Text>
                    <Text className="text-xs text-neutral-400">{item.date}</Text>
                </View>
                <Text className="text-neutral-600 text-sm">{item.message}</Text>
            </View>
        </View>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title="Notificaciones"
                variant="standard"
                showNotification={false}
                onBackPress={() => navigation.goBack()}
            />
            <GenericList
                items={notifications}
                isLoading={isLoading}
                onRefresh={loadNotifications}
                renderItem={renderItem}
                emptyState={{
                    icon: 'notifications-off-outline',
                    title: 'Sin Notificaciones',
                    message: 'Estás al día con tus avisos.'
                }}
            />
        </View>
    )
}
