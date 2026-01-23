import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as React from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../shared/types'
import { useNavigation } from '@react-navigation/native'

import { TabNavigation } from '../components/ui/TabNavigation'
import { ExpandableFab, type FabAction } from '../components/ui/ExpandableFab'

// Importaciones modulares - Cliente
import { ClientHomeScreen } from '../features/cliente/screens/ModuloInicio/ClientHomeScreen'
import { ClientProductListScreen } from '../features/cliente/screens/ModuloProductos/ClientProductListScreen'
import { ClientProductDetailScreen } from '../features/cliente/screens/ModuloProductos/ClientProductDetailScreen'
import { ClientCartScreen } from '../features/cliente/screens/ModuloCarrito/ClientCartScreen'
import { ClientCheckoutScreen } from '../features/cliente/screens/ModuloCarrito/ClientCheckoutScreen'
import { ClientOrdersScreen } from '../features/cliente/screens/ModuloPedidos/ClientOrdersScreen'
import { ClientOrderDetailScreen } from '../features/cliente/screens/ModuloPedidos/ClientOrderDetailScreen'
import { ClientPaymentMethodScreen } from '../features/cliente/screens/ModuloPedidos/ClientPaymentMethodScreen'
import { ClientInvoicesScreen } from '../features/cliente/screens/ModuloFacturas/ClientInvoicesScreen'
import { ClientInvoiceDetailScreen } from '../features/cliente/screens/ModuloFacturas/ClientInvoiceDetailScreen'
import { ClientSupportScreen } from '../features/cliente/screens/ModuloSoporte/ClientSupportScreen'
import { ClientCreateTicketScreen } from '../features/cliente/screens/ModuloSoporte/ClientCreateTicketScreen'
import { ClientProfileScreen } from '../features/cliente/screens/ModuloPerfil/ClientProfileScreen'
import { ClientNotificationsScreen } from '../features/cliente/screens/ModuloNotificaciones/ClientNotificationsScreen'
import { ClientReturnsScreen } from '../features/cliente/screens/ModuloDevoluciones/ClientReturnsScreen'
import { ClientPromotionsScreen } from '../features/cliente/screens/ModuloPromociones/ClientPromotionsScreen'
import { ClientTrackingScreen } from '../features/cliente/screens/ModuloTracking/ClientTrackingScreen'
import { PlaceholderScreen } from '../features/shared/screens/PlaceholderScreen'

import { ClientSucursalesScreen } from '../features/cliente/screens/ModuloSucursal/ClientSucursales'
import { ClientDetallesSucursalesScreen } from '../features/cliente/screens/ModuloSucursal/ClientDetallesSucursales'
import { CrearClienteSucursalesScreen } from '../features/cliente/screens/ModuloSucursal/CrearClienteSucursales'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function OrdersStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="OrdersList" component={ClientOrdersScreen} />
            <Stack.Screen name="OrderDetail" component={ClientOrderDetailScreen} />
            <Stack.Screen name="ClientPaymentMethod" component={ClientPaymentMethodScreen} />
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

function BranchesStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ClientSucursales" component={ClientSucursalesScreen} />
            <Stack.Screen name="ClientDetallesSucursales" component={ClientDetallesSucursalesScreen} />
            <Stack.Screen name="CrearClienteSucursales" component={CrearClienteSucursalesScreen} />
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
                // Evita que el TabNavigation se oculte o se mueva cuando aparece el teclado
                tabBarStyle: {
                    position: 'absolute',
                },
            }}
        >
            <Tab.Screen name="Inicio" component={ClientHomeScreen} />
            <Tab.Screen name="Productos" component={ClientProductListScreen} />
            <Tab.Screen name="Carrito" component={ClientCartScreen} />
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
            <Stack.Screen name="ClientProductDetail" component={ClientProductDetailScreen} />
            <Stack.Screen name="ClientCheckout" component={ClientCheckoutScreen} />

            {/* Stacks de funcionalidades */}
            <Stack.Screen name="Pedidos" component={OrdersStack} />
            <Stack.Screen name="Soporte" component={SupportStack} />
            <Stack.Screen name="Facturas" component={InvoicesStack} />
            <Stack.Screen name="Sucursales" component={BranchesStack} />
        </Stack.Navigator>
    )
}
