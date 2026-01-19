import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../shared/types'

// Screens
// Screens
import { WarehouseHomeScreen } from '../features/bodeguero/screens/ModuloInicio/WarehouseHomeScreen'
import { WarehouseInventoryScreen } from '../features/bodeguero/screens/ModuloInventario/WarehouseInventoryScreen'
import { WarehouseProfileScreen } from '../features/bodeguero/screens/ModuloPerfil/WarehouseProfileScreen'

// FAB Screens
import { WarehouseLotsScreen } from '../features/bodeguero/screens/ModuloInventario/WarehouseLotsScreen'
import { WarehouseStockListScreen } from '../features/bodeguero/screens/ModuloInventario/WarehouseStockListScreen'
import { WarehouseStockFormScreen } from '../features/bodeguero/screens/ModuloInventario/WarehouseStockFormScreen'
import { WarehouseLoteFormScreen } from '../features/bodeguero/screens/ModuloInventario/WarehouseLoteFormScreen'
import { WarehousePreparationScreen } from '../features/bodeguero/screens/ModuloPedidos/WarehousePreparationScreen'
import { WarehouseDispatchScreen } from '../features/bodeguero/screens/ModuloPedidos/WarehouseDispatchScreen'
import { WarehouseReturnsScreen } from '../features/bodeguero/screens/ModuloDevoluciones/WarehouseReturnsScreen'
import { WarehouseNotificationsScreen } from '../features/bodeguero/screens/ModuloNotificaciones/WarehouseNotificationsScreen'
import { WarehouseAlmacenesScreen } from '../features/bodeguero/screens/ModuloAlmacenes/WarehouseAlmacenesScreen'
import { WarehouseAlmacenFormScreen } from '../features/bodeguero/screens/ModuloAlmacenes/WarehouseAlmacenFormScreen'
import { WarehouseUbicacionesListScreen } from '../features/bodeguero/screens/ModuloUbicacionAlmacen/WarehouseUbicacionesListScreen'
import { WarehouseUbicacionFormScreen } from '../features/bodeguero/screens/ModuloUbicacionAlmacen/WarehouseUbicacionFormScreen'
import { WarehousePickingListScreen } from '../features/bodeguero/screens/ModuloPicking/WarehousePickingListScreen'
import { WarehousePickingDetailScreen } from '../features/bodeguero/screens/ModuloPicking/WarehousePickingDetailScreen'
import { WarehousePickingHistoryScreen } from '../features/bodeguero/screens/ModuloPicking/WarehousePickingHistoryScreen'
import { WarehouseReservationsScreen } from '../features/bodeguero/screens/ModuloReservas/WarehouseReservationsScreen'

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
                name="WarehousePicking"
                component={WarehousePickingListScreen}
                options={{
                    tabBarLabel: 'Picking',
                    tabBarIcon: ({ color, size }) => <Ionicons name="clipboard-outline" size={size} color={color} />
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
            <Stack.Screen name="WarehouseStock" component={WarehouseStockListScreen} />
            <Stack.Screen name="WarehouseStockForm" component={WarehouseStockFormScreen} />
            <Stack.Screen name="WarehouseLoteForm" component={WarehouseLoteFormScreen} />
            <Stack.Screen name="WarehousePreparation" component={WarehousePreparationScreen} />
            <Stack.Screen name="WarehouseDispatch" component={WarehouseDispatchScreen} />
            <Stack.Screen name="WarehouseReturns" component={WarehouseReturnsScreen} />
            <Stack.Screen name="WarehouseNotifications" component={WarehouseNotificationsScreen} />
            <Stack.Screen name="WarehouseAlmacenes" component={WarehouseAlmacenesScreen} />
            <Stack.Screen name="WarehouseAlmacenForm" component={WarehouseAlmacenFormScreen} />
            <Stack.Screen name="WarehouseUbicaciones" component={WarehouseUbicacionesListScreen} />
            <Stack.Screen name="WarehouseUbicacionForm" component={WarehouseUbicacionFormScreen} />
            <Stack.Screen name="WarehousePickingList" component={WarehousePickingListScreen} />
            <Stack.Screen name="WarehousePickingDetail" component={WarehousePickingDetailScreen} />
            <Stack.Screen name="WarehousePickingHistory" component={WarehousePickingHistoryScreen} />
            <Stack.Screen name="WarehouseReservations" component={WarehouseReservationsScreen} />
        </Stack.Navigator>
    )
}
