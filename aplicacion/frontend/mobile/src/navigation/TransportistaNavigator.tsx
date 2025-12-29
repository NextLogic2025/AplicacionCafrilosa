import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'

import { TabNavigation } from '../components/ui/TabNavigation'

// Screens
import { TransportistaHomeScreen } from '../features/transportista/screens/TransportistaHomeScreen'
import { TransportistaOrdersScreen } from '../features/transportista/screens/TransportistaOrdersScreen'
import { TransportistaOrderDetailScreen } from '../features/transportista/screens/TransportistaOrderDetailScreen'
import { TransportistaDeliveriesScreen } from '../features/transportista/screens/TransportistaDeliveriesScreen'
// import { TransportistaDeliveryDetailScreen } from '../features/transportista/screens/TransportistaDeliveryDetailScreen' // To be implemented
import { TransportistaProfileScreen } from '../features/transportista/screens/TransportistaProfileScreen'

// Fab/Modal Screens
import { TransportistaRoutesScreen } from '../features/transportista/screens/TransportistaRoutesScreen'
import { TransportistaReturnsScreen } from '../features/transportista/screens/TransportistaReturnsScreen'
import { TransportistaHistoryScreen } from '../features/transportista/screens/TransportistaHistoryScreen'
import { TransportistaNotificationsScreen } from '../features/transportista/screens/TransportistaNotificationsScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

/**
 * Transportista Orders Stack
 * Allows navigation from Orders List -> Order Detail
 */
function TransportistaOrdersStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="TransportistaOrdersList" component={TransportistaOrdersScreen} />
            <Stack.Screen name="TransportistaOrderDetail" component={TransportistaOrderDetailScreen} />
        </Stack.Navigator>
    )
}

/**
 * Main Tab Navigator (Bottom Bar)
 */
function TransportistaTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <TabNavigation {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="TransportistaHome" component={TransportistaHomeScreen} options={{ title: 'Inicio' }} />
            <Tab.Screen name="TransportistaOrders" component={TransportistaOrdersStack} options={{ title: 'Pedidos' }} />
            <Tab.Screen name="TransportistaDeliveries" component={TransportistaDeliveriesScreen} options={{ title: 'Entregas' }} />
            <Tab.Screen name="TransportistaProfile" component={TransportistaProfileScreen} options={{ title: 'Perfil' }} />
        </Tab.Navigator>
    )
}

/**
 * Root Transportista Navigator
 */
export function TransportistaNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Main Tabs */}
            <Stack.Screen name="MainTabs" component={TransportistaTabs} />

            {/* Modal Screens / FAB Actions */}
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
                <Stack.Screen name="Rutas" component={TransportistaRoutesScreen} />
                <Stack.Screen name="Devoluciones" component={TransportistaReturnsScreen} />
                <Stack.Screen name="Historial" component={TransportistaHistoryScreen} />
                <Stack.Screen name="Notificaciones" component={TransportistaNotificationsScreen} />
            </Stack.Group>
        </Stack.Navigator>
    )
}
