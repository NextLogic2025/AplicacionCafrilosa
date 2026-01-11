import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as React from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { useNavigation } from '@react-navigation/native'

import { TabNavigation } from '../components/ui/TabNavigation'
import { ExpandableFab, type FabAction } from '../components/ui/ExpandableFab'
import { ClientHomeScreen } from '../features/cliente/screens/ClientHomeScreen'
import { ClientProductListScreen } from '../features/cliente/screens/ClientProductListScreen'
import { ClientCartScreen } from '../features/cliente/screens/ClientCartScreen'
import { ClientCheckoutScreen } from '../features/cliente/screens/ClientCheckoutScreen'
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
import { ClientProductDetailScreen } from '../features/cliente/screens/ClientProductDetailScreen'
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

/**
 * TabWithFab - Wrapper que agrega el FAB a las pantallas del tab
 *
 * Envuelve cada pantalla del tab con el FAB (botón flotante)
 * Recibe el nombre de la ruta para decidir si mostrar el FAB
 */
function TabWithFab({ children, routeName }: { children: React.ReactNode; routeName: string }) {
    const navigation = useNavigation()

    const fabActions: FabAction[] = [
        { icon: 'notifications-outline', label: 'Notificaciones', onPress: () => (navigation as any).navigate('Notifications') },
        { icon: 'ticket-outline', label: 'Soporte', onPress: () => (navigation as any).navigate('Soporte') },
        { icon: 'refresh-circle-outline', label: 'Devoluciones', onPress: () => (navigation as any).navigate('Returns') },
        { icon: 'time-outline', label: 'Entregas', onPress: () => (navigation as any).navigate('Tracking') },
        { icon: 'wallet-outline', label: 'Facturas', onPress: () => (navigation as any).navigate('Facturas') },
        { icon: 'receipt-outline', label: 'Mis Pedidos', onPress: () => (navigation as any).navigate('Pedidos') }
    ]

    // No mostrar FAB en Perfil ni en Carrito
    const shouldShowFab = routeName !== 'Perfil' && routeName !== 'Carrito'

    return (
        <View style={{ flex: 1 }}>
            {children}
            {shouldShowFab && <ExpandableFab actions={fabActions} />}
        </View>
    )
}

// --- TABS (Vista Principal) ---
function ClientTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <TabNavigation {...props} />}
            screenOptions={{
                headerShown: false,
                // Evita que el TabNavigation se oculte o se mueva cuando aparece el teclado
                tabBarStyle: {
                    position: 'absolute',
                },
            }}
        >
            <Tab.Screen name="Inicio">
                {() => <TabWithFab routeName="Inicio"><ClientHomeScreen /></TabWithFab>}
            </Tab.Screen>
            <Tab.Screen name="Productos">
                {() => <TabWithFab routeName="Productos"><ClientProductListScreen /></TabWithFab>}
            </Tab.Screen>
            <Tab.Screen name="Carrito">
                {() => <TabWithFab routeName="Carrito"><ClientCartScreen /></TabWithFab>}
            </Tab.Screen>
            <Tab.Screen name="Perfil">
                {() => <TabWithFab routeName="Perfil"><ClientProfileScreen /></TabWithFab>}
            </Tab.Screen>
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
            <Stack.Screen name="ClientProductDetail" component={ClientProductDetailScreen} />
            <Stack.Screen name="ClientCheckout" component={ClientCheckoutScreen} />

            {/* Stacks de funcionalidades */}
            <Stack.Screen name="Pedidos" component={OrdersStack} />
            <Stack.Screen name="Soporte" component={SupportStack} />
            <Stack.Screen name="Facturas" component={InvoicesStack} />
        </Stack.Navigator>
    )
}
