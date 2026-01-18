import React, { useState, useEffect, useCallback } from 'react'
import {
    View, Text, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { useCart } from '../../../../context/CartContext'
import { OrderService } from '../../../../services/api/OrderService'
import { ClientService, ClientBranch } from '../../../../services/api/ClientService'
import { Header } from '../../../../components/ui/Header'
import { SuccessModal } from '../../../../components/ui/SuccessModal'
import { BRAND_COLORS } from '../../../../shared/types'

type DeliveryOption = 'MATRIZ' | string 

export default function SellerCheckoutScreen() {
    const navigation = useNavigation()
    const { cart, clearCart, currentClient } = useCart()

    // Data State
    const [sucursales, setSucursales] = useState<ClientBranch[]>([])

    // Form State
    const [condicionPago, setCondicionPago] = useState('CONTADO')
    const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<DeliveryOption>('MATRIZ')

    // UI State
    const [loading, setLoading] = useState(false)
    const [loadingData, setLoadingData] = useState(true)
    const [showSucursalesAccordion, setShowSucursalesAccordion] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [orderNumber, setOrderNumber] = useState('')

    // Helper para manejar valores numéricos de forma segura
    const safeNumber = (value: any): number => {
        const num = Number(value)
        return isNaN(num) || !isFinite(num) ? 0 : num
    }

    // Cart Totals
    const subtotal = safeNumber(cart.subtotal) || cart.items.reduce((sum, item) => sum + safeNumber(item.subtotal), 0)
    const descuentos = safeNumber(cart.descuento_total) || 0
    const iva = safeNumber(cart.impuestos_total) || (subtotal - descuentos) * 0.12
    const total = safeNumber(cart.total_final) || (subtotal - descuentos + iva)

    // Load Initial Data
    useEffect(() => {
        const loadData = async () => {
            setLoadingData(true)
            try {
                if (currentClient) {
                    // Set Payment Condition based on Client Credit
                    if (currentClient.tiene_credito && currentClient.dias_plazo > 0) {
                        setCondicionPago(diasPlazoToCondicion(currentClient.dias_plazo))
                    } else {
                        setCondicionPago('CONTADO')
                    }

                    // Load Client Branches
                    try {
                        const branches = await ClientService.getClientBranches(currentClient.id)
                        setSucursales(branches.filter(b => b.activo))
                    } catch (e) {
                        console.warn('Error loading branches', e)
                    }
                }
            } catch (error) {
                console.warn('Could not load client details', error)
            } finally {
                setLoadingData(false)
            }
        }
        loadData()
    }, [currentClient])

    const diasPlazoToCondicion = (dias: number): string => {
        if (dias <= 0) return 'CONTADO'
        if (dias <= 15) return 'CREDITO_15D'
        if (dias <= 30) return 'CREDITO_30D'
        return 'CREDITO'
    }

    // Handle Delivery Selection
    const handleDeliveryOptionChange = useCallback((option: DeliveryOption) => {
        setSelectedDeliveryOption(option)
        if (option !== 'MATRIZ') setShowSucursalesAccordion(false)
    }, [])

    // Confirm Order
    const handleConfirmOrder = async () => {
        if (!currentClient) {
            Alert.alert('Error', 'No se ha seleccionado un cliente.')
            return
        }

        if (cart.items.length === 0) {
            Alert.alert('Error', 'El carrito está vacío.')
            return
        }

        const hasZeroPrice = cart.items.some(i => (safeNumber(i.precio_final) <= 0) || (safeNumber(i.subtotal) <= 0))
        if (hasZeroPrice || total <= 0) {
            Alert.alert('Error', 'Hay productos sin precio válido. Verifica los precios antes de confirmar.')
            return
        }

        setLoading(true)
        try {
            // Payload for Backend
            const payload = {
                condicion_pago: (condicionPago.includes('CREDITO') ? 'CREDITO' : 'CONTADO') as 'CREDITO' | 'CONTADO',
                sucursal_id: selectedDeliveryOption !== 'MATRIZ' ? selectedDeliveryOption : undefined
            }

            // Vendedor crea pedido desde carrito del cliente
            // Use usuario_principal_id if available, otherwise fall back to client.id
            const clientIdentifier = currentClient.usuario_principal_id || currentClient.id
            const newOrder = await OrderService.createOrderFromCart(
                { type: 'client', clientId: clientIdentifier },
                payload
            )

            setOrderNumber(newOrder.codigo_visual?.toString() || 'N/A')

            // Clear cart
            setTimeout(() => clearCart(), 100)
            setShowSuccessModal(true)

        } catch (error: any) {
            console.error('Checkout error:', error)
            const backendMsg = error?.info?.backendMessage || error?.message
            let errorMessage = backendMsg || 'No se pudo procesar el pedido'

            if (errorMessage.includes('500')) {
                errorMessage = 'Error del servidor. Por favor verifica tu conexión.'
            }

            Alert.alert('Error', errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        (navigation as any).reset({
            index: 0,
            routes: [{ name: 'SellerTabs' }]
        })
        setTimeout(() => {
            (navigation as any).navigate('SellerOrdersHistory')
        }, 100)
    }

    if (loadingData) {
        return (
            <View className="flex-1 bg-neutral-50 justify-center items-center">
                <ActivityIndicator size="large" color={BRAND_COLORS.red} />
            </View>
        )
    }

    if (!currentClient) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header title="Confirmar Pedido" variant="standard" />
                <View className="flex-1 justify-center items-center px-8">
                    <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                    <Text className="text-xl font-bold text-neutral-700 mt-4 text-center">
                        No hay cliente seleccionado
                    </Text>
                    <Text className="text-neutral-500 text-center mt-2">
                        Debes seleccionar un cliente desde el catálogo de productos
                    </Text>
                    <TouchableOpacity
                        className="mt-6 bg-red-600 px-6 py-3 rounded-xl"
                        onPress={() => navigation.goBack()}
                    >
                        <Text className="text-white font-bold">Volver</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Confirmar Pedido" variant="standard" />

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
                {/* 1. Info del Cliente */}
                <View className="bg-white mt-4 mx-4 p-4 rounded-2xl shadow-sm border border-neutral-100">
                    <Text className="text-lg font-bold text-neutral-800 mb-3">👤 Cliente</Text>
                    <View className="flex-row items-center">
                        <View className="w-12 h-12 bg-red-50 rounded-full items-center justify-center mr-3">
                            <Ionicons name="person" size={24} color={BRAND_COLORS.red} />
                        </View>
                        <View className="flex-1">
                            <Text className="font-bold text-neutral-900 text-base">
                                {currentClient.nombre_comercial || currentClient.razon_social}
                            </Text>
                            <Text className="text-neutral-500 text-sm">
                                {currentClient.identificacion}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 2. Resumen del Pedido */}
                <View className="bg-white mt-4 mx-4 p-4 rounded-2xl shadow-sm border border-neutral-100">
                    <Text className="text-lg font-bold text-neutral-800 mb-3">📦 Resumen del Pedido</Text>
                    {cart.items.map((item, i) => (
                        <View key={item.id} className={`flex-row justify-between py-3 ${i < cart.items.length - 1 ? 'border-b border-neutral-100' : ''}`}>
                            <View className="flex-1 pr-4">
                                <Text className="font-medium text-neutral-800">{item.nombre_producto}</Text>
                                <View className="flex-row items-center mt-1">
                                    <Text className="text-xs text-neutral-500 mr-2">
                                        {item.cantidad} x ${safeNumber(item.precio_final).toFixed(2)}
                                    </Text>
                                    {safeNumber(item.precio_lista) > safeNumber(item.precio_final) && (
                                        <Text className="text-xs text-neutral-400 line-through mr-2">
                                            ${safeNumber(item.precio_lista).toFixed(2)}
                                        </Text>
                                    )}
                                </View>
                                {item.motivo_descuento && (
                                    <View className="bg-red-50 self-start px-2 py-0.5 rounded mt-1 border border-red-100">
                                        <Text className="text-[10px] font-bold text-red-600">
                                            🔥 {item.motivo_descuento}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View className="items-end">
                                <Text className="font-bold text-neutral-800">
                                    ${safeNumber(item.subtotal).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* 3. Lugar de Entrega */}
                <View className="bg-white mt-4 mx-4 p-4 rounded-2xl shadow-sm border border-neutral-100">
                    <Text className="text-lg font-bold text-neutral-800 mb-3">📍 Lugar de Entrega</Text>

                    {/* Matriz Option */}
                    <TouchableOpacity
                        onPress={() => handleDeliveryOptionChange('MATRIZ')}
                        className={`flex-row items-center p-3 rounded-xl border mb-2 ${selectedDeliveryOption === 'MATRIZ' ? 'bg-red-50 border-red-200' : 'bg-neutral-50 border-neutral-200'}`}
                    >
                        <Ionicons
                            name={selectedDeliveryOption === 'MATRIZ' ? "radio-button-on" : "radio-button-off"}
                            size={20}
                            color={selectedDeliveryOption === 'MATRIZ' ? BRAND_COLORS.red : '#9CA3AF'}
                        />
                        <View className="ml-3 flex-1">
                            <Text className={`font-bold ${selectedDeliveryOption === 'MATRIZ' ? 'text-red-700' : 'text-neutral-700'}`}>
                                Local Principal (Matriz)
                            </Text>
                            <Text className="text-xs text-neutral-500">
                                {currentClient.direccion_texto || 'Sin dirección registrada'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Branches Accordion */}
                    {sucursales.length > 0 && (
                        <View>
                            <TouchableOpacity
                                onPress={() => setShowSucursalesAccordion(!showSucursalesAccordion)}
                                className="flex-row items-center justify-between py-2 px-1"
                            >
                                <Text className="text-neutral-500 font-medium">
                                    Ver Sucursales ({sucursales.length})
                                </Text>
                                <Ionicons
                                    name={showSucursalesAccordion ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color="#9CA3AF"
                                />
                            </TouchableOpacity>

                            {showSucursalesAccordion && sucursales.map(branch => (
                                <TouchableOpacity
                                    key={branch.id}
                                    onPress={() => handleDeliveryOptionChange(branch.id)}
                                    className={`flex-row items-center p-3 rounded-xl border mb-2 ${selectedDeliveryOption === branch.id ? 'bg-red-50 border-red-200' : 'bg-neutral-50 border-neutral-200'}`}
                                >
                                    <Ionicons
                                        name={selectedDeliveryOption === branch.id ? "radio-button-on" : "radio-button-off"}
                                        size={20}
                                        color={selectedDeliveryOption === branch.id ? BRAND_COLORS.red : '#9CA3AF'}
                                    />
                                    <View className="ml-3 flex-1">
                                        <Text className={`font-bold ${selectedDeliveryOption === branch.id ? 'text-red-700' : 'text-neutral-700'}`}>
                                            {branch.nombre_sucursal}
                                        </Text>
                                        <Text className="text-xs text-neutral-500">
                                            {branch.direccion_entrega}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* 4. Condición de Pago */}
                <View className="bg-white mt-4 mx-4 p-4 rounded-2xl shadow-sm border border-neutral-100">
                    <Text className="text-lg font-bold text-neutral-800 mb-3">💳 Condición de Pago</Text>

                    {currentClient.tiene_credito ? (
                        <View>
                            <View className="flex-row gap-2 mb-3">
                                <TouchableOpacity
                                    onPress={() => setCondicionPago('CONTADO')}
                                    className={`flex-1 py-3 rounded-xl border items-center ${condicionPago === 'CONTADO' ? 'bg-green-50 border-green-200' : 'bg-white border-neutral-200'}`}
                                >
                                    <Text className={`font-bold ${condicionPago === 'CONTADO' ? 'text-green-700' : 'text-neutral-600'}`}>
                                        Contado
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setCondicionPago(diasPlazoToCondicion(currentClient.dias_plazo || 0))}
                                    className={`flex-1 py-3 rounded-xl border items-center ${condicionPago.includes('CREDITO') ? 'bg-blue-50 border-blue-200' : 'bg-white border-neutral-200'}`}
                                >
                                    <Text className={`font-bold ${condicionPago.includes('CREDITO') ? 'text-blue-700' : 'text-neutral-600'}`}>
                                        Crédito
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {condicionPago.includes('CREDITO') && (
                                <View className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex-row items-center">
                                    <Ionicons name="time-outline" size={18} color="#2563EB" />
                                    <Text className="ml-2 text-blue-700 text-sm font-medium">
                                        Plazo disponible: {currentClient.dias_plazo} días
                                    </Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        <View className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex-row items-center">
                            <Ionicons name="alert-circle" size={20} color="#EA580C" />
                            <Text className="ml-2 text-orange-800 text-sm font-medium">
                                Cliente solo con pago de Contado
                            </Text>
                        </View>
                    )}
                </View>

                {/* 5. Totales Finales */}
                <View className="mt-6 mx-6 mb-8">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-neutral-500">Subtotal</Text>
                        <Text className="font-bold text-neutral-800">${subtotal.toFixed(2)}</Text>
                    </View>
                    {descuentos > 0 && (
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-green-600">Descuentos</Text>
                            <Text className="font-bold text-green-600">-${descuentos.toFixed(2)}</Text>
                        </View>
                    )}
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-neutral-500">IVA (12%)</Text>
                        <Text className="font-bold text-neutral-800">${iva.toFixed(2)}</Text>
                    </View>
                    <View className="h-[1px] bg-neutral-200 my-2" />
                    <View className="flex-row justify-between items-center">
                        <Text className="text-xl font-bold text-neutral-900">Total a Pagar</Text>
                        <Text className="text-2xl font-black text-red-600">${total.toFixed(2)}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Bar */}
            <View className="absolute bottom-0 w-full bg-white border-t border-neutral-100 p-4 shadow-lg">
                <TouchableOpacity
                    onPress={handleConfirmOrder}
                    disabled={loading}
                    className={`w-full py-4 rounded-xl flex-row justify-center items-center ${loading ? 'bg-neutral-300' : 'bg-red-600'}`}
                    style={{
                        shadowColor: '#DC2626',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6
                    }}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={24} color="white" />
                            <Text className="text-white font-bold text-lg ml-2">
                                Confirmar Pedido
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <SuccessModal
                visible={showSuccessModal}
                title="¡Pedido Creado!"
                message={`El pedido #${orderNumber} para ${currentClient.nombre_comercial || currentClient.razon_social} ha sido generado correctamente.`}
                onClose={handleSuccessModalClose}
                onPrimaryPress={handleSuccessModalClose}
                primaryButtonText="Ver Pedidos"
            />
        </View>
    )
}
