import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../shared/types'
import { View, Text, StyleSheet } from 'react-native'
import { TabNavigation } from '../components/ui/TabNavigation'

import { SupervisorDashboardScreen } from '../features/supervisor/screens/SupervisorDashboardScreen'
import { SupervisorOrdersScreen } from '../features/supervisor/screens/ModuloOrders/SupervisorOrdersScreen'
import { SupervisorOrderDetailScreen } from '../features/supervisor/screens/ModuloOrders/SupervisorOrderDetailScreen'
import { SupervisorVehiclesListScreen } from '../features/supervisor/screens/ModuloVehiculos/SupervisorVehiclesListScreen'
import { SupervisorVehicleFormScreen } from '../features/supervisor/screens/ModuloVehiculos/SupervisorVehicleFormScreen'
import { SupervisorVehicleDetailScreen } from '../features/supervisor/screens/ModuloVehiculos/SupervisorVehicleDetailScreen'
import { SupervisorTeamScreen } from '../features/supervisor/screens/ModuloMiEquipo/SupervisorTeamScreen'
import { SupervisorTeamDetailScreen } from '../features/supervisor/screens/ModuloMiEquipo/SupervisorTeamDetailScreen'
import { SupervisorProfileScreen } from '../features/supervisor/screens/ModuloPerfil/SupervisorProfileScreen'
import { ExpandableFab } from '../components/ui/ExpandableFab'

import { SupervisorClientsScreen } from '../features/supervisor/screens/ModuloCliente/SupervisorClientsScreen'
import { SupervisorClientDetailScreen } from '../features/supervisor/screens/ModuloCliente/SupervisorClientDetailScreen'
import { SupervisorClientFormScreen } from '../features/supervisor/screens/ModuloCliente/SupervisorClientFormScreen'
import { SupervisorWarehouseScreen } from '../features/supervisor/screens/ModuloAlmacen/SupervisorWarehouseScreen'
import { SupervisorUbicacionesListScreen } from '../features/supervisor/screens/ModuloAlmacen/SupervisorUbicacionesListScreen'
import { WarehouseUbicacionFormScreen } from '../features/bodeguero/screens/ModuloUbicacionAlmacen/WarehouseUbicacionFormScreen'
import { SupervisorAlmacenesListScreen } from '../features/supervisor/screens/ModuloAlmacen/SupervisorAlmacenesListScreen'
import { WarehouseAlmacenFormScreen } from '../features/bodeguero/screens/ModuloAlmacenes/WarehouseAlmacenFormScreen'
import { SupervisorLotesListScreen } from '../features/supervisor/screens/ModuloLotes/SupervisorLotesListScreen'
import { SupervisorLoteFormScreen } from '../features/supervisor/screens/ModuloLotes/SupervisorLoteFormScreen'
import { SupervisorStockListScreen } from '../features/supervisor/screens/ModuloStock/SupervisorStockListScreen'
import { SupervisorStockFormScreen } from '../features/supervisor/screens/ModuloStock/SupervisorStockFormScreen'
import { SupervisorPickingListScreen } from '../features/supervisor/screens/ModuloPicking/SupervisorPickingListScreen'
import { SupervisorPickingDetailScreen } from '../features/supervisor/screens/ModuloPicking/SupervisorPickingDetailScreen'
import { SupervisorPickingCreateScreen } from '../features/supervisor/screens/ModuloPicking/SupervisorPickingCreateScreen'
import { SupervisorReservationsScreen } from '../features/supervisor/screens/ModuloReservas/SupervisorReservationsScreen'
import { SupervisorReturnsScreen } from '../features/supervisor/screens/ModuloDevoluciones/SupervisorReturnsScreen'
import { SupervisorReportsScreen } from '../features/supervisor/screens/ModuloReportes/SupervisorReportsScreen'
import { SupervisorAlertsScreen } from '../features/supervisor/screens/ModuloAlertas/SupervisorAlertsScreen'
import { SupervisorZonesScreen } from '../features/supervisor/screens/ModuloZona/SupervisorZonesScreen'
import { SupervisorZoneDetailScreen } from '../features/supervisor/screens/ModuloZona/SupervisorZoneDetailScreen'
import { SupervisorZoneFormScreen } from '../features/supervisor/screens/ModuloZona/SupervisorZoneFormScreen'
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
import { SupervisorRouteScheduleScreen } from '../features/supervisor/screens/ModuloRutas/SupervisorRouteScheduleScreen'
import { SupervisorRouteDetailScreen } from '../features/supervisor/screens/ModuloRutas/SupervisorRouteDetailScreen'
import { SupervisorRoutesInactiveScreen } from '../features/supervisor/screens/ModuloRutas/SupervisorRoutesInactiveScreen'
import { SupervisorConductoresListScreen } from '../features/supervisor/screens/ModuloConductores/SupervisorConductoresListScreen'
import { SupervisorConductorFormScreen } from '../features/supervisor/screens/ModuloConductores/SupervisorConductorFormScreen'
import { SupervisorConductorDetailScreen } from '../features/supervisor/screens/ModuloConductores/SupervisorConductorDetailScreen'
import { SupervisorDespachosListScreen } from '../features/supervisor/screens/ModuloDespachos/SupervisorDespachosListScreen'
import { SupervisorDespachoFormScreen } from '../features/supervisor/screens/ModuloDespachos/SupervisorDespachoFormScreen'
import { SupervisorDespachoDetailScreen } from '../features/supervisor/screens/ModuloDespachos/SupervisorDespachoDetailScreen'

