import * as React from 'react'
import { View, Text, FlatList, RefreshControl, ActivityIndicator, Pressable, Alert } from 'react-native'
import { Header } from '../../../components/ui/Header'
import { TransportistaService, type Order } from '../../../services/api/TransportistaService' // Assuming Order is compatible or using TransportistaOrder
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { ExpandableFab, type FabAction } from '../../../components/ui/ExpandableFab'
import { useNavigation } from '@react-navigation/native'

// Internal Component for Order Card to keep file self-contained but clean
const OrderCard = ({ order, onAction }: { order: any, onAction: (id: string, action: string) => void }) => {
    return (
        <View className="bg-white rounded-xl p-4 mb-4 border border-neutral-100 shadow-sm">
            <View className="flex-row justify-between items-start mb-2">
                <View>
                    <Text className="text-neutral-500 text-xs font-bold">Pedido #{order.id}</Text>
                    <Text className="text-neutral-900 text-lg font-bold">{order.clientName}</Text>
                </View>
                <View className={`px-2 py-1 rounded-full ${order.status === 'ready_for_pickup' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                    <Text className={`text-[10px] font-bold uppercase ${order.status === 'ready_for_pickup' ? 'text-yellow-700' : 'text-blue-700'}`}>
                        {order.status === 'ready_for_pickup' ? 'Listo para Retiro' : 'En Ruta'}
                    </Text>
                </View>
            </View>

            <View className="mb-3">
                <Text className="text-neutral-500 text-sm flex-wrap">{order.address || 'Dirección no especificada'}</Text>
                <Text className="text-neutral-400 text-xs mt-1">{order.itemsCount} productos • Prioridad {order.priority}</Text>
            </View>

            {/* Actions */}
            <View className="flex-row border-t border-neutral-100 pt-3 mt-1">
                {order.status === 'ready_for_pickup' ? (
                    <Pressable
                        onPress={() => onAction(order.id, 'pickup')}
                        className="flex-1 bg-brand-red py-2 rounded-lg items-center active:opacity-80"
                    >
                        <Text className="text-white font-bold text-sm">Confirmar Retiro</Text>
                    </Pressable>
                ) : (
                    <Pressable
                        className="flex-1 bg-neutral-100 py-2 rounded-lg items-center"
                        disabled
                    >
                        <Text className="text-neutral-400 font-bold text-sm">En Proceso de Entrega</Text>
                    </Pressable>
                )}
            </View>
        </View>
    )
}

function EmptyState() {
    return (
        <View className="flex-1 justify-center items-center py-20 px-6">
            <View className="bg-neutral-100 p-4 rounded-full mb-4">
                <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
            </View>
            <Text className="text-neutral-900 text-lg font-bold text-center mb-2">No hay pedidos asignados</Text>
            <Text className="text-neutral-400 text-sm text-center">
                Cuando bodega te asigne nuevos pedidos, aparecerán aquí para que inicies el despacho.
            </Text>
        </View>
    )
}

export function TransportistaOrdersScreen() {
    const navigation = useNavigation()
    const [orders, setOrders] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [refreshing, setRefreshing] = React.useState(false)

    const loadOrders = async () => {
        try {
            const data = await TransportistaService.getAssignedOrders()
            setOrders(data)
        } catch (error) {
            console.error('Error fetching orders', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    React.useEffect(() => {
        loadOrders()
    }, [])

    const handleRefresh = () => {
        setRefreshing(true)
        loadOrders()
    }

    const handleAction = (orderId: string, action: string) => {
        if (action === 'pickup') {
            Alert.alert(
                "Confirmar Retiro",
                `¿Confirmas que has retirado el pedido ${orderId} de bodega?`,
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Confirmar",
                        onPress: () => {
                            // Optimistic update
                            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'in_transit' } : o))
                        }
                    }
                ]
            )
        }
    }

    const fabActions: FabAction[] = [
        // @ts-ignore
        { icon: 'map-outline', label: 'Rutas', onPress: () => navigation.navigate('TransportistaRoutes') },
        // @ts-ignore
        { icon: 'refresh-circle-outline', label: 'Devoluciones', onPress: () => navigation.navigate('TransportistaReturns') },
        // @ts-ignore
        { icon: 'time-outline', label: 'Historial', onPress: () => navigation.navigate('TransportistaHistory') },
        // @ts-ignore
        { icon: 'notifications-outline', label: 'Notificaciones', onPress: () => navigation.navigate('TransportistaNotifications') },
    ]

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                userName="Transportista"
                variant="standard"
                title="Gestión de Pedidos"
            />

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <OrderCard order={item} onAction={handleAction} />}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    ListEmptyComponent={EmptyState}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[BRAND_COLORS.red]} />}
                />
            )}

            <ExpandableFab actions={fabActions} />
        </View>
    )
}
