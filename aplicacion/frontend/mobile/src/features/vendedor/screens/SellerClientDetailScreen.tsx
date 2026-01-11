import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert, Linking, TouchableOpacity } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { ClientService, type Client, type ClientBranch, type PriceList } from '../../../services/api/ClientService'
import { UserService } from '../../../services/api/UserService'
import { OrderService, type Order, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../../services/api/OrderService'

export function SellerClientDetailScreen() {
    const navigation = useNavigation()
    const route = useRoute()
    // @ts-ignore
    const { clientId } = route.params || {}
    const [loading, setLoading] = useState(true)
    const [client, setClient] = useState<Client | null>(null)
    const [branches, setBranches] = useState<ClientBranch[]>([])
    const [priceListName, setPriceListName] = useState<string>('')
    const [ownerName, setOwnerName] = useState<string>('')
    const [orders, setOrders] = useState<Order[]>([])
    const [loadingOrders, setLoadingOrders] = useState(false)
    const [lastOrder, setLastOrder] = useState<Order | null>(null)

    useEffect(() => {
        loadDetail()
    }, [clientId])

    const loadDetail = async () => {
        setLoading(true)
        try {
            // Cargar datos del cliente y listas de precios en paralelo
            const [clientData, priceLists] = await Promise.all([
                ClientService.getClient(clientId),
                ClientService.getPriceLists()
            ])

            setClient(clientData)

            // Buscar el nombre de la lista de precios
            if (clientData.lista_precios_id) {
                const priceList = priceLists.find(pl => pl.id === clientData.lista_precios_id)
                setPriceListName(priceList?.nombre || `Lista #${clientData.lista_precios_id}`)
            }

            // Intentar cargar el nombre del usuario principal
            // NOTA: El endpoint /auth/usuarios tiene @Roles('admin', 'supervisor')
            // y NO incluye 'vendedor', por lo que puede fallar con 403 Forbidden
            // Si falla, simplemente no mostramos el nombre del contacto
            if (clientData.usuario_principal_id) {
                try {
                    const users = await UserService.getUsers()
                    const user = users.find(u => u.id === clientData.usuario_principal_id)
                    setOwnerName(user?.name || '')
                } catch (userError) {
                    console.log('No se pudo cargar información del usuario (permisos insuficientes)')
                    // No hacer nada - ownerName queda vacío y no se muestra en la UI
                }
            }

            // Cargar historial de pedidos del cliente
            loadOrders()

            // NOTA: No cargamos sucursales porque el endpoint /api/clientes/:id/sucursales
            // tiene @Roles('admin', 'supervisor', 'cliente') y NO incluye 'vendedor'
            // Esto causa error 403 Forbidden para vendedores
        } catch (error) {
            console.error('Error loading client details:', error)
        } finally {
            setLoading(false)
        }
    }

    /**
     * Cargar historial de pedidos del cliente
     * Muestra los últimos 5 pedidos ordenados por fecha
     */
    const loadOrders = async () => {
        setLoadingOrders(true)
        try {
            // Obtener pedidos del cliente (filtrados por cliente_id)
            const clientOrders = await OrderService.getOrders({
                cliente_id: clientId,
                limit: 5 // Solo los últimos 5 pedidos
            })

            setOrders(clientOrders)

            // Guardar el último pedido para mostrar en resumen
            if (clientOrders.length > 0) {
                setLastOrder(clientOrders[0]) // Ya está ordenado por fecha DESC
            }
        } catch (error) {
            console.error('Error loading client orders:', error)
            // No mostrar error al usuario, simplemente no mostrar pedidos
        } finally {
            setLoadingOrders(false)
        }
    }

    // Función para abrir Google Maps con la ubicación del cliente
    const openMapNavigation = (lat: number, lng: number, name: string) => {
        const label = encodeURIComponent(name)
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${label}`
        Linking.openURL(url).catch(err => {
            console.error('Error opening maps:', err)
            Alert.alert('Error', 'No se pudo abrir el mapa')
        })
    }

    // Función para hacer llamada telefónica
    const makePhoneCall = (phoneNumber: string) => {
        const url = `tel:${phoneNumber}`
        Linking.openURL(url).catch(err => {
            console.error('Error making call:', err)
            Alert.alert('Error', 'No se pudo realizar la llamada')
        })
    }

    if (loading) {
        return (
            <View className="flex-1 bg-neutral-50 items-center justify-center">
                <ActivityIndicator size="large" color={BRAND_COLORS.red} />
            </View>
        )
    }

    if (!client) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header title="Detalle Cliente" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="p-8 items-center"><Text>Cliente no encontrado</Text></View>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Detalle Cliente" variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header Info */}
                <View className="bg-white p-5 mb-4 border-b border-neutral-100">
                    <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1">
                            <Text className="text-xl font-bold text-neutral-900">{client.nombre_comercial || client.razon_social}</Text>
                            <Text className="text-neutral-500 text-sm">{client.razon_social}</Text>
                            {ownerName && (
                                <View className="flex-row items-center mt-1">
                                    <Ionicons name="person-circle-outline" size={14} color="#9CA3AF" />
                                    <Text className="text-neutral-400 text-xs ml-1">Contacto: {ownerName}</Text>
                                </View>
                            )}
                            <Text className="text-neutral-400 text-xs mt-1">{client.tipo_identificacion}: {client.identificacion}</Text>
                        </View>
                        {client.bloqueado && (
                            <View className="bg-red-100 px-3 py-1 rounded-full">
                                <Text className="text-red-700 text-xs font-bold">BLOQUEADO</Text>
                            </View>
                        )}
                    </View>

                    <View className="flex-row gap-4 mt-2">
                        <View className="flex-row items-center">
                            <Ionicons name="location-outline" size={16} color="#6B7280" />
                            <Text className="text-neutral-600 ml-1 text-sm">{client.direccion_texto || 'Sin dirección'}</Text>
                        </View>
                        {client.zona_comercial_id && (
                            <View className="flex-row items-center">
                                <Ionicons name="map-outline" size={16} color="#6B7280" />
                                <Text className="text-neutral-600 ml-1 text-sm">Zona {client.zona_comercial_id}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* KPI Cards */}
                <View className="flex-row px-5 mb-6 justify-between">
                    <View className="bg-white p-3 rounded-xl w-[48%] border border-neutral-100 shadow-sm">
                        <Text className="text-neutral-500 text-xs font-bold uppercase mb-1">Crédito Dispon.</Text>
                        <Text className="text-lg font-bold text-green-600">
                            ${(parseFloat(client.limite_credito || '0') - parseFloat(client.saldo_actual || '0')).toFixed(2)}
                        </Text>
                        <View className="h-1 bg-neutral-100 mt-2 rounded-full overflow-hidden">
                            <View
                                className="h-full bg-green-500"
                                style={{ width: `${Math.max(0, 100 - (parseFloat(client.saldo_actual || '0') / parseFloat(client.limite_credito || '1') * 100))}%` }}
                            />
                        </View>
                        <Text className="text-[10px] text-neutral-400 mt-1">
                            Límite: ${parseFloat(client.limite_credito || '0').toFixed(2)}
                        </Text>
                    </View>
                    <View className="bg-white p-3 rounded-xl w-[48%] border border-neutral-100 shadow-sm">
                        <Text className="text-neutral-500 text-xs font-bold uppercase mb-1">Saldo Actual</Text>
                        <Text className={`text-lg font-bold ${parseFloat(client.saldo_actual || '0') > 0 ? 'text-red-600' : 'text-neutral-900'}`}>
                            ${parseFloat(client.saldo_actual || '0').toFixed(2)}
                        </Text>
                        <Text className="text-[10px] text-neutral-400 mt-1">
                            Plazo: {client.dias_plazo || 0} días
                        </Text>
                    </View>
                </View>

                {/* Actions */}
                <View className="px-5 mb-6">
                    {/* Botón Iniciar Pedido */}
                    <Pressable
                        className="bg-brand-red p-4 rounded-xl flex-row items-center justify-center shadow-sm active:bg-red-700 mb-4"
                        // @ts-ignore
                        onPress={() => navigation.navigate('SellerOrder', { preselectedClient: client })}
                    >
                        <Ionicons name="cart" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold text-base">Iniciar Pedido</Text>
                    </Pressable>

                    {/* Botón de Mapa - Solo si tiene ubicación GPS */}
                    {client.ubicacion_gps?.coordinates && (
                        <Pressable
                            className="bg-brand-red p-4 rounded-xl flex-row items-center justify-center shadow-sm active:bg-red-700"
                            onPress={() => {
                                const [lng, lat] = client.ubicacion_gps!.coordinates
                                openMapNavigation(lat, lng, client.nombre_comercial || client.razon_social)
                            }}
                        >
                            <Ionicons name="map" size={20} color="white" style={{ marginRight: 8 }} />
                            <Text className="text-white font-bold text-base">Cómo Llegar</Text>
                        </Pressable>
                    )}
                </View>

                {/* Información Adicional */}
                <View className="px-5">
                    <Text className="text-lg font-bold text-neutral-900 mb-3">Información de Crédito</Text>

                    <View className="bg-white p-4 rounded-xl border border-neutral-100 mb-3">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-neutral-600 text-sm">Tiene Crédito</Text>
                            <View className={`px-3 py-1 rounded-full ${client.tiene_credito ? 'bg-green-100' : 'bg-neutral-100'}`}>
                                <Text className={`text-xs font-bold ${client.tiene_credito ? 'text-green-700' : 'text-neutral-600'}`}>
                                    {client.tiene_credito ? 'SÍ' : 'NO'}
                                </Text>
                            </View>
                        </View>

                        {client.tiene_credito && (
                            <>
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-neutral-600 text-sm">Límite de Crédito</Text>
                                    <Text className="font-bold text-neutral-900">${parseFloat(client.limite_credito || '0').toFixed(2)}</Text>
                                </View>

                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-neutral-600 text-sm">Saldo Actual</Text>
                                    <Text className="font-bold text-red-600">${parseFloat(client.saldo_actual || '0').toFixed(2)}</Text>
                                </View>

                                <View className="flex-row justify-between items-center">
                                    <Text className="text-neutral-600 text-sm">Días de Plazo</Text>
                                    <Text className="font-bold text-neutral-900">{client.dias_plazo || 0} días</Text>
                                </View>
                            </>
                        )}
                    </View>

                    <View className="bg-white p-4 rounded-xl border border-neutral-100">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-neutral-600 text-sm">Lista de Precios</Text>
                            <Text className="font-bold text-neutral-900">{priceListName || 'Sin lista asignada'}</Text>
                        </View>
                    </View>
                </View>

                {/* Historial de Pedidos */}
                <View className="px-5 mt-6">
                    <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-lg font-bold text-neutral-900">Historial de Pedidos</Text>
                        {orders.length > 0 && (
                            <TouchableOpacity
                                // @ts-ignore
                                onPress={() => navigation.navigate('SellerOrderHistory', { clientId })}
                            >
                                <Text className="text-brand-red text-sm font-bold">Ver Todo</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {loadingOrders ? (
                        <View className="bg-white p-8 rounded-xl border border-neutral-100 items-center">
                            <ActivityIndicator size="small" color={BRAND_COLORS.red} />
                            <Text className="text-neutral-400 text-sm mt-2">Cargando pedidos...</Text>
                        </View>
                    ) : orders.length === 0 ? (
                        <View className="bg-white p-8 rounded-xl border border-neutral-100 items-center">
                            <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
                            <Text className="text-neutral-400 text-sm mt-2">Sin pedidos registrados</Text>
                            <Text className="text-neutral-300 text-xs mt-1">Este cliente aún no ha realizado pedidos</Text>
                        </View>
                    ) : (
                        <>
                            {/* Último Pedido - Destacado */}
                            {lastOrder && (
                                <TouchableOpacity
                                    className="bg-white rounded-xl border-2 mb-3 overflow-hidden"
                                    style={{ borderColor: BRAND_COLORS.red }}
                                    // @ts-ignore
                                    onPress={() => navigation.navigate('SellerOrderDetail', { orderId: lastOrder.id })}
                                >
                                    {/* Banner "Último Pedido" */}
                                    <View className="bg-brand-red px-3 py-1.5">
                                        <Text className="text-white text-xs font-bold uppercase tracking-wide">
                                            📦 Último Pedido
                                        </Text>
                                    </View>

                                    <View className="p-4">
                                        <View className="flex-row justify-between items-start mb-2">
                                            <View className="flex-1">
                                                <Text className="text-neutral-900 font-bold text-base mb-1">
                                                    Pedido #{lastOrder.codigo_visual}
                                                </Text>
                                                <Text className="text-neutral-500 text-xs">
                                                    {OrderService.formatOrderDate(lastOrder.created_at)}
                                                </Text>
                                            </View>
                                            <View
                                                className="px-3 py-1 rounded-full"
                                                style={{ backgroundColor: `${ORDER_STATUS_COLORS[lastOrder.estado_actual]}20` }}
                                            >
                                                <Text
                                                    className="text-xs font-bold"
                                                    style={{ color: ORDER_STATUS_COLORS[lastOrder.estado_actual] }}
                                                >
                                                    {ORDER_STATUS_LABELS[lastOrder.estado_actual]}
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="flex-row items-center justify-between pt-3 border-t border-neutral-100">
                                            <View>
                                                <Text className="text-neutral-400 text-xs mb-1">Total del Pedido</Text>
                                                <Text className="text-neutral-900 font-bold text-lg">
                                                    ${lastOrder.total_final.toFixed(2)}
                                                </Text>
                                            </View>
                                            <View className="flex-row items-center">
                                                <Text className="text-brand-red text-sm font-bold mr-1">Ver Detalles</Text>
                                                <Ionicons name="arrow-forward" size={16} color={BRAND_COLORS.red} />
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}

                            {/* Pedidos Anteriores */}
                            {orders.slice(1, 5).map((order) => (
                                <TouchableOpacity
                                    key={order.id}
                                    className="bg-white p-4 rounded-xl border border-neutral-100 mb-3 active:bg-neutral-50"
                                    // @ts-ignore
                                    onPress={() => navigation.navigate('SellerOrderDetail', { orderId: order.id })}
                                >
                                    <View className="flex-row justify-between items-center">
                                        <View className="flex-1">
                                            <Text className="text-neutral-900 font-bold text-sm mb-1">
                                                Pedido #{order.codigo_visual}
                                            </Text>
                                            <Text className="text-neutral-400 text-xs">
                                                {OrderService.formatOrderDateShort(order.created_at)}
                                            </Text>
                                        </View>

                                        <View className="items-end">
                                            <View
                                                className="px-2.5 py-1 rounded-full mb-1"
                                                style={{ backgroundColor: `${ORDER_STATUS_COLORS[order.estado_actual]}20` }}
                                            >
                                                <Text
                                                    className="text-xs font-bold"
                                                    style={{ color: ORDER_STATUS_COLORS[order.estado_actual] }}
                                                >
                                                    {ORDER_STATUS_LABELS[order.estado_actual]}
                                                </Text>
                                            </View>
                                            <Text className="text-neutral-900 font-bold text-sm">
                                                ${order.total_final.toFixed(2)}
                                            </Text>
                                        </View>

                                        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" style={{ marginLeft: 12 }} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}
                </View>

            </ScrollView>
        </View>
    )
}
