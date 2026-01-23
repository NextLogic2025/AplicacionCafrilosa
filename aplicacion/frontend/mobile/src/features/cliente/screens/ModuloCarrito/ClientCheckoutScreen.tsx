import React, { useState, useEffect, useCallback } from 'react'
import {
    View, Text, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { useCart } from '../../../../context/CartContext'
import { OrderService, OrderFromCartOptions } from '../../../../services/api/OrderService'
import { UserService } from '../../../../services/api/UserService'
import { ClientService, ClientBranch, Client } from '../../../../services/api/ClientService'
import { Header } from '../../../../components/ui/Header'
import { SuccessModal } from '../../../../components/ui/SuccessModal'
import { FeedbackModal } from '../../../../components/ui/FeedbackModal'
import { BRAND_COLORS } from '../../../../shared/types'
import { useStableInsets } from '../../../../hooks/useStableInsets'

type DeliveryOption = 'MATRIZ' | string // MATRIZ or Branch ID

export function ClientCheckoutScreen() {
    const navigation = useNavigation()
    // Note: For ClientCheckoutScreen, we ALWAYS use 'me' endpoint since the client is making their own order
    // The isVendorMode flag is not used here because this screen is only for clients
    const { cart, clearCart, userId } = useCart()
    const insets = useStableInsets()
    const footerBottomSpacing = insets.bottom + 16
    const scrollPaddingBottom = footerBottomSpacing + 140

    const [clienteData, setClienteData] = useState<Client | null>(null)
    const [sucursales, setSucursales] = useState<ClientBranch[]>([])

    const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<DeliveryOption>('MATRIZ')

    const [loading, setLoading] = useState(false)
    const [loadingData, setLoadingData] = useState(true)
    const [showSucursalesAccordion, setShowSucursalesAccordion] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [orderNumber, setOrderNumber] = useState('')
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [errorModalMessage, setErrorModalMessage] = useState('')

    const subtotal = cart.subtotal || cart.items.reduce((sum, item) => sum + item.subtotal, 0)
    const descuentos = cart.descuento_total || 0
    const iva = cart.impuestos_total || (subtotal - descuentos) * 0.12
    const total = cart.total_final || (subtotal - descuentos + iva)

    useEffect(() => {
        const loadData = async () => {
            setLoadingData(true)
            try {
                const cliente = await ClientService.getMyClientData()

                if (cliente) {
                    setClienteData(cliente)

                    try {
                        const branches = await ClientService.getClientBranches(cliente.id)
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
    }, [])

    const handleDeliveryOptionChange = useCallback((option: DeliveryOption) => {
        setSelectedDeliveryOption(option)
        if (option !== 'MATRIZ') setShowSucursalesAccordion(false)
    }, [])

    const handleConfirmOrder = async () => {
        if (!userId) {
            setErrorModalMessage('No se ha identificado el usuario del carrito.')
            setShowErrorModal(true)
            return
        }

        setLoading(true)
        try {
            const payload: OrderFromCartOptions = {}
            if (selectedDeliveryOption !== 'MATRIZ') {
                payload.sucursal_id = selectedDeliveryOption
            }
            if (clienteData?.ubicacion_gps?.coordinates?.length === 2) {
                payload.ubicacion = {
                    lat: clienteData.ubicacion_gps.coordinates[1],
                    lng: clienteData.ubicacion_gps.coordinates[0]
                }
            }

            // Client always uses 'me' endpoint - their own cart, their own order
            // vendedor_id will be null in the backend since this is the client's own order
            const target = { type: 'me' as const }

            const newOrder = await OrderService.createOrderFromCart(target, payload)

            setOrderNumber(newOrder.codigo_visual?.toString() || 'N/A')

            setTimeout(() => clearCart(), 100)
            setShowSuccessModal(true)

        } catch (error: any) {
            console.error('Checkout error:', error)
            // El mensaje amigable ya viene procesado desde client.ts
            const errorMessage = error?.message || 'No se pudo procesar el pedido. Intenta nuevamente.'
            setErrorModalMessage(errorMessage)
            setShowErrorModal(true)
        } finally {
            setLoading(false)
        }
    }

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        (navigation as any).reset({
            index: 0,
            routes: [{ name: 'MainTabs' }]
        })
        setTimeout(() => {
            (navigation as any).navigate('Pedidos')
        }, 100)
    }

    if (loadingData) {
        return (
            <View className="flex-1 bg-neutral-50 justify-center items-center">
                <ActivityIndicator size="large" color={BRAND_COLORS.red} />
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Confirmar Pedido" variant="standard" />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}
            >
                {/* 1. Resumen */}
                <View className="bg-white mt-4 mx-4 p-4 rounded-2xl shadow-sm border border-neutral-100">
                    <Text className="text-lg font-bold text-neutral-800 mb-3">📦 Resumen del Pedido</Text>
                    {cart.items.map((item, i) => (
                        <View key={item.id} className={`flex-row justify-between py-3 ${i < cart.items.length - 1 ? 'border-b border-neutral-100' : ''}`}>
                            <View className="flex-1 pr-4">
                                <Text className="font-medium text-neutral-800">{item.nombre_producto}</Text>
                                <View className="flex-row items-center mt-1">
                                    <Text className="text-xs text-neutral-500 mr-2">{item.cantidad} x ${item.precio_final.toFixed(2)}</Text>
                                    {item.precio_lista > item.precio_final && (
                                        <Text className="text-xs text-neutral-400 line-through mr-2">
                                            ${item.precio_lista.toFixed(2)}
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
                                <Text className="font-bold text-neutral-800">${item.subtotal.toFixed(2)}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* 2. Entrega */}
                <View className="bg-white mt-4 mx-4 p-4 rounded-2xl shadow-sm border border-neutral-100">
                    <Text className="text-lg font-bold text-neutral-800 mb-3">📍 Lugar de Entrega</Text>

                    {/* Matriz Option */}
                    <TouchableOpacity
                        onPress={() => handleDeliveryOptionChange('MATRIZ')}
                        className={`flex-row items-center p-3 rounded-xl border mb-2 ${selectedDeliveryOption === 'MATRIZ' ? 'bg-red-50 border-red-200' : 'bg-neutral-50 border-neutral-200'}`}
                    >
                        <Ionicons name={selectedDeliveryOption === 'MATRIZ' ? "radio-button-on" : "radio-button-off"} size={20} color={selectedDeliveryOption === 'MATRIZ' ? BRAND_COLORS.red : '#9CA3AF'} />
                        <View className="ml-3 flex-1">
                            <Text className={`font-bold ${selectedDeliveryOption === 'MATRIZ' ? 'text-red-700' : 'text-neutral-700'}`}>Local Principal (Matriz)</Text>
                            <Text className="text-xs text-neutral-500">{clienteData?.direccion_texto || 'Sin dirección registrada'}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Branches Accordion */}
                    {sucursales.length > 0 && (
                        <View>
                            <TouchableOpacity
                                onPress={() => setShowSucursalesAccordion(!showSucursalesAccordion)}
                                className="flex-row items-center justify-between py-2 px-1"
                            >
                                <Text className="text-neutral-500 font-medium">Ver Sucursales ({sucursales.length})</Text>
                                <Ionicons name={showSucursalesAccordion ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" />
                            </TouchableOpacity>

                            {showSucursalesAccordion && sucursales.map(branch => (
                                <TouchableOpacity
                                    key={branch.id}
                                    onPress={() => handleDeliveryOptionChange(branch.id)}
                                    className={`flex-row items-center p-3 rounded-xl border mb-2 ${selectedDeliveryOption === branch.id ? 'bg-red-50 border-red-200' : 'bg-neutral-50 border-neutral-200'}`}
                                >
                                    <Ionicons name={selectedDeliveryOption === branch.id ? "radio-button-on" : "radio-button-off"} size={20} color={selectedDeliveryOption === branch.id ? BRAND_COLORS.red : '#9CA3AF'} />
                                    <View className="ml-3 flex-1">
                                        <Text className={`font-bold ${selectedDeliveryOption === branch.id ? 'text-red-700' : 'text-neutral-700'}`}>{branch.nombre_sucursal}</Text>
                                        <Text className="text-xs text-neutral-500">{branch.direccion_entrega}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <View className="bg-white mt-4 mx-4 p-4 rounded-2xl shadow-sm border border-neutral-100">
                    <Text className="text-lg font-bold text-neutral-800 mb-2">💳 Pago</Text>
                    <Text className="text-sm text-neutral-600">
                        El método de pago se seleccionará una vez que el pedido esté confirmado por nuestro equipo de bodegas. Te avisaremos para que completes la forma de pago correspondiente.
                    </Text>
                </View>

                <View className="mt-6 mx-6 mb-8">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-neutral-500">Subtotal</Text>
                        <Text className="font-bold text-neutral-800">${subtotal.toFixed(2)}</Text>
                    </View>
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

            <View
                className="absolute w-full bg-white border-t border-neutral-100 p-4 shadow-lg"
                style={{ bottom: footerBottomSpacing, paddingBottom: footerBottomSpacing }}
            >
                <TouchableOpacity
                    onPress={handleConfirmOrder}
                    disabled={loading}
                    className={`w-full py-4 rounded-xl flex-row justify-center items-center ${loading ? 'bg-neutral-300' : 'bg-red-600'}`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={24} color="white" />
                            <Text className="text-white font-bold text-lg ml-2">Confirmar Pedido</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <SuccessModal
                visible={showSuccessModal}
                title="¡Pedido Recibido!"
                message={`Tu pedido #${orderNumber} ha sido generado correctamente.`}
                onClose={handleSuccessModalClose}
                onPrimaryPress={handleSuccessModalClose}
                primaryButtonText="Ir a Mis Pedidos"
            />
            <FeedbackModal
                visible={showErrorModal}
                type="error"
                title="No se pudo procesar el pedido"
                message={errorModalMessage}
                onClose={() => setShowErrorModal(false)}
            />
        </View>
    )
}
