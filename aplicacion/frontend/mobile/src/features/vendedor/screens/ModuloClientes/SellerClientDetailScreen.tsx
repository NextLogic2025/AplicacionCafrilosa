import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, Alert, Linking, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { BRAND_COLORS } from '../../../../shared/types'
import { ClientService, type Client, type ClientBranch } from '../../../../services/api/ClientService'
import { OrderService, type Order, ORDER_STATUS_LABELS } from '../../../../services/api/OrderService'
import type { SellerStackParamList } from '../../../../navigation/SellerNavigator'
import { useCart } from '../../../../context/CartContext'

// Helper para formatear moneda de forma segura
const formatCurrency = (value: number | string | undefined | null): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : (value ?? 0)
    return isNaN(numValue) ? '$0.00' : `$${numValue.toFixed(2)}`
}

// Helper para obtener color del estado
const getStatusStyle = (estado: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
        PENDIENTE: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
        APROBADO: { bg: 'bg-blue-100', text: 'text-blue-700' },
        EN_PREPARACION: { bg: 'bg-purple-100', text: 'text-purple-700' },
        FACTURADO: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
        EN_RUTA: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
        ENTREGADO: { bg: 'bg-green-100', text: 'text-green-700' },
        ANULADO: { bg: 'bg-neutral-100', text: 'text-neutral-700' },
        RECHAZADO: { bg: 'bg-red-100', text: 'text-red-700' },
    }
    return styles[estado] || styles.PENDIENTE
}

