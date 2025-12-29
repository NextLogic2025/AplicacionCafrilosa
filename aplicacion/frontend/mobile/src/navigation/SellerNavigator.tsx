import * as React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { TabNavigation } from '../components/ui/TabNavigation'

// Screens
import { SellerHomeScreen } from '../features/vendedor/screens/SellerHomeScreen'
import { SellerClientsScreen } from '../features/vendedor/screens/SellerClientsScreen'
import { SellerOrderScreen } from '../features/vendedor/screens/SellerOrderScreen'
import { SellerProfileScreen } from '../features/vendedor/screens/SellerProfileScreen'
import { SellerClientDetailScreen } from '../features/vendedor/screens/SellerClientDetailScreen'

// FAB Screens
import { SellerProductsScreen } from '../features/vendedor/screens/SellerProductsScreen'
import { SellerPromotionsScreen } from '../features/vendedor/screens/SellerPromotionsScreen'
import { SellerOrdersScreen } from '../features/vendedor/screens/SellerOrderHistoryScreen'
import { SellerInvoicesScreen } from '../features/vendedor/screens/SellerInvoicesScreen'
import { SellerDeliveriesScreen } from '../features/vendedor/screens/SellerDeliveriesScreen'
import { SellerReturnsScreen } from '../features/vendedor/screens/SellerReturnsScreen'
import { SellerNotificationsScreen } from '../features/vendedor/screens/SellerNotificationsScreen'

export type SellerStackParamList = {
    SellerTabs: undefined
    SellerClientDetail: { clientId: string }
    SellerProducts: undefined
    SellerPromotions: undefined
    SellerOrdersHistory: undefined
    SellerInvoices: undefined
    SellerDeliveries: undefined
    SellerReturns: undefined
    SellerNotifications: undefined
    SellerOrder: { preselectedClient: any } | undefined
}

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator<SellerStackParamList>()

function SellerTabNavigator() {
    return (
        <Tab.Navigator
            tabBar={(props) => <TabNavigation {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="SellerHome" component={SellerHomeScreen} options={{ title: 'Inicio' }} />
            <Tab.Screen name="SellerClients" component={SellerClientsScreen} options={{ title: 'Clientes' }} />
            <Tab.Screen name="SellerOrder" component={SellerOrderScreen} options={{ title: 'Pedido' }} />
            <Tab.Screen name="SellerProfile" component={SellerProfileScreen} options={{ title: 'Perfil' }} />
        </Tab.Navigator>
    )
}

export function SellerNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="SellerTabs" component={SellerTabNavigator} />
            <Stack.Screen name="SellerClientDetail" component={SellerClientDetailScreen} />

            <Stack.Screen name="SellerProducts" component={SellerProductsScreen} />
            <Stack.Screen name="SellerPromotions" component={SellerPromotionsScreen} />
            <Stack.Screen name="SellerOrdersHistory" component={SellerOrdersScreen} />
            <Stack.Screen name="SellerInvoices" component={SellerInvoicesScreen} />
            <Stack.Screen name="SellerDeliveries" component={SellerDeliveriesScreen} />
            <Stack.Screen name="SellerReturns" component={SellerReturnsScreen} />
            <Stack.Screen name="SellerNotifications" component={SellerNotificationsScreen} />
        </Stack.Navigator>
    )
}
