import React from 'react'
import { View, ScrollView, RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { BRAND_COLORS } from '../../../../shared/types'

import { Header } from '../../../../components/ui/Header'
import { AccountOverview, QuickStats, RecentActivity } from '../../components/DashboardComponents'

import { getUserName } from '../../../../storage/authStorage'

import { ExpandableFab, type FabAction } from '../../../../components/ui/ExpandableFab'

export function ClientHomeScreen() {
    const navigation = useNavigation()
    const [userName, setUserName] = React.useState('Cliente')

    React.useEffect(() => {
        getUserName().then(name => {
            if (name) setUserName(name)
        })
    }, [])

    const fabActions: FabAction[] = [
        { icon: 'notifications-outline', label: 'Notificaciones', onPress: () => (navigation as any).navigate('Notifications') },
        { icon: 'ticket-outline', label: 'Soporte', onPress: () => (navigation as any).navigate('Soporte') },
        { icon: 'refresh-circle-outline', label: 'Devoluciones', onPress: () => (navigation as any).navigate('Returns') },
        { icon: 'time-outline', label: 'Entregas', onPress: () => (navigation as any).navigate('Tracking') },
        { icon: 'wallet-outline', label: 'Facturas', onPress: () => (navigation as any).navigate('Facturas') },
        { icon: 'receipt-outline', label: 'Mis Pedidos', onPress: () => (navigation as any).navigate('Pedidos') },
        { icon: 'business-outline', label: 'Sucursales', onPress: () => (navigation as any).navigate('Sucursales') }
    ]

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                userName={userName}
                role="CLIENTE"
                showNotification={true}
                variant="home"
                onNotificationPress={() => {
                    // @ts-expect-error - Navigation is typed but routes are dynamic
                    navigation.navigate('Notifications')
                }}
            />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={false} onRefresh={() => { }} tintColor={BRAND_COLORS.red} />
                }
            >
                <AccountOverview />
                <QuickStats />
                <RecentActivity navigation={navigation} />
            </ScrollView>

            <ExpandableFab actions={fabActions} />
        </View>
    )
}
