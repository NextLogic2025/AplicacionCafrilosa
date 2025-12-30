import React from 'react'
import { View, ScrollView, RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

import { Header } from '../../../components/ui/Header'
import { ExpandableFab, type FabAction } from '../../../components/ui/ExpandableFab'
import { AccountOverview, QuickStats, RecentActivity } from '../components/DashboardComponents'

import { getUserName } from '../../../storage/authStorage'

export function ClientHomeScreen() {
    const navigation = useNavigation()
    const [userName, setUserName] = React.useState('Cliente')

    React.useEffect(() => {
        getUserName().then(name => {
            if (name) setUserName(name)
        })
    }, [])

    const fabActions: FabAction[] = [
        {
            icon: 'notifications-outline',
            label: 'Notificaciones',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('Notifications')
        },
        {
            icon: 'ticket-outline',
            label: 'Soporte',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('Soporte')
        },
        {
            icon: 'refresh-circle-outline',
            label: 'Devoluciones',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('Returns')
        },
        {
            icon: 'time-outline',
            label: 'Entregas',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('Tracking')
        },
        {
            icon: 'wallet-outline',
            label: 'Facturas',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('Facturas')
        },
        {
            icon: 'receipt-outline',
            label: 'Mis Pedidos',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('Pedidos')
        },
        {
            icon: 'pricetag-outline',
            label: 'Promociones',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('Promotions')
        }
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
