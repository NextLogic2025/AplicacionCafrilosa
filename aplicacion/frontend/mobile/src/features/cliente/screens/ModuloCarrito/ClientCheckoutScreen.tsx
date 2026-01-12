import React, { useState } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useCart } from '../../../../context/CartContext'
import { OrderService } from '../../../../services/api/OrderService'
import { UserService } from '../../../../services/api/UserService'
import { Header } from '../../../../components/ui/Header'
import { SuccessModal } from '../../../../components/ui/SuccessModal'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

/**
 * ClientCheckoutScreen
 *
 * Pantalla de confirmación de pedido para el cliente.
 * Muestra resumen del carrito y permite confirmar la orden.
 */
export function ClientCheckoutScreen() {
    const navigation = useNavigation()
    const { cart, clearCart } = useCart()
    const [observaciones, setObservaciones] = useState('')
    const [loading, setLoading] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [orderNumber, setOrderNumber] = useState('')

    // Calcular totales
    const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0)
    const descuentos = cart.descuento_total || 0
    const iva = subtotal * 0.12 // IVA 12%
    const total = subtotal - descuentos + iva

    const handleConfirmOrder = async () => {
        if (cart.items.length === 0) {
            Alert.alert('Carrito vacío', 'Agrega productos antes de realizar un pedido')
            return
        }

        setLoading(true)
        try {
            // Obtener datos del usuario
            const user = await UserService.getProfile()
            if (!user?.id) throw new Error('Usuario no autenticado')

            // Preparar datos del pedido con todos los campos necesarios
            const orderData = {
                cliente_id: user.id,
                vendedor_id: user.id, // El cliente es su propio vendedor en la app móvil
                items: cart.items.map(item => ({
                    producto_id: item.producto_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_final,
                    codigo_sku: item.codigo_sku,
                    nombre_producto: item.nombre_producto,
                    unidad_medida: item.unidad_medida || 'UN',
                    motivo_descuento: item.tiene_promocion ? `Descuento ${item.descuento_porcentaje}%` : undefined,
                })),
                observaciones_entrega: observaciones || undefined,
            }

            // Crear el pedido
            const newOrder = await OrderService.createOrder(orderData)

            // Limpiar el carrito DESPUÉS de crear exitosamente
            await clearCart()

            // Guardar número de orden y mostrar modal
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
        // @ts-ignore
        navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
        })
        // Navegar a Pedidos después de resetear
        setTimeout(() => {
            // @ts-ignore
            navigation.navigate('Pedidos')
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
                {/* Resumen de productos */}
                <View className="bg-white mt-2 px-5 py-4">
                    <Text className="text-neutral-900 font-bold text-lg mb-3">
                        Resumen del pedido
                    </Text>

                    {cart.items.map((item, index) => (
                        <View
                            key={item.id}
                            className={`flex-row justify-between items-center py-3 ${
                                index < cart.items.length - 1 ? 'border-b border-neutral-100' : ''
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

                {/* Totales */}
                <View className="bg-white mt-2 px-5 py-4">
                    <Text className="text-neutral-900 font-bold text-lg mb-3">
                        Totales
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

                {/* Observaciones */}
                <View className="bg-white mt-2 px-5 py-4">
                    <Text className="text-neutral-900 font-bold text-base mb-2">
                        Observaciones (opcional)
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

                <View className="h-32" />
            </ScrollView>

            {/* Botón de confirmación fijo */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-5 py-4 shadow-lg">
                <TouchableOpacity
                    onPress={handleConfirmOrder}
                    disabled={loading}
                    className={`flex-row items-center justify-center py-4 rounded-xl ${
                        loading ? 'bg-neutral-300' : 'bg-brand-red'
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
                                Confirmar Pedido
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

            {/* Modal de éxito */}
            <SuccessModal
                visible={showSuccessModal}
                onClose={handleSuccessModalClose}
                title="¡Pedido Creado!"
                message={`Tu pedido #${orderNumber} ha sido registrado exitosamente. Recibirás notificaciones sobre su estado.`}
                primaryButtonText="Ver mis pedidos"
                onPrimaryPress={handleSuccessModalClose}
            />
        </View>
    )
}
