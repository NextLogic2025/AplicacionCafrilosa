import React from 'react'
import { View, ScrollView, RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

import { Header } from '../../../../components/ui/Header'
import { AccountOverview, QuickStats, RecentActivity } from '../../components/DashboardComponents'

import { getUserName } from '../../../../storage/authStorage'

/**
 * ClientHomeScreen - Pantalla de Inicio del Cliente
 *
 * Muestra el dashboard del cliente con:
 * - Resumen de cuenta (saldo pendiente)
 * - Estadísticas rápidas (pedidos, facturas, entregas)
 * - Actividad reciente
 *
 * Nota: El FAB (botón flotante) se agrega automáticamente desde ClientNavigator
 */
export function ClientHomeScreen() {
    const navigation = useNavigation()
    const [userName, setUserName] = React.useState('Cliente')

    React.useEffect(() => {
        getUserName().then(name => {
            if (name) setUserName(name)
        })
    }, [])

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
        </View>
    )
}