import { SupervisorInvoicesScreen } from '../features/supervisor/screens/ModuloFacturas/SupervisorInvoicesScreen'
import { SupervisorInvoiceDetailScreen } from '../features/supervisor/screens/ModuloFacturas/SupervisorInvoiceDetailScreen'

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
                <Tab.Screen name="Vehículos" component={SupervisorVehiclesListScreen} />
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
                        icon: 'document-text',
                        label: 'Despacho',
                        onPress: () => navigation.navigate('SupervisorDespachosList'),
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
                        icon: 'receipt-outline',
                        label: 'Facturas',
                        onPress: () => navigation.navigate('SupervisorInvoices'),
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
            <Stack.Screen name="SupervisorOrderDetail" component={SupervisorOrderDetailScreen} />
            <Stack.Screen name="SupervisorClients" component={SupervisorClientsScreen} />
            <Stack.Screen name="SupervisorClientDetail" component={SupervisorClientDetailScreen} />
            <Stack.Screen name="SupervisorClientForm" component={SupervisorClientFormScreen} />
            <Stack.Screen name="SupervisorTeam" component={SupervisorTeamScreen} />
            <Stack.Screen name="SupervisorTeamDetail" component={SupervisorTeamDetailScreen} />
            <Stack.Screen name="SupervisorWarehouse" component={SupervisorWarehouseScreen} />
            <Stack.Screen name="SupervisorAlmacenes" component={SupervisorAlmacenesListScreen} />
            <Stack.Screen name="SupervisorUbicaciones" component={SupervisorUbicacionesListScreen} />
            <Stack.Screen name="SupervisorUbicacionForm" component={WarehouseUbicacionFormScreen} />
            <Stack.Screen name="SupervisorAlmacenForm" component={WarehouseAlmacenFormScreen} />
            <Stack.Screen name="SupervisorLotes" component={SupervisorLotesListScreen} />
            <Stack.Screen name="SupervisorLoteForm" component={SupervisorLoteFormScreen} />
            <Stack.Screen name="SupervisorStock" component={SupervisorStockListScreen} />
            <Stack.Screen name="SupervisorStockForm" component={SupervisorStockFormScreen} />
            <Stack.Screen name="SupervisorPickingList" component={SupervisorPickingListScreen} />
            <Stack.Screen name="SupervisorPickingDetail" component={SupervisorPickingDetailScreen} />
            <Stack.Screen name="SupervisorPickingCreate" component={SupervisorPickingCreateScreen} />
            <Stack.Screen name="SupervisorReservations" component={SupervisorReservationsScreen} />
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
                <Stack.Screen name="SupervisorRouteCreatePaso2" component={SupervisorRouteScheduleScreen} />
                <Stack.Screen name="SupervisorRouteDetail" component={SupervisorRouteDetailScreen} />
                <Stack.Screen name="SupervisorRoutesInactive" component={SupervisorRoutesInactiveScreen} />
                <Stack.Screen name="SupervisorPromotions" component={SupervisorPromotionsScreen} />
                <Stack.Screen name="SupervisorPromotionForm" component={SupervisorCampaignFormScreen} />
            </Stack.Group>
            <Stack.Screen name="SupervisorZones" component={SupervisorZonesScreen} />
            <Stack.Screen name="SupervisorZoneDetail" component={SupervisorZoneDetailScreen} />
            <Stack.Screen name="SupervisorZoneForm" component={SupervisorZoneFormScreen} />
            <Stack.Screen name="SupervisorZoneMap" component={SupervisorZoneMapScreen} />

            {/* Conductor Module */}
            <Stack.Screen name="SupervisorConductoresList" component={SupervisorConductoresListScreen} />
            <Stack.Screen name="SupervisorConductorForm" component={SupervisorConductorFormScreen} />
            <Stack.Screen name="SupervisorConductorDetail" component={SupervisorConductorDetailScreen} />

            {/* Vehicle Module */}
            <Stack.Screen name="SupervisorVehiclesList" component={SupervisorVehiclesListScreen} />
            <Stack.Screen name="SupervisorVehicleForm" component={SupervisorVehicleFormScreen} />
            <Stack.Screen name="SupervisorVehicleDetail" component={SupervisorVehicleDetailScreen} />

            {/* Despachos Module */}
            <Stack.Screen name="SupervisorDespachosList" component={SupervisorDespachosListScreen} />
            <Stack.Screen name="SupervisorDespachoForm" component={SupervisorDespachoFormScreen} />
            <Stack.Screen name="SupervisorDespachoDetail" component={SupervisorDespachoDetailScreen} />

            {/* Facturas Module */}
            <Stack.Screen name="SupervisorInvoices" component={SupervisorInvoicesScreen} />
            <Stack.Screen name="InvoiceDetail" component={SupervisorInvoiceDetailScreen} />
        </Stack.Navigator>
    )
}
