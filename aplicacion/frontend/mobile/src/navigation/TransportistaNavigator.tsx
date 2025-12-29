import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
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

export type TransportistaStackParamList = {
    TransportistaTabs: undefined
    TransportistaRoutes: undefined
    TransportistaReturns: undefined
    TransportistaHistory: undefined
    TransportistaNotifications: undefined
}

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator<TransportistaStackParamList>()

function TransportistaTabNavigator() {
    return (
        <Tab.Navigator
            tabBar={(props) => <TabNavigation {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="TransportistaHome" component={TransportistaHomeScreen} options={{ title: 'Inicio' }} />
            <Tab.Screen name="TransportistaOrders" component={TransportistaOrdersScreen} options={{ title: 'Pedidos' }} />
            <Tab.Screen name="TransportistaDeliveries" component={TransportistaDeliveriesScreen} options={{ title: 'Entregas' }} />
            <Tab.Screen name="TransportistaProfile" component={TransportistaProfileScreen} options={{ title: 'Perfil' }} />
        </Tab.Navigator>
    )
}

export function TransportistaNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="TransportistaTabs" component={TransportistaTabNavigator} />

            <Stack.Screen name="TransportistaRoutes" component={TransportistaRoutesScreen} />
            <Stack.Screen name="TransportistaReturns" component={TransportistaReturnsScreen} />
            <Stack.Screen name="TransportistaHistory" component={TransportistaHistoryScreen} />
            <Stack.Screen name="TransportistaNotifications" component={TransportistaNotificationsScreen} />
        </Stack.Navigator>
    )
}
