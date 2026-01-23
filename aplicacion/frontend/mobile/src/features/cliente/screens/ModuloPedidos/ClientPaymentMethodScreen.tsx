import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { OrderService, PaymentMethod, Order } from '../../../../services/api/OrderService'
import { BRAND_COLORS } from '../../../../shared/types'

const PAYMENT_METHODS: Array<{ method: PaymentMethod; label: string; description: string }> = [
    { method: 'CONTADO', label: 'Contado', description: 'Pago al contado (efectivo o tarjeta).' },
    { method: 'CREDITO', label: 'Crédito', description: 'Pagar a plazo con líneas aprobadas.' },
    { method: 'TRANSFERENCIA', label: 'Transferencia', description: 'Transferencia bancaria o ACH.' },
    { method: 'CHEQUE', label: 'Cheque', description: 'Pago con cheque a nombre de la empresa.' }
]

export function ClientPaymentMethodScreen() {
    const navigation = useNavigation<any>()
    const route = useRoute<any>()
    const orderId: string | undefined = route.params?.orderId

    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [feedback, setFeedback] = useState<{
        visible: boolean
        type: FeedbackType
        title: string
        message: string
        onConfirm?: () => void
    }>({ visible: false, type: 'info', title: '', message: '' })

    const totalAmount = useMemo(() => {
        if (!order) return 0
        return order.total_final || order.total || 0
    }, [order])

    useEffect(() => {
        const loadOrder = async () => {
            if (!orderId) {
                setLoading(false)
                return
            }
            try {
                setLoading(true)
                const data = await OrderService.getOrderById(orderId)
                setOrder(data)
            } catch (error) {
                console.error('Error cargando pedido', error)
                setFeedback({
                    visible: true,
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudo cargar el pedido. Intenta nuevamente.',
                    onConfirm: () => navigation.goBack()
                })
            } finally {
                setLoading(false)
            }
        }
        loadOrder()
    }, [orderId, navigation])

    const handleSave = useCallback(async () => {
        if (!order) return
        if (!selectedMethod) {
            setFeedback({
                visible: true,
                type: 'warning',
                title: 'Selecciona un método',
                message: 'Debes elegir una forma de pago antes de continuar.'
            })
            return
        }

        setSubmitting(true)
        try {
            await OrderService.setPaymentMethod(order.id, selectedMethod)
            setFeedback({
                visible: true,
                type: 'success',
                title: 'Método registrado',
                message: 'Tu método de pago ha sido guardado correctamente. Te avisaremos cuando esté listo para procesarlo.',
                onConfirm: () => navigation.goBack()
            })
        } catch (error: any) {
            console.error('Error guardando método de pago:', error)
            setFeedback({
                visible: true,
                type: 'error',
                title: 'Error',
                message: error?.message || 'No se pudo guardar el método. Intenta nuevamente.'
            })
        } finally {
            setSubmitting(false)
        }
    }, [order, selectedMethod, navigation])

    const isReady = useMemo(() => !!orderId && !loading, [orderId, loading])

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Método de Pago" variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView
                className="flex-1 px-4 pt-4"
                contentContainerStyle={{ paddingBottom: 140 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 mb-4">
                    <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xs font-semibold text-neutral-500 uppercase">Pedido</Text>
                        <Text className="text-xs font-semibold text-neutral-400">{order?.estado_actual || 'Estado desconocido'}</Text>
                    </View>
                    <Text className="text-xl font-bold text-neutral-900 mb-1">
                        #{order?.codigo_visual ?? 'N/A'}
                    </Text>
                    <Text className="text-sm text-neutral-500">Total estimado:</Text>
                    <Text className="text-3xl font-black text-red-600">${totalAmount.toFixed(2)}</Text>
                </View>

                <View className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
                    <Text className="text-lg font-bold text-neutral-900 mb-3">Elige cómo deseas pagar</Text>
                    <Text className="text-sm text-neutral-500 mb-4">
                        Una vez que el pedido esté confirmado por el equipo de bodegas, te confirmaremos el valor final y podrás completar el pago con el método seleccionado.
                    </Text>

                    {PAYMENT_METHODS.map((method) => {
                        const active = selectedMethod === method.method
                        return (
                            <TouchableOpacity
                                key={method.method}
                                onPress={() => setSelectedMethod(method.method)}
                                className={`p-4 mb-3 rounded-2xl border ${active ? 'border-blue-500 bg-blue-50' : 'border-neutral-200 bg-white'}`}
                            >
                                <View className="flex-row items-center justify-between">
                                    <Text className={`text-base font-semibold ${active ? 'text-blue-700' : 'text-neutral-800'}`}>
                                        {method.label}
                                    </Text>
                                    {active && (
                                        <Ionicons name="checkmark-circle" size={20} color={BRAND_COLORS.red} />
                                    )}
                                </View>
                                <Text className="text-sm text-neutral-500 mt-1">
                                    {method.description}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>
            </ScrollView>

            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-4">
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={!selectedMethod || submitting}
                    className={`w-full py-4 rounded-xl items-center justify-center shadow-md ${!selectedMethod || submitting ? 'bg-neutral-300' : 'bg-brand-red'}`}
                    style={!selectedMethod || submitting ? undefined : { backgroundColor: BRAND_COLORS.red }}
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Guardar método</Text>
                    )}
                </TouchableOpacity>
            </View>

            <FeedbackModal
                visible={feedback.visible}
                type={feedback.type}
                title={feedback.title}
                message={feedback.message}
                onClose={() => setFeedback(prev => ({ ...prev, visible: false }))}
                onConfirm={feedback.onConfirm}
            />
        </View>
    )
}
