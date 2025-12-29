import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

import { TabNavigation } from '../components/ui/TabNavigation'
import { ClientHomeScreen } from '../features/cliente/screens/ClientHomeScreen'
import { ClientProductListScreen } from '../features/cliente/screens/ClientProductListScreen'
import { ClientCartScreen } from '../features/cliente/screens/ClientCartScreen'
import { ClientOrdersScreen } from '../features/cliente/screens/ClientOrdersScreen'
import { ClientOrderDetailScreen } from '../features/cliente/screens/ClientOrderDetailScreen'
import { ClientTrackingScreen } from '../features/cliente/screens/ClientTrackingScreen'
import { ClientSupportScreen } from '../features/cliente/screens/ClientSupportScreen'
import { ClientCreateTicketScreen } from '../features/cliente/screens/ClientCreateTicketScreen'
import { ClientInvoicesScreen } from '../features/cliente/screens/ClientInvoicesScreen'
import { ClientInvoiceDetailScreen } from '../features/cliente/screens/ClientInvoiceDetailScreen'
import { ClientProfileScreen } from '../features/cliente/screens/ClientProfileScreen'
import { ClientNotificationsScreen } from '../features/cliente/screens/ClientNotificationsScreen'
import { ClientReturnsScreen } from '../features/cliente/screens/ClientReturnsScreen'
import { ClientPromotionsScreen } from '../features/cliente/screens/ClientPromotionsScreen'
import { PlaceholderScreen } from '../features/shared/screens/PlaceholderScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function OrdersStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="OrdersList" component={ClientOrdersScreen} />
            <Stack.Screen name="OrderDetail" component={ClientOrderDetailScreen} />
        </Stack.Navigator>
    )
}

function SupportStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="SupportList" component={ClientSupportScreen} />
            <Stack.Screen name="CreateTicket" component={ClientCreateTicketScreen} />
        </Stack.Navigator>
    )
}

function InvoicesStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="InvoicesList" component={ClientInvoicesScreen} />
            <Stack.Screen name="InvoiceDetail" component={ClientInvoiceDetailScreen} />
        </Stack.Navigator>
    )
}

// --- TABS (Vista Principal) ---
function ClientTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <TabNavigation {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="Inicio" component={ClientHomeScreen} />
            <Tab.Screen
                name="Productos"
                component={ClientProductListScreen}
            />
            <Tab.Screen
                name="Carrito"
                component={ClientCartScreen}
            />
            <Tab.Screen name="Perfil" component={ClientProfileScreen} />
        </Tab.Navigator>
    )
}

// --- ROOT NAVIGATOR (Maneja Tabs + Pantallas Globales como Soporte/Facturas) ---
export function ClientNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={ClientTabs} />

            <Stack.Screen name="Tracking" component={ClientTrackingScreen} />
            <Stack.Screen name="Notifications" component={ClientNotificationsScreen} />
            <Stack.Screen name="Returns" component={ClientReturnsScreen} />
            <Stack.Screen name="Promotions" component={ClientPromotionsScreen} />

            {/* Stacks de funcionalidades */}
            <Stack.Screen name="Pedidos" component={OrdersStack} />
            <Stack.Screen name="Soporte" component={SupportStack} />
            <Stack.Screen name="Facturas" component={InvoicesStack} />
        </Stack.Navigator>
    )
}
