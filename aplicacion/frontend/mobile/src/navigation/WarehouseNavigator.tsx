import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

// Screens
// Screens
import { WarehouseHomeScreen } from '../features/bodeguero/screens/ModuloInicio/WarehouseHomeScreen'
import { WarehouseOrdersScreen } from '../features/bodeguero/screens/ModuloPedidos/WarehouseOrdersScreen'
import { WarehouseInventoryScreen } from '../features/bodeguero/screens/ModuloInventario/WarehouseInventoryScreen'
import { WarehouseProfileScreen } from '../features/bodeguero/screens/ModuloPerfil/WarehouseProfileScreen'

// FAB Screens
import { WarehouseLotsScreen } from '../features/bodeguero/screens/ModuloInventario/WarehouseLotsScreen'
import { WarehousePreparationScreen } from '../features/bodeguero/screens/ModuloPedidos/WarehousePreparationScreen'
import { WarehouseDispatchScreen } from '../features/bodeguero/screens/ModuloPedidos/WarehouseDispatchScreen'
import { WarehouseReturnsScreen } from '../features/bodeguero/screens/ModuloDevoluciones/WarehouseReturnsScreen'
import { WarehouseNotificationsScreen } from '../features/bodeguero/screens/ModuloNotificaciones/WarehouseNotificationsScreen'

import { TabNavigation } from '../components/ui/TabNavigation'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function WarehouseTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <TabNavigation {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="WarehouseHome"
                component={WarehouseHomeScreen}
                options={{
                    tabBarLabel: 'Inicio',
                    tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />
                }}
            />
            <Tab.Screen
                name="WarehouseOrders"
                component={WarehouseOrdersScreen}
                options={{
                    tabBarLabel: 'Pedidos',
                    tabBarIcon: ({ color, size }) => <Ionicons name="download" size={size} color={color} />
                }}
            />
            <Tab.Screen
                name="WarehouseInventory"
                component={WarehouseInventoryScreen}
                options={{
                    tabBarLabel: 'Inventario',
                    tabBarIcon: ({ color, size }) => <Ionicons name="cube" size={size} color={color} />
                }}
            />
            <Tab.Screen
                name="WarehouseProfile"
                component={WarehouseProfileScreen}
                options={{
                    tabBarLabel: 'Perfil',
                    tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />
                }}
            />
        </Tab.Navigator>
    )
}

export function WarehouseNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FAFAFA' } }}>
            <Stack.Screen name="WarehouseMain" component={WarehouseTabs} />

            {/* FAB Screens */}
            <Stack.Screen name="WarehouseLots" component={WarehouseLotsScreen} />
            <Stack.Screen name="WarehousePreparation" component={WarehousePreparationScreen} />
            <Stack.Screen name="WarehouseDispatch" component={WarehouseDispatchScreen} />
            <Stack.Screen name="WarehouseReturns" component={WarehouseReturnsScreen} />
            <Stack.Screen name="WarehouseNotifications" component={WarehouseNotificationsScreen} />
        </Stack.Navigator>
    )
}
