import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { View, Text, StyleSheet } from 'react-native'

import { SupervisorDashboardScreen } from '../features/supervisor/screens/SupervisorDashboardScreen'
import { SupervisorOrdersScreen } from '../features/supervisor/screens/SupervisorOrdersScreen'
import { SupervisorDeliveriesScreen } from '../features/supervisor/screens/SupervisorDeliveriesScreen'
import { SupervisorTeamScreen } from '../features/supervisor/screens/SupervisorTeamScreen'
import { SupervisorTeamDetailScreen } from '../features/supervisor/screens/SupervisorTeamDetailScreen'
import { SupervisorProfileScreen } from '../features/supervisor/screens/SupervisorProfileScreen'
import { ExpandableFab } from '../components/ui/ExpandableFab'

import { SupervisorClientsScreen } from '../features/supervisor/screens/SupervisorClientsScreen'
import { SupervisorClientFormScreen } from '../features/supervisor/screens/SupervisorClientFormScreen'
import { SupervisorWarehouseScreen } from '../features/supervisor/screens/SupervisorWarehouseScreen'
import { SupervisorReturnsScreen } from '../features/supervisor/screens/SupervisorReturnsScreen'
import { SupervisorReportsScreen } from '../features/supervisor/screens/SupervisorReportsScreen'
import { SupervisorAlertsScreen } from '../features/supervisor/screens/SupervisorAlertsScreen'
import { SupervisorZonesScreen } from '../features/supervisor/screens/SupervisorZonesScreen'
import { SupervisorZoneDetailScreen } from '../features/supervisor/screens/SupervisorZoneDetailScreen'
import { SupervisorCatalogScreen } from '../features/supervisor/screens/SupervisorCatalogScreen'
import { SupervisorCategoriesScreen } from '../features/supervisor/screens/SupervisorCategoriesScreen'
import { SupervisorProductFormScreen } from '../features/supervisor/screens/SupervisorProductFormScreen'
import { SupervisorPriceListsScreen } from '../features/supervisor/screens/SupervisorPriceListsScreen'
import { SupervisorPromotionsScreen } from '../features/supervisor/screens/SupervisorPromotionsScreen'
import { SupervisorPromotionFormScreen } from '../features/supervisor/screens/SupervisorPromotionFormScreen'

import { SupervisorAuditScreen } from '../features/supervisor/screens/SupervisorAuditScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function SupervisorTabs({ navigation }: { navigation: any }) {
    return (
        <View style={{ flex: 1 }}>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarActiveTintColor: BRAND_COLORS.red,
                    tabBarInactiveTintColor: 'gray',
                    tabBarStyle: {
                        height: 60,
                        paddingBottom: 8,
                        paddingTop: 8,
                    },
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName: any

                        if (route.name === 'Inicio') {
                            iconName = focused ? 'home' : 'home-outline'
                        } else if (route.name === 'Pedidos') {
                            iconName = focused ? 'cart' : 'cart-outline'
                        } else if (route.name === 'Entregas') {
                            iconName = focused ? 'truck' : 'truck-outline'
                        } else if (route.name === 'Equipo') {
                            iconName = focused ? 'people' : 'people-outline'
                        } else if (route.name === 'Perfil') {
                            iconName = focused ? 'person' : 'person-outline'
                        }

                        return <Ionicons name={iconName} size={size} color={color} />
                    },
                })}
            >
                <Tab.Screen name="Inicio" component={SupervisorDashboardScreen} />
                <Tab.Screen name="Pedidos" component={SupervisorOrdersScreen} />
                <Tab.Screen name="Entregas" component={SupervisorDeliveriesScreen} />
                <Tab.Screen name="Equipo" component={SupervisorTeamScreen} />
                <Tab.Screen name="Perfil" component={SupervisorProfileScreen} />
            </Tab.Navigator>

            <ExpandableFab
                actions={[
                    {
                        icon: 'list',
                        label: 'Catálogo',
                        onPress: () => navigation.navigate('SupervisorCatalog'),
                    },
                    {
                        icon: 'people',
                        label: 'Clientes',
                        onPress: () => navigation.navigate('SupervisorClients'),
                    },
                    {
                        icon: 'cube',
                        label: 'Bodega',
                        onPress: () => navigation.navigate('SupervisorWarehouse'),
                    },
                    {
                        icon: 'arrow-undo',
                        label: 'Devoluciones',
                        onPress: () => navigation.navigate('SupervisorReturns'),
                    },
                    {
                        icon: 'bar-chart',
                        label: 'Reportes',
                        onPress: () => navigation.navigate('SupervisorReports'),
                    },
                    {
                        icon: 'map',
                        label: 'Zonas',
                        onPress: () => navigation.navigate('SupervisorZones'),
                    },
                    {
                        icon: 'alert-circle',
                        label: 'Alertas',
                        onPress: () => navigation.navigate('SupervisorAlerts'),
                    },
                    {
                        icon: 'pricetag',
                        label: 'Promociones',
                        onPress: () => navigation.navigate('SupervisorPromotions'),
                    },
                ]}
            />
        </View>
    )
}

export function SupervisorNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="SupervisorTabs" component={SupervisorTabs} />
            <Stack.Screen name="SupervisorClients" component={SupervisorClientsScreen} />
            <Stack.Screen name="SupervisorClientForm" component={SupervisorClientFormScreen} />
            <Stack.Screen name="SupervisorTeam" component={SupervisorTeamScreen} />
            <Stack.Screen name="SupervisorTeamDetail" component={SupervisorTeamDetailScreen} />
            <Stack.Screen name="SupervisorWarehouse" component={SupervisorWarehouseScreen} />
            <Stack.Screen name="SupervisorReturns" component={SupervisorReturnsScreen} />
            <Stack.Screen name="SupervisorReports" component={SupervisorReportsScreen} />
            <Stack.Screen name="SupervisorAlerts" component={SupervisorAlertsScreen} />

            {/* Catalog Modules */}
            <Stack.Screen name="SupervisorCatalog" component={SupervisorCatalogScreen} />
            <Stack.Screen name="SupervisorCategories" component={SupervisorCategoriesScreen} />
            <Stack.Screen name="SupervisorProductForm" component={SupervisorProductFormScreen} />
            <Stack.Screen name="SupervisorPriceLists" component={SupervisorPriceListsScreen} />
            <Stack.Screen name="SupervisorPromotions" component={SupervisorPromotionsScreen} />
            <Stack.Screen name="SupervisorPromotionForm" component={SupervisorPromotionFormScreen} />
            <Stack.Screen name="SupervisorZones" component={SupervisorZonesScreen} />
            <Stack.Screen name="SupervisorZoneDetail" component={SupervisorZoneDetailScreen} />
            <Stack.Screen name="SupervisorAudit" component={SupervisorAuditScreen} />
        </Stack.Navigator>
    )
}
