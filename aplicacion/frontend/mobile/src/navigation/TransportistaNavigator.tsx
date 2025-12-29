import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack'
import React from 'react'

import { TabNavigation } from '../components/ui/TabNavigation'
import { TransportistaHomeScreen } from '../features/transportista/screens/TransportistaHomeScreen'
import {
    TransportistaDeliveriesScreen,
    TransportistaHistoryScreen,
    TransportistaNotificationsScreen,
    TransportistaOrdersScreen,
    TransportistaProfileScreen,
    TransportistaReturnsScreen,
    TransportistaRoutesScreen
} from '../features/transportista/screens/TransportistaPlaceholders'

export type TransportistaTabParamList = {
    TransportistaHomeTab: undefined
    TransportistaOrders: undefined
    TransportistaDeliveries: undefined
    TransportistaProfile: undefined
}

export type TransportistaStackParamList = TransportistaTabParamList & {
    TransportistaHome: undefined
    TransportistaRoutes: undefined
    TransportistaReturns: undefined
    TransportistaHistory: undefined
    TransportistaNotifications: undefined
}

export type TransportistaNavigationProp = NativeStackNavigationProp<TransportistaStackParamList>

const Tab = createBottomTabNavigator<TransportistaTabParamList>()
const Stack = createNativeStackNavigator<TransportistaStackParamList>()

function TransportistaTabNavigator() {
    return (
        <Tab.Navigator
            tabBar={(props) => <TabNavigation {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="TransportistaHomeTab" component={TransportistaHomeScreen} options={{ title: 'Inicio' }} />
            <Tab.Screen name="TransportistaOrders" component={TransportistaOrdersScreen} options={{ title: 'Pedidos' }} />
            <Tab.Screen name="TransportistaDeliveries" component={TransportistaDeliveriesScreen} options={{ title: 'Entregas' }} />
            <Tab.Screen name="TransportistaProfile" component={TransportistaProfileScreen} options={{ title: 'Perfil' }} />
        </Tab.Navigator>
    )
}

export function TransportistaNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Group>
                <Stack.Screen name="TransportistaHome" component={TransportistaTabNavigator} options={{ title: 'Inicio' }} />
            </Stack.Group>

            <Stack.Group screenOptions={{ presentation: 'modal' }}>
                <Stack.Screen name="TransportistaRoutes" component={TransportistaRoutesScreen} options={{ title: 'Rutas' }} />
                <Stack.Screen name="TransportistaReturns" component={TransportistaReturnsScreen} options={{ title: 'Devoluciones' }} />
                <Stack.Screen name="TransportistaHistory" component={TransportistaHistoryScreen} options={{ title: 'Historial' }} />
                <Stack.Screen name="TransportistaNotifications" component={TransportistaNotificationsScreen} options={{ title: 'Notificaciones' }} />
            </Stack.Group>
        </Stack.Navigator>
    )
}
