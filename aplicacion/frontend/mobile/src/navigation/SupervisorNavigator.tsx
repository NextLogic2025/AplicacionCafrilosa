import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { View, Text, StyleSheet } from 'react-native'
import { TabNavigation } from '../components/ui/TabNavigation'

import { SupervisorDashboardScreen } from '../features/supervisor/screens/SupervisorDashboardScreen'
import { SupervisorOrdersScreen } from '../features/supervisor/screens/ModuloOrders/SupervisorOrdersScreen'
import { SupervisorDeliveriesScreen } from '../features/supervisor/screens/ModuloDeliveries/SupervisorDeliveriesScreen'
import { SupervisorTeamScreen } from '../features/supervisor/screens/ModuloMiEquipo/SupervisorTeamScreen'
import { SupervisorTeamDetailScreen } from '../features/supervisor/screens/ModuloMiEquipo/SupervisorTeamDetailScreen'
import { SupervisorProfileScreen } from '../features/supervisor/screens/ModuloPerfil/SupervisorProfileScreen'
import { ExpandableFab } from '../components/ui/ExpandableFab'

import { SupervisorClientsScreen } from '../features/supervisor/screens/ModuloCliente/SupervisorClientsScreen'
import { SupervisorClientDetailScreen } from '../features/supervisor/screens/ModuloCliente/SupervisorClientDetailScreen'
import { SupervisorClientFormScreen } from '../features/supervisor/screens/ModuloCliente/SupervisorClientFormScreen'
import { SupervisorWarehouseScreen } from '../features/supervisor/screens/ModuloAlmacen/SupervisorWarehouseScreen'
import { SupervisorReturnsScreen } from '../features/supervisor/screens/ModuloDevoluciones/SupervisorReturnsScreen'
import { SupervisorReportsScreen } from '../features/supervisor/screens/ModuloReportes/SupervisorReportsScreen'
import { SupervisorAlertsScreen } from '../features/supervisor/screens/ModuloAlertas/SupervisorAlertsScreen'
import { SupervisorZonesScreen } from '../features/supervisor/screens/ModuloZona/SupervisorZonesScreen'
import { SupervisorZoneDetailScreen } from '../features/supervisor/screens/ModuloZona/SupervisorZoneDetailScreen'
import { SupervisorZoneMapScreen } from '../features/supervisor/screens/ModuloZona/SupervisorZoneMapScreen'
import { SupervisorCatalogScreen } from '../features/supervisor/screens/ModuloProductos/SupervisorCatalogScreen'
import { SupervisorProductDetailScreen } from '../features/supervisor/screens/ModuloProductos/SupervisorProductDetailScreen'
import { SupervisorCategoriesScreen } from '../features/supervisor/screens/ModuloCategorias/SupervisorCategoriesScreen'
import { SupervisorProductFormScreen } from '../features/supervisor/screens/ModuloProductos/SupervisorProductFormScreen'
import { SupervisorPriceListsScreen } from '../features/supervisor/screens/ModuloListaPrecio/SupervisorPriceListsScreen'
import { SupervisorPromotionsScreen } from '../features/supervisor/screens/ModuloPromocion/SupervisorPromotionsScreen'
import { SupervisorPromotionFormScreen as SupervisorCampaignFormScreen } from '../features/supervisor/screens/ModuloPromocion/SupervisorPromotionFormScreen'
import { SupervisorRoutesScreen } from '../features/supervisor/screens/ModuloRutas/SupervisorRoutesScreen'
import { SupervisorRouteCreateScreen } from '../features/supervisor/screens/ModuloRutas/SupervisorRouteCreateScreen'

import { SupervisorAuditScreen } from '../features/supervisor/screens/ModuloAuditoria/SupervisorAuditScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function SupervisorTabs({ navigation }: { navigation: any }) {
    return (
        <View style={{ flex: 1 }}>
            <Tab.Navigator
                tabBar={(props) => <TabNavigation {...props} />}
                screenOptions={{ headerShown: false }}
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
                    { label: 'Rutas', icon: 'map', onPress: () => navigation.navigate('SupervisorRoutes') },
                    { label: 'Promociones', icon: 'pricetag', onPress: () => navigation.navigate('SupervisorPromotions') },
                    { label: 'Clientes', icon: 'people', onPress: () => navigation.navigate('SupervisorClients') },
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
                        icon: 'shield-checkmark-outline',
                        label: 'Auditoría',
                        onPress: () => navigation.navigate('SupervisorAudit'),
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
            <Stack.Screen name="SupervisorClientDetail" component={SupervisorClientDetailScreen} />
            <Stack.Screen name="SupervisorClientForm" component={SupervisorClientFormScreen} />
            <Stack.Screen name="SupervisorTeam" component={SupervisorTeamScreen} />
            <Stack.Screen name="SupervisorTeamDetail" component={SupervisorTeamDetailScreen} />
            <Stack.Screen name="SupervisorWarehouse" component={SupervisorWarehouseScreen} />
            <Stack.Screen name="SupervisorReturns" component={SupervisorReturnsScreen} />
            <Stack.Screen name="SupervisorReports" component={SupervisorReportsScreen} />
            <Stack.Screen name="SupervisorAlerts" component={SupervisorAlertsScreen} />

            {/* Catalog Modules */}
            <Stack.Screen name="SupervisorCatalog" component={SupervisorCatalogScreen} />
            <Stack.Screen name="SupervisorProductDetail" component={SupervisorProductDetailScreen} />
            <Stack.Screen name="SupervisorCategories" component={SupervisorCategoriesScreen} />
            <Stack.Screen name="SupervisorProductForm" component={SupervisorProductFormScreen as any} />
            <Stack.Screen name="SupervisorPriceLists" component={SupervisorPriceListsScreen} />

            <Stack.Group>
                <Stack.Screen name="SupervisorRoutes" component={SupervisorRoutesScreen} />
                <Stack.Screen name="SupervisorRouteCreate" component={SupervisorRouteCreateScreen} />
                <Stack.Screen name="SupervisorPromotions" component={SupervisorPromotionsScreen} />
                <Stack.Screen name="SupervisorPromotionForm" component={SupervisorCampaignFormScreen} />
            </Stack.Group>
            <Stack.Screen name="SupervisorZones" component={SupervisorZonesScreen} />
            <Stack.Screen name="SupervisorZoneDetail" component={SupervisorZoneDetailScreen} />
            <Stack.Screen name="SupervisorZoneMap" component={SupervisorZoneMapScreen} />
            <Stack.Screen name="SupervisorAudit" component={SupervisorAuditScreen} />
        </Stack.Navigator>
    )
}
