import React, { useState, useEffect, useCallback } from 'react'
import {
    View, Text, ScrollView, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, Platform
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import DateTimePicker from '@react-native-community/datetimepicker'

import { useCart } from '../../../../context/CartContext'
import { OrderService } from '../../../../services/api/OrderService'
import { CartService } from '../../../../services/api/CartService'
import { UserService } from '../../../../services/api/UserService'
import { ClientService, ClientBranch, Client } from '../../../../services/api/ClientService'
import { Header } from '../../../../components/ui/Header'
import { SuccessModal } from '../../../../components/ui/SuccessModal'
import { BRAND_COLORS } from '../../../../shared/types'

/**
 * Tipo para las opciones de entrega (matriz o sucursal)
 */
type DeliveryOption = 'MATRIZ' | string // MATRIZ o ID de sucursal

/**
 * Región por defecto (Ecuador - Loja)
 */
const DEFAULT_REGION = {
    latitude: -3.9931,
    longitude: -79.2042,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
}

/**
 * Mapear días de plazo a condición de pago
 */
const diasPlazoToCondicion = (dias: number): string => {
    if (dias <= 0) return 'CONTADO'
    if (dias <= 15) return 'CREDITO_15D'
    if (dias <= 30) return 'CREDITO_30D'
    if (dias <= 45) return 'CREDITO_45D'
    return 'CREDITO_45D' // Para más de 45 días, usar el máximo
}

/**
 * Obtener label de días de plazo
 */
const getDiasPlazoLabel = (dias: number): string => {
    if (dias <= 0) return 'Contado'
    return `Crédito ${dias} días`
}

/**
 * ClientCheckoutScreen
 *
 * Pantalla de confirmación de pedido para el cliente.
 * Incluye:
 * - Selección de lugar de entrega (matriz o sucursales)
 * - Condición de pago basada en el crédito del cliente
 * - Fecha de entrega solicitada
 * - Ubicación GPS (mapa)
 * - Observaciones
 */
export function ClientCheckoutScreen() {
    const navigation = useNavigation()
    const { cart, clearCart } = useCart()

    // Estados del cliente
    const [clienteData, setClienteData] = useState<Client | null>(null)

    // Estados del formulario
    const [observaciones, setObservaciones] = useState('')
    const [condicionPago, setCondicionPago] = useState('CONTADO')
    const [fechaEntrega, setFechaEntrega] = useState<Date | null>(null)
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<DeliveryOption>('MATRIZ')
    const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null)
    const [showSucursalesAccordion, setShowSucursalesAccordion] = useState(false)

    // Estados de carga
    const [loading, setLoading] = useState(false)
    const [loadingData, setLoadingData] = useState(true)
    const [sucursales, setSucursales] = useState<ClientBranch[]>([])
    const [userId, setUserId] = useState<string | null>(null)
    const [clienteId, setClienteId] = useState<string | null>(null)

    // Estados del modal
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)
    const [orderNumber, setOrderNumber] = useState<string>('')

    // Calcular totales usando valores del backend (preservados en el contexto)
    const subtotal = cart.subtotal || cart.items.reduce((sum, item) => sum + item.subtotal, 0)
    const descuentos = cart.descuento_total || 0
    const iva = cart.impuestos_total || (subtotal - descuentos) * 0.12
    const total = cart.total_final || (subtotal - descuentos + iva)

    /**
     * Cargar datos iniciales: cliente y sucursales
     */
    useEffect(() => {
        const loadData = async () => {
            setLoadingData(true)
            try {
                // 1. Obtener perfil del usuario
                const user = await UserService.getProfile()
                if (user?.id) {
                    setUserId(user.id)

                    // 2. Obtener datos del cliente
                    const cliente = await ClientService.getMyClientData()
                    if (cliente) {
                        setClienteData(cliente)
                        setClienteId(cliente.id)

                        // Guardar cliente_id en el carrito del backend
                        // Guardar cliente_id implicitamente al crear orden
                        // (El backend actual no tiene endpoint para asociarlo al carrito)

                        // 3. Configurar condición de pago según crédito del cliente
                        if (cliente.tiene_credito && cliente.dias_plazo > 0) {
                            setCondicionPago(diasPlazoToCondicion(cliente.dias_plazo))
                        } else {
                            setCondicionPago('CONTADO')
                        }

                        // 4. Configurar ubicación de la matriz
                        if (cliente.ubicacion_gps?.coordinates) {
                            setUbicacion({
                                lng: cliente.ubicacion_gps.coordinates[0],
                                lat: cliente.ubicacion_gps.coordinates[1]
                            })
                        }

                        // 5. Cargar sucursales del cliente
                        try {
                            const sucursalesData = await ClientService.getClientBranches(cliente.id)
                            setSucursales(sucursalesData.filter(s => s.activo))
                        } catch (e) {
                            console.log('No se pudieron cargar sucursales:', e)
                        }
                    }
                }
            } catch (error) {
                console.error('Error cargando datos:', error)
            } finally {
                setLoadingData(false)
            }
        }

        loadData()
    }, [])

    /**
     * Cuando cambia la opción de entrega (matriz o sucursal)
     */
    const handleDeliveryOptionChange = useCallback((option: DeliveryOption) => {
        setSelectedDeliveryOption(option)

        if (option === 'MATRIZ') {
            // Usar ubicación de la matriz (cliente principal)
            if (clienteData?.ubicacion_gps?.coordinates) {
                setUbicacion({
                    lng: clienteData.ubicacion_gps.coordinates[0],
                    lat: clienteData.ubicacion_gps.coordinates[1]
                })
            }
        } else {
            // Usar ubicación de la sucursal seleccionada
            const sucursal = sucursales.find(s => s.id === option)
            if (sucursal?.ubicacion_gps?.coordinates) {
                setUbicacion({
                    lng: sucursal.ubicacion_gps.coordinates[0],
                    lat: sucursal.ubicacion_gps.coordinates[1]
                })
            }
        }

        // Cerrar acordeón después de seleccionar
        if (option !== 'MATRIZ') {
            setShowSucursalesAccordion(false)
        }
    }, [sucursales, clienteData])

    /**
     * Manejar selección de fecha
     */
    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios')
        if (selectedDate) {
            setFechaEntrega(selectedDate)
        }
    }

    /**
     * Formatear fecha para mostrar
     */
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-EC', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    /**
     * Manejar tap en el mapa para seleccionar ubicación
     */
    const handleMapPress = (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate
        setUbicacion({ lat: latitude, lng: longitude })
    }

    /**
     * Obtener la dirección seleccionada para mostrar
     */
    const getSelectedDeliveryAddress = (): string => {
        if (selectedDeliveryOption === 'MATRIZ') {
            return clienteData?.direccion_texto || 'Dirección principal'
        }
        const sucursal = sucursales.find(s => s.id === selectedDeliveryOption)
        return sucursal?.direccion_entrega || sucursal?.nombre_sucursal || 'Sucursal'
    }

    /**
     * Obtener el nombre del lugar de entrega
     */
    const getSelectedDeliveryName = (): string => {
        if (selectedDeliveryOption === 'MATRIZ') {
            return 'Local Principal (Matriz)'
        }
        const sucursal = sucursales.find(s => s.id === selectedDeliveryOption)
        return sucursal?.nombre_sucursal || 'Sucursal'
    }

    const handleConfirmOrder = async () => {
        if (cart.items.length === 0) {
            Alert.alert('Carrito vacío', 'Agrega productos antes de realizar un pedido')
            return
        }

        if (!userId) {
            Alert.alert('Error', 'No se pudo obtener la información del usuario')
            return
        }

        setLoading(true)
        try {
            const orderData = {
                cliente_id: clienteId || userId,
                vendedor_id: userId,
                sucursal_id: selectedDeliveryOption !== 'MATRIZ' ? selectedDeliveryOption : undefined,
                observaciones_entrega: observaciones || undefined,
                condicion_pago: condicionPago,
                fecha_entrega_solicitada: fechaEntrega
                    ? fechaEntrega.toISOString().split('T')[0]
                    : undefined,
                origen_pedido: 'APP_MOVIL',
                ubicacion: ubicacion || undefined,
                descuento_total: descuentos > 0 ? descuentos : undefined,
            }

            // Usar endpoint específico para crear pedido desde el carrito del servidor
            const newOrder = await OrderService.createOrderFromCart(userId, orderData)

            // Limpiar estado local del carrito (el backend ya lo vació)
            // Se usa setTimeout para no bloquear la UI mientras se actualiza el contexto
            setTimeout(() => clearCart(), 100)

            setOrderNumber(newOrder.codigo_visual?.toString() || 'N/A')
            setShowSuccessModal(true)

        } catch (error: any) {
            console.error('Error al procesar pedido:', error)
            Alert.alert(
                'Error',
                error.message || 'No se pudo procesar el pedido. Intenta nuevamente.'
            )
        } finally {
            setLoading(false)
        }
    }

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false)
            // Navegar a Mis Pedidos y limpiar el stack para que no vuelva al checkout vacío
            (navigation as any).reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
            })
        // Navegar a Pedidos después de resetear
        setTimeout(() => {
            (navigation as any).navigate('Pedidos')
        }, 100)
    }

    if (cart.items.length === 0) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header
                    variant="standard"
                    title="Confirmar Pedido"
                />
                <View className="flex-1 items-center justify-center px-8">
                    <Ionicons name="cart-outline" size={80} color="#D1D5DB" />
                    <Text className="text-neutral-600 text-center mt-4 text-base">
                        Tu carrito está vacío
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="mt-6 bg-brand-red px-6 py-3 rounded-xl"
                    >
                        <Text className="text-white font-bold">Agregar productos</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                variant="standard"
                title="Confirmar Pedido"
            />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* ========== RESUMEN DE PRODUCTOS ========== */}
                <View className="bg-white mt-2 px-5 py-4">
                    <Text className="text-neutral-900 font-bold text-lg mb-3">
                        📦 Resumen del pedido
                    </Text>

                    {cart.items.map((item, index) => (
                        <View
                            key={item.id}
                            className={`flex-row justify-between items-center py-3 ${index < cart.items.length - 1 ? 'border-b border-neutral-100' : ''
                                }`}
                        >
                            <View className="flex-1">
                                <Text className="text-neutral-900 font-medium" numberOfLines={1}>
                                    {item.nombre_producto}
                                </Text>
                                <Text className="text-neutral-500 text-sm mt-1">
                                    {item.cantidad} × ${item.precio_final.toFixed(2)}
                                </Text>
                            </View>
                            <Text className="text-neutral-900 font-bold ml-3">
                                ${item.subtotal.toFixed(2)}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* ========== LUGAR DE ENTREGA (ACORDEÓN) ========== */}
                <View className="bg-white mt-2 px-5 py-4">
                    <Text className="text-neutral-900 font-bold text-base mb-3">
                        🏪 ¿Dónde entregar?
                    </Text>

                    {loadingData ? (
                        <View className="py-4 items-center">
                            <ActivityIndicator size="small" color={BRAND_COLORS.red} />
                            <Text className="text-neutral-500 text-sm mt-2">Cargando...</Text>
                        </View>
                    ) : (
                        <View>
                            {/* Opción: Local Principal (Matriz) - Siempre visible */}
                            <TouchableOpacity
                                onPress={() => handleDeliveryOptionChange('MATRIZ')}
                                className={`flex-row items-center p-4 rounded-xl border mb-2 ${selectedDeliveryOption === 'MATRIZ'
                                    ? 'bg-red-50 border-brand-red'
                                    : 'bg-neutral-50 border-neutral-200'
                                    }`}
                            >
                                <Ionicons
                                    name={selectedDeliveryOption === 'MATRIZ' ? 'radio-button-on' : 'radio-button-off'}
                                    size={22}
                                    color={selectedDeliveryOption === 'MATRIZ' ? BRAND_COLORS.red : '#9CA3AF'}
                                />
                                <View className="flex-1 ml-3">
                                    <Text className={`font-bold ${selectedDeliveryOption === 'MATRIZ' ? 'text-brand-red' : 'text-neutral-800'
                                        }`}>
                                        Local Principal (Matriz)
                                    </Text>
                                    {clienteData?.direccion_texto && (
                                        <Text className="text-neutral-500 text-sm mt-0.5" numberOfLines={2}>
                                            {clienteData.direccion_texto}
                                        </Text>
                                    )}
                                </View>
                                {clienteData?.ubicacion_gps && (
                                    <Ionicons name="location" size={16} color="#10B981" />
                                )}
                            </TouchableOpacity>

                            {/* Botón acordeón para ver sucursales (solo si hay sucursales) */}
                            {sucursales.length > 0 && (
                                <>
                                    <TouchableOpacity
                                        onPress={() => setShowSucursalesAccordion(!showSucursalesAccordion)}
                                        className="flex-row items-center justify-between py-3 px-1"
                                    >
                                        <View className="flex-row items-center">
                                            <Ionicons name="business-outline" size={18} color="#6B7280" />
                                            <Text className="text-neutral-600 font-medium ml-2">
                                                Ver sucursales ({sucursales.length})
                                            </Text>
                                        </View>
                                        <Ionicons
                                            name={showSucursalesAccordion ? 'chevron-up' : 'chevron-down'}
                                            size={20}
                                            color="#9CA3AF"
                                        />
                                    </TouchableOpacity>

                                    {/* Lista de sucursales (acordeón) */}
                                    {showSucursalesAccordion && (
                                        <View className="pl-2">
                                            {sucursales.map((sucursal) => (
                                                <TouchableOpacity
                                                    key={sucursal.id}
                                                    onPress={() => handleDeliveryOptionChange(sucursal.id)}
                                                    className={`flex-row items-center p-4 rounded-xl border mb-2 ${selectedDeliveryOption === sucursal.id
                                                        ? 'bg-red-50 border-brand-red'
                                                        : 'bg-neutral-50 border-neutral-200'
                                                        }`}
                                                >
                                                    <Ionicons
                                                        name={selectedDeliveryOption === sucursal.id ? 'radio-button-on' : 'radio-button-off'}
                                                        size={22}
                                                        color={selectedDeliveryOption === sucursal.id ? BRAND_COLORS.red : '#9CA3AF'}
                                                    />
                                                    <View className="flex-1 ml-3">
                                                        <Text className={`font-bold ${selectedDeliveryOption === sucursal.id ? 'text-brand-red' : 'text-neutral-800'
                                                            }`}>
                                                            {sucursal.nombre_sucursal}
                                                        </Text>
                                                        {sucursal.direccion_entrega && (
                                                            <Text className="text-neutral-500 text-sm mt-0.5" numberOfLines={1}>
                                                                {sucursal.direccion_entrega}
                                                            </Text>
                                                        )}
                                                    </View>
                                                    {sucursal.ubicacion_gps && (
                                                        <Ionicons name="location" size={16} color="#10B981" />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </>
                            )}

                            {/* Mostrar dirección seleccionada */}
                            {selectedDeliveryOption !== 'MATRIZ' && (
                                <View className="bg-green-50 border border-green-200 rounded-xl p-3 mt-2">
                                    <View className="flex-row items-center">
                                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                        <Text className="text-green-700 font-medium ml-2">
                                            Entregaremos en: {getSelectedDeliveryName()}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* ========== CONDICIÓN DE PAGO ========== */}
                <View className="bg-white mt-2 px-5 py-4">
                    <Text className="text-neutral-900 font-bold text-base mb-3">
                        💳 Condición de pago
                    </Text>

                    {loadingData ? (
                        <ActivityIndicator size="small" color={BRAND_COLORS.red} />
                    ) : clienteData?.tiene_credito ? (
                        // Cliente CON crédito - mostrar sus opciones
                        <View>
                            <View className="flex-row flex-wrap">
                                {/* Opción Contado siempre disponible */}
                                <TouchableOpacity
                                    onPress={() => setCondicionPago('CONTADO')}
                                    className={`px-4 py-2.5 rounded-xl border mr-2 mb-2 ${condicionPago === 'CONTADO'
                                        ? 'bg-red-50 border-brand-red'
                                        : 'bg-neutral-50 border-neutral-200'
                                        }`}
                                >
                                    <Text className={`font-semibold ${condicionPago === 'CONTADO' ? 'text-brand-red' : 'text-neutral-700'
                                        }`}>
                                        Contado
                                    </Text>
                                </TouchableOpacity>

                                {/* Opción Crédito según días de plazo del cliente */}
                                <TouchableOpacity
                                    onPress={() => setCondicionPago(diasPlazoToCondicion(clienteData.dias_plazo))}
                                    className={`px-4 py-2.5 rounded-xl border mr-2 mb-2 ${condicionPago !== 'CONTADO'
                                        ? 'bg-red-50 border-brand-red'
                                        : 'bg-neutral-50 border-neutral-200'
                                        }`}
                                >
                                    <Text className={`font-semibold ${condicionPago !== 'CONTADO' ? 'text-brand-red' : 'text-neutral-700'
                                        }`}>
                                        {getDiasPlazoLabel(clienteData.dias_plazo)}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Información de crédito disponible */}
                            <View className="flex-row items-center mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                                <View className="flex-1 ml-2">
                                    <Text className="text-blue-800 text-sm font-medium">
                                        Crédito disponible: ${parseFloat(clienteData.limite_credito || '0').toFixed(2)}
                                    </Text>
                                    <Text className="text-blue-600 text-xs">
                                        Plazo: {clienteData.dias_plazo} días
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        // Cliente SIN crédito - solo contado
                        <View>
                            <View className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <View className="flex-row items-center">
                                    <Ionicons name="alert-circle" size={24} color="#F59E0B" />
                                    <View className="flex-1 ml-3">
                                        <Text className="text-amber-800 font-bold">
                                            Usted no tiene crédito
                                        </Text>
                                        <Text className="text-amber-700 text-sm mt-1">
                                            Su pedido será procesado únicamente al contado.
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View className="flex-row items-center mt-3 bg-neutral-100 rounded-xl p-3">
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                <Text className="text-neutral-700 font-medium ml-2">
                                    Condición: Contado
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* ========== FECHA DE ENTREGA ========== */}
                <View className="bg-white mt-2 px-5 py-4">
                    <Text className="text-neutral-900 font-bold text-base mb-3">
                        📅 Fecha de entrega deseada
                    </Text>

                    <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        className="flex-row items-center justify-between bg-neutral-50 border border-neutral-200 rounded-xl p-4"
                    >
                        <View className="flex-row items-center">
                            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                            <Text className="text-neutral-700 font-medium ml-3">
                                {fechaEntrega ? formatDate(fechaEntrega) : 'Seleccionar fecha (opcional)'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={fechaEntrega || new Date()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleDateChange}
                            minimumDate={new Date()}
                        />
                    )}

                    {fechaEntrega && (
                        <TouchableOpacity
                            onPress={() => setFechaEntrega(null)}
                            className="mt-2 self-start"
                        >
                            <Text className="text-neutral-500 text-sm underline">Quitar fecha</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* ========== MAPA DE UBICACIÓN ========== */}
                <View className="bg-white mt-2 px-5 py-4">
                    <Text className="text-neutral-900 font-bold text-base mb-2">
                        📍 Ubicación de entrega
                    </Text>

                    {/* Mostrar el lugar seleccionado */}
                    <View className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-3">
                        <View className="flex-row items-center">
                            <Ionicons name="navigate-circle" size={20} color={BRAND_COLORS.red} />
                            <View className="flex-1 ml-2">
                                <Text className="text-neutral-800 font-semibold">
                                    {getSelectedDeliveryName()}
                                </Text>
                                <Text className="text-neutral-500 text-sm" numberOfLines={2}>
                                    {getSelectedDeliveryAddress()}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Text className="text-neutral-500 text-sm mb-3">
                        Toca el mapa para ajustar la ubicación exacta
                    </Text>

                    <View className="h-48 rounded-xl overflow-hidden border border-neutral-200">
                        <MapView
                            provider={PROVIDER_GOOGLE}
                            style={{ flex: 1 }}
                            initialRegion={ubicacion ? {
                                latitude: ubicacion.lat,
                                longitude: ubicacion.lng,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            } : DEFAULT_REGION}
                            region={ubicacion ? {
                                latitude: ubicacion.lat,
                                longitude: ubicacion.lng,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            } : undefined}
                            onPress={handleMapPress}
                        >
                            {ubicacion && (
                                <Marker
                                    coordinate={{
                                        latitude: ubicacion.lat,
                                        longitude: ubicacion.lng
                                    }}
                                    pinColor={BRAND_COLORS.red}
                                    title={getSelectedDeliveryName()}
                                    description={getSelectedDeliveryAddress()}
                                />
                            )}
                        </MapView>
                    </View>

                    {ubicacion ? (
                        <View className="flex-row items-center mt-2">
                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            <Text className="text-green-600 text-sm font-medium ml-1">
                                Ubicación confirmada
                            </Text>
                        </View>
                    ) : (
                        <View className="flex-row items-center mt-2">
                            <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                            <Text className="text-amber-600 text-sm font-medium ml-1">
                                Toca el mapa para seleccionar ubicación
                            </Text>
                        </View>
                    )}
                </View>

                {/* ========== OBSERVACIONES ========== */}
                <View className="bg-white mt-2 px-5 py-4">
                    <Text className="text-neutral-900 font-bold text-base mb-2">
                        📝 Observaciones (opcional)
                    </Text>
                    <TextInput
                        className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-neutral-900 min-h-[100px]"
                        placeholder="Ej: Entregar en la mañana, llamar antes de llegar..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={observaciones}
                        onChangeText={setObservaciones}
                        maxLength={500}
                    />
                    <Text className="text-neutral-400 text-xs mt-2 text-right">
                        {observaciones.length}/500
                    </Text>
                </View>

                {/* ========== TOTALES ========== */}
                <View className="bg-white mt-2 px-5 py-4">
                    <Text className="text-neutral-900 font-bold text-lg mb-3">
                        💰 Totales
                    </Text>

                    <View className="flex-row justify-between py-2">
                        <Text className="text-neutral-600">Subtotal</Text>
                        <Text className="text-neutral-900 font-medium">
                            ${subtotal.toFixed(2)}
                        </Text>
                    </View>

                    {descuentos > 0 && (
                        <View className="flex-row justify-between py-2">
                            <Text className="text-green-600">Descuentos</Text>
                            <Text className="text-green-600 font-medium">
                                -${descuentos.toFixed(2)}
                            </Text>
                        </View>
                    )}

                    <View className="flex-row justify-between py-2">
                        <Text className="text-neutral-600">IVA (12%)</Text>
                        <Text className="text-neutral-900 font-medium">
                            ${iva.toFixed(2)}
                        </Text>
                    </View>

                    <View className="flex-row justify-between pt-3 mt-2 border-t border-neutral-200">
                        <Text className="text-neutral-900 font-bold text-lg">Total</Text>
                        <Text className="text-brand-red font-bold text-xl">
                            ${total.toFixed(2)}
                        </Text>
                    </View>
                </View>

                <View className="h-40" />
            </ScrollView>

            {/* ========== BOTÓN DE CONFIRMACIÓN FIJO ========== */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-5 pt-4 pb-8 shadow-lg">
                <TouchableOpacity
                    onPress={handleConfirmOrder}
                    disabled={loading}
                    className={`flex-row items-center justify-center py-4 rounded-xl ${loading ? 'bg-neutral-300' : 'bg-brand-red'
                        }`}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <>
                            <ActivityIndicator color="white" size="small" />
                            <Text className="text-white font-bold text-base ml-2">
                                Procesando...
                            </Text>
                        </>
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={24} color="white" />
                            <Text className="text-white font-bold text-base ml-2">
                                Confirmar Pedido • ${total.toFixed(2)}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    disabled={loading}
                    className="items-center py-3 mt-2"
                >
                    <Text className="text-neutral-600 text-sm">
                        Volver al carrito
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ========== MODAL DE ÉXITO ========== */}
            <SuccessModal
                visible={showSuccessModal}
                onClose={handleSuccessModalClose}
                title="Pedido Realizado"
                message={`Tu pedido #${orderNumber} ha sido registrado exitosamente. Recibirás notificaciones sobre su estado.`}
                primaryButtonText="OK"
                onPrimaryPress={handleSuccessModalClose}
            />
        </View>
    )
}