export function SellerClientDetailScreen() {
  type ScreenNavigation = NativeStackNavigationProp<SellerStackParamList, 'SellerClientDetail'>
  type ScreenRoute = RouteProp<SellerStackParamList, 'SellerClientDetail'>

  const navigation = useNavigation<ScreenNavigation>()
  const route = useRoute<ScreenRoute>()
  const { clientId } = route.params
  const { setClient: setCartClient, currentClient } = useCart()

  const [client, setClient] = useState<Client | null>(null)
  const [branches, setBranches] = useState<ClientBranch[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Calculated Credit Values
  const [creditInfo, setCreditInfo] = useState({
    limit: 0,
    balance: 0,
    available: 0,
    percentage: 0
  })

  useEffect(() => {
    loadClient()
  }, [clientId])

  useEffect(() => {
    if (client) {
      calculateCreditInfo()
    }
  }, [client])

  const calculateCreditInfo = () => {
    if (!client) return

    const limit = parseFloat(client.limite_credito || '0')
    const balance = parseFloat(client.saldo_actual || '0')
    const available = Math.max(0, limit - balance)
    
    let percentage = 0
    if (limit > 0) {
      percentage = (balance / limit) * 100
    }

    setCreditInfo({
      limit,
      balance,
      available,
      percentage: Math.min(100, Math.max(0, percentage))
    })
  }

  const loadClient = async () => {
    setLoading(true)
    try {
      const data = await ClientService.getClient(clientId)
      setClient(data)
      loadBranches(clientId)
      loadOrders(clientId)
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el cliente')
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }

  const loadBranches = async (clientId: string) => {
    setLoadingBranches(true)
    try {
      const data = await ClientService.getClientBranches(clientId)
      setBranches(data)
    } catch (error) {
      setBranches([])
    } finally {
      setLoadingBranches(false)
    }
  }

  const loadOrders = async (clientId: string) => {
    setLoadingOrders(true)
    try {
      const data = await OrderService.getOrdersByClient(clientId)
      setOrders(data)
    } catch (error) {
      setOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }

  const openMap = () => {
    if (!client) return
    
    // Prefer GPS coordinates if available
    if (client.ubicacion_gps && client.ubicacion_gps.coordinates) {
        const [lng, lat] = client.ubicacion_gps.coordinates
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir el mapa'))
        return
    }

    // Fallback to address text
    if (client.direccion_texto) {
         const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.direccion_texto)}`
         Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir el mapa'))
         return
    }
    
    Alert.alert('Aviso', 'El cliente no tiene ubicación registrada')
  }

  const makeCall = () => {
    // Try to find a phone number. 
    // In strict Client interface there isn't a direct phone, but it might be enriched or in branches.
    // For now checking basic fields or alerting if missing.
    // Assuming backend might enrich with 'usuario_principal_telefono' or similar if available, 
    // but based on current interface we might not have it directly on 'client'.
    // We'll check if we have a contact number in the first branch as fallback?
    
    // NOTE: The user requested to attach contact info. If it's not in the main interface, 
    // we might need to rely on what's available. 
    // Let's assume for now we might have it or use a placeholder if the data isn't there.
    
    // Based on `ClientService.ts` analysis, there is no direct phone on Client. 
    // However, `usuario_principal_nombre` is enriched. Maybe we should check if `usuario_principal` has phone.
    // Or check branches.
    
    const branchWithPhone = branches.find(b => b.contacto_telefono)
    const phone = branchWithPhone?.contacto_telefono
    
    if (phone) {
        Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Error', 'No se pudo realizar la llamada'))
    } else {
        Alert.alert('Aviso', 'No hay número de teléfono registrado para este cliente (ni en sus sucursales)')
    }
  }

  if (loading || !client) {
    return (
      <View className="flex-1 bg-neutral-50 justify-center items-center">
        <ActivityIndicator size="large" color={BRAND_COLORS.red} />
        <Text className="mt-4 text-neutral-500">Cargando cliente...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-neutral-50">
      <Header title="Detalle Cliente" variant="standard" onBackPress={() => navigation.goBack()} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        
        {/* Top Card: Client Info */}
        <View className="bg-white rounded-2xl mx-4 mt-4 p-4 shadow-sm border border-neutral-100">
          <View className="flex-row items-start justify-between">
            <View className="flex-row gap-4 flex-1">
                {/* Icon Placeholder or Logo */}
                <View className="w-12 h-12 bg-red-50 rounded-xl items-center justify-center">
                    <Ionicons name="business" size={24} color={BRAND_COLORS.red} />
                </View>
                
                <View className="flex-1">
                    <Text className="font-bold text-xl text-neutral-800" numberOfLines={2}>
                        {client.nombre_comercial || client.razon_social}
                    </Text>
                    <Text className="text-neutral-500 text-sm mt-0.5">
                        {client.nombre_comercial ? client.razon_social : (client.identificacion)}
                    </Text>
                </View>
            </View>

            {/* Status Chip */}
            <View className={`flex-row items-center gap-1 px-2 py-1 rounded-full ${client.bloqueado ? 'bg-red-100' : 'bg-green-100'}`}>
                <Ionicons 
                    name={client.bloqueado ? "close-circle" : "checkmark-circle"} 
                    size={14} 
                    color={client.bloqueado ? "#EF4444" : "#22C55E"} 
                />
                <Text className={`text-xs font-bold ${client.bloqueado ? 'text-red-700' : 'text-green-700'}`}>
                    {client.bloqueado ? 'Bloqueado' : 'Activo'}
                </Text>
            </View>
          </View>

          <View className="mt-4 pt-4 border-t border-neutral-100">
             <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="card-outline" size={16} color="#6B7280" />
                <Text className="text-neutral-600 font-medium">RUC: <Text className="text-neutral-800">{client.identificacion}</Text></Text>
             </View>
             
             <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2 flex-1 mr-2">
                    <Ionicons name="map-outline" size={16} color="#6B7280" />
                    <Text className="text-neutral-600" numberOfLines={1}>
                        {client.zona_comercial_nombre || client.direccion_texto || 'Sin zona asignada'}
                    </Text>
                </View>
                
                <View className="bg-blue-50 px-2 py-1 rounded-lg">
                     <Text className="text-blue-700 text-xs font-bold">General</Text>
                </View>
             </View>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View className="flex-row mx-4 mt-4 gap-3">
             {/* Main Action: New Order */}
            <Pressable
                className={`flex-1 rounded-xl py-3 px-4 flex-row items-center justify-center gap-2 shadow-sm active:opacity-90 ${client?.bloqueado ? 'bg-neutral-300' : 'bg-red-600'}`}
                disabled={client?.bloqueado}
                onPress={() => {
                    if (client) {
                        // Seleccionar cliente en el carrito para modo vendedor
                        setCartClient(client, branches[0] || null)
                        // Navegar a productos para agregar items al carrito
                        navigation.navigate('SellerTabs', {
                            screen: 'SellerProductList'
                        } as any)
                    }
                }}
            >
                <Ionicons name="cart" size={22} color="#fff" />
                <Text className="text-white font-bold text-lg">
                    {client?.bloqueado ? 'Cliente Bloqueado' : 'Hacer Pedido'}
                </Text>
            </Pressable>

            {/* Square Action: Map */}
            <Pressable
                className="w-14 h-14 bg-white rounded-xl items-center justify-center border border-neutral-200 shadow-sm active:bg-neutral-50"
                onPress={openMap}
            >
                <Ionicons name="navigate" size={24} color={BRAND_COLORS.red} />
            </Pressable>

            {/* Square Action: Call */}
            <Pressable
                className="w-14 h-14 bg-white rounded-xl items-center justify-center border border-neutral-200 shadow-sm active:bg-neutral-50"
                onPress={makeCall}
            >
                <Ionicons name="call" size={24} color={BRAND_COLORS.red} />
            </Pressable>
        </View>

        {/* Credit Info Card */}
        <View className="mx-4 mt-6 mb-2">
             <Text className="font-bold text-lg text-neutral-800">Información de Crédito</Text>
        </View>

        <View className="bg-white rounded-2xl mx-4 p-5 shadow-sm border border-neutral-100">
            <View className="flex-row mb-6">
                <View className="flex-1 border-r border-neutral-100 pr-4">
                     <Text className="text-xs text-neutral-500 font-bold tracking-wider mb-1">DISPONIBLE</Text>
                     <Text className="text-3xl font-bold text-green-600 tracking-tight">
                        ${creditInfo.available.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </Text>
                     
                     {/* Visual Bar for Availability/Usage */}
                     <View className="h-1.5 w-full bg-neutral-100 rounded-full mt-3 overflow-hidden">
                        <View 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${Math.max(0, 100 - creditInfo.percentage)}%` }} 
                        />
                     </View>
                </View>

                <View className="flex-1 pl-4 justify-center">
                    <Text className="text-xs text-neutral-500 font-bold tracking-wider mb-1">SALDO ACTUAL</Text>
                    <Text className="text-2xl font-bold text-neutral-800 tracking-tight">
                        ${creditInfo.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <Text className="text-xs text-neutral-400 mt-1">
                        Límite: ${creditInfo.limit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                </View>
            </View>

            <View className="flex-row border-t border-neutral-100 pt-4">
                <View className="flex-1 items-center border-r border-neutral-100">
                    <Text className="text-xs text-neutral-500 mb-1">Tiene Crédito</Text>
                    <View className="bg-neutral-100 px-2 py-0.5 rounded text-center">
                        <Text className="font-bold text-xs text-neutral-600">{client.tiene_credito ? 'SI' : 'NO'}</Text>
                    </View>
                </View>
                 <View className="flex-1 items-center border-r border-neutral-100">
                    <Text className="text-xs text-neutral-500 mb-1">Días de Plazo</Text>
                    <Text className="font-bold text-lg text-neutral-800">{client.dias_plazo}</Text>
                </View>
                 <View className="flex-1 items-center">
                    <Text className="text-xs text-neutral-500 mb-1">% Usado</Text>
                    <Text className={`font-bold text-lg ${creditInfo.percentage > 90 ? 'text-red-600' : 'text-green-600'}`}>
                        {creditInfo.percentage.toFixed(0)}%
                    </Text>
                </View>
            </View>
        </View>
        
        {/* Sucursales Section */}
        <View className="mx-4 mt-6 mb-2 flex-row justify-between items-end">
             <Text className="font-bold text-lg text-neutral-800">Sucursales</Text>
        </View>

        <View className="bg-white rounded-2xl mx-4 shadow-sm border border-neutral-100 overflow-hidden">
           {loadingBranches ? (
             <View className="p-4">
                 <ActivityIndicator size="small" color={BRAND_COLORS.red} />
             </View>
           ) : branches.length === 0 ? (
             <View className="p-4 items-center">
                 <Text className="text-neutral-400">No hay sucursales registradas</Text>
             </View>
           ) : (
             branches.map((branch, index) => (
               <Pressable
                 key={branch.id}
                 className={`flex-row items-center justify-between p-4 active:bg-neutral-50 ${index !== branches.length - 1 ? 'border-b border-neutral-100' : ''}`}
                 onPress={() => navigation.navigate('SellerBranchDetail', { branch, clientName: client.nombre_comercial || client.razon_social })}
               >
                 <View className="flex-1 mr-2">
                   <Text className="font-semibold text-neutral-800 text-base">{branch.nombre_sucursal || 'Sucursal Principal'}</Text>
                   <Text className="text-xs text-neutral-500 mt-0.5" numberOfLines={1}>{branch.direccion_entrega}</Text>
                 </View>
                 <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
               </Pressable>
             ))
           )}
        </View>

        {/* Ultimos Pedidos Section */}
        <View className="mx-4 mt-6 mb-2">
             <Text className="font-bold text-lg text-neutral-800">Últimos Pedidos</Text>
        </View>

        <View className="bg-white rounded-2xl mx-4 mb-8 shadow-sm border border-neutral-100 overflow-hidden">
            {loadingOrders ? (
                <View className="p-4">
                    <ActivityIndicator size="small" color={BRAND_COLORS.red} />
                </View>
            ) : orders.length === 0 ? (
                <View className="p-6 items-center">
                    <View className="w-12 h-12 bg-neutral-100 rounded-full items-center justify-center mb-2">
                        <Ionicons name="receipt-outline" size={24} color="#9CA3AF" />
                    </View>
                   <Text className="text-neutral-400">No hay pedidos recientes</Text>
                </View>
            ) : (
                orders.slice(0, 5).map((order, index) => {
                    const statusStyle = getStatusStyle(order.estado_actual)
                    return (
                        <Pressable
                            key={order.id}
                            className={`flex-row items-center justify-between p-4 active:bg-neutral-50 ${index !== Math.min(orders.length, 5) - 1 ? 'border-b border-neutral-100' : ''}`}
                            onPress={() => navigation.navigate('SellerOrderDetail', { orderId: order.id })}
                        >
                            <View className="flex-1">
                                <View className="flex-row items-center gap-2">
                                    <Text className="font-bold text-neutral-800">#{order.codigo_visual || order.id.slice(0,8)}</Text>
                                    <View className={`px-1.5 py-0.5 rounded ${statusStyle.bg}`}>
                                        <Text className={`${statusStyle.text} font-bold text-[10px]`}>
                                            {ORDER_STATUS_LABELS[order.estado_actual] || order.estado_actual}
                                        </Text>
                                    </View>
                                </View>
                                <Text className="text-xs text-neutral-500 mt-1">
                                    {new Date(order.fecha_creacion ?? order.created_at).toLocaleDateString('es-EC', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                <Text className="font-bold text-neutral-800 text-base">{formatCurrency(order.total_final)}</Text>
                                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                            </View>
                        </Pressable>
                    )
                })
            )}
        </View>

      </ScrollView>
    </View>
  )
}
