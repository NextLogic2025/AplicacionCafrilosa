import * as React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { TabNavigation } from '../components/ui/TabNavigation'

// Screens - Organized by Module
// ModuloInicio
import { SellerHomeScreen } from '../features/vendedor/screens/ModuloInicio/SellerHomeScreen'

// ModuloClientes
import { SellerClientsScreen } from '../features/vendedor/screens/ModuloClientes/SellerClientsScreen'
import { SellerBranchDetailScreen } from '../features/vendedor/screens/ModuloClientes/SellerBranchDetailScreen'
import { SellerClientDetailScreen } from '../features/vendedor/screens/ModuloClientes/SellerClientDetailScreen'

// ModuloProductos
import { SellerProductListScreen } from '../features/vendedor/screens/ModuloProductos/SellerProductListScreen'
import { SellerProductsScreen } from '../features/vendedor/screens/ModuloProductos/SellerProductsScreen'

// ModuloCarrito
import { SellerCartScreen } from '../features/vendedor/screens/ModuloCarrito/SellerCartScreen'

// ModuloPedidos
import { SellerOrderScreen } from '../features/vendedor/screens/ModuloPedidos/SellerOrderScreen'
import { SellerOrderHistoryScreen } from '../features/vendedor/screens/ModuloPedidos/SellerOrderHistoryScreen'
import { SellerOrderDetailScreen } from '../features/vendedor/screens/ModuloPedidos/SellerOrderDetailScreen'

// ModuloPromociones
import { SellerPromotionsScreen } from '../features/vendedor/screens/ModuloPromociones/SellerPromotionsScreen'

// ModuloFacturas
import { SellerInvoicesScreen } from '../features/vendedor/screens/ModuloFacturas/SellerInvoicesScreen'

// ModuloEntregas
import { SellerDeliveriesScreen } from '../features/vendedor/screens/ModuloEntregas/SellerDeliveriesScreen'

// ModuloDevoluciones
import { SellerReturnsScreen } from '../features/vendedor/screens/ModuloDevoluciones/SellerReturnsScreen'

// ModuloNotificaciones
import { SellerNotificationsScreen } from '../features/vendedor/screens/ModuloNotificaciones/SellerNotificationsScreen'

// ModuloRutero
import { SellerRouteScreen } from '../features/vendedor/screens/ModuloRutero/SellerRouteScreen'
import { SellerRouteMapScreen } from '../features/vendedor/screens/ModuloRutero/SellerRouteMapScreen'

// ModuloPerfil
import { SellerProfileScreen } from '../features/vendedor/screens/ModuloPerfil/SellerProfileScreen'

export type SellerStackParamList = {
    SellerTabs: undefined
    SellerBranchDetail: { branch: any; clientName?: string }
    SellerProducts: undefined
    SellerPromotions: undefined
    SellerOrdersHistory: undefined
    SellerOrderDetail: { orderId: string }
    SellerInvoices: undefined
    SellerDeliveries: undefined
    SellerReturns: undefined
    SellerNotifications: undefined
    SellerRoute: undefined
    SellerRouteMap: undefined
    SellerOrder: { preselectedClient: any } | undefined
    SellerClientDetail: { clientId: string }
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
            <Tab.Screen name="SellerProductList" component={SellerProductListScreen} options={{ title: 'Productos' }} />
            <Tab.Screen name="SellerCart" component={SellerCartScreen} options={{ title: 'Carrito' }} />
            <Tab.Screen name="SellerProfile" component={SellerProfileScreen} options={{ title: 'Perfil' }} />
        </Tab.Navigator>
    )
}

export function SellerNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="SellerTabs" component={SellerTabNavigator} />
            <Stack.Screen name="SellerBranchDetail" component={SellerBranchDetailScreen} />
            <Stack.Screen name="SellerClientDetail" component={SellerClientDetailScreen} />
            <Stack.Screen name="SellerProducts" component={SellerProductsScreen} />
            <Stack.Screen name="SellerPromotions" component={SellerPromotionsScreen} />
            <Stack.Screen name="SellerOrdersHistory" component={SellerOrderHistoryScreen} />
            <Stack.Screen name="SellerOrderDetail" component={SellerOrderDetailScreen} />
            <Stack.Screen name="SellerInvoices" component={SellerInvoicesScreen} />
            <Stack.Screen name="SellerDeliveries" component={SellerDeliveriesScreen} />
            <Stack.Screen name="SellerReturns" component={SellerReturnsScreen} />
            <Stack.Screen name="SellerNotifications" component={SellerNotificationsScreen} />
            <Stack.Screen name="SellerRoute" component={SellerRouteScreen} />
            <Stack.Screen name="SellerRouteMap" component={SellerRouteMapScreen} />
        </Stack.Navigator>
    )
}
