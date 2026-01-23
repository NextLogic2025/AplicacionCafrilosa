import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert, Linking } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../shared/types'
import { Header } from '../ui/Header'
import { InvoiceService, Invoice } from '../../services/api/InvoiceService'

interface InvoiceDetailTemplateProps {
    invoiceId: string
    role?: 'client' | 'supervisor' | 'warehouse' | 'driver'
}

const STATUS_CONFIG = {
    paid: {
        label: 'PAGADO',
        bgColor: '#DCFCE7',
        textColor: '#166534',
        icon: 'checkmark-circle' as const,
        iconColor: '#22C55E',
        gradient: ['#22C55E', '#16A34A']
    },
    pending: {
        label: 'PENDIENTE',
        bgColor: '#FEF3C7',
        textColor: '#92400E',
        icon: 'time' as const,
        iconColor: '#F59E0B',
        gradient: ['#F59E0B', '#D97706']
    },
    overdue: {
        label: 'VENCIDO',
        bgColor: '#FEE2E2',
        textColor: '#991B1B',
        icon: 'alert-circle' as const,
        iconColor: '#EF4444',
        gradient: ['#EF4444', '#DC2626']
    }
}

const formatCurrency = (value: number) => `$${value.toFixed(2)}`

const formatDate = (dateStr: string, full = false) => {
    try {
        const options: Intl.DateTimeFormatOptions = full
            ? { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }
            : { day: '2-digit', month: 'short', year: 'numeric' }
        return new Date(dateStr).toLocaleDateString('es-EC', options)
    } catch {
        return '-'
    }
}

const getDaysOverdue = (dueDate: string): number => {
    const due = new Date(dueDate)
    const today = new Date()
    const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
}

export function InvoiceDetailTemplate({ invoiceId, role }: InvoiceDetailTemplateProps) {
    const navigation = useNavigation<any>()
    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true)
            try {
                const data = await InvoiceService.getInvoiceById(invoiceId)
                setInvoice(data)
            } catch (err) {
                console.error('Error fetching invoice detail', err)
            } finally {
                setLoading(false)
            }
        }
        if (invoiceId) fetchDetail()
    }, [invoiceId])

    const handleDownload = async () => {
        if (!invoice?.pdfUrl) {
            Alert.alert('Sin PDF', 'No hay documento PDF disponible para esta factura.')
            return
        }
        try {
            await Linking.openURL(invoice.pdfUrl)
        } catch {
            Alert.alert('Error', 'No se pudo abrir el documento PDF.')
        }
    }

    const handleViewOrder = () => {
        if (invoice?.pedidoId) {
            navigation.navigate('SupervisorOrderDetail', { orderId: invoice.pedidoId })
        }
    }

    if (loading) {
        return (
            <View className="flex-1 bg-neutral-50 justify-center">
                <ActivityIndicator color={BRAND_COLORS.red} size="large" />
            </View>
        )
    }

    if (!invoice) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header title="Detalle Factura" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 items-center justify-center p-8">
                    <View className="w-20 h-20 rounded-full bg-neutral-100 items-center justify-center mb-4">
                        <Ionicons name="document-text-outline" size={40} color="#D1D5DB" />
                    </View>
                    <Text className="text-neutral-800 font-bold text-lg mb-2">Factura no encontrada</Text>
                    <Text className="text-neutral-500 text-center">No se encontró la factura solicitada o no tienes permisos para verla.</Text>
                </View>
            </View>
        )
    }

    const config = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.pending
    const isPaid = invoice.status === 'paid'
    const isOverdue = invoice.status === 'overdue'
    const daysOverdue = isOverdue ? getDaysOverdue(invoice.dueDate) : 0

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Detalle de Factura" variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Hero Section - Estado y Monto */}
                <View
                    className="mx-4 mt-4 rounded-2xl p-6 items-center"
                    style={{ backgroundColor: config.gradient[0] }}
                >
                    <View className="flex-row items-center gap-2 mb-3">
                        <Ionicons name={config.icon} size={20} color="white" />
                        <Text className="text-white font-bold text-sm uppercase tracking-wider">
                            {config.label}
                        </Text>
                        {isOverdue && daysOverdue > 0 && (
                            <View className="bg-white/20 px-2 py-0.5 rounded-full">
                                <Text className="text-white text-xs font-bold">{daysOverdue} días</Text>
                            </View>
                        )}
                    </View>

                    <Text className="text-white/80 text-sm mb-1">
                        {isPaid ? 'Total Pagado' : 'Saldo Pendiente'}
                    </Text>
                    <Text className="text-white font-extrabold text-4xl">
                        {formatCurrency(isPaid ? invoice.total : invoice.balance)}
                    </Text>

                    {/* Número de factura */}
                    <View className="bg-white/20 px-4 py-2 rounded-full mt-4">
                        <Text className="text-white font-bold text-sm">{invoice.number}</Text>
                    </View>
                </View>

                {/* Quick Info Cards */}
                <View className="flex-row mx-4 mt-4 gap-3">
                    <View className="flex-1 bg-white rounded-xl p-4 items-center" style={{ elevation: 2 }}>
                        <Ionicons name="calendar-outline" size={24} color="#6B7280" />
                        <Text className="text-neutral-400 text-[10px] uppercase mt-2">Emisión</Text>
                        <Text className="text-neutral-900 font-bold text-sm mt-1">{formatDate(invoice.issueDate)}</Text>
                    </View>
                    <View className="flex-1 bg-white rounded-xl p-4 items-center" style={{ elevation: 2 }}>
                        <Ionicons name="hourglass-outline" size={24} color={isOverdue ? '#EF4444' : '#6B7280'} />
                        <Text className={`text-[10px] uppercase mt-2 ${isOverdue ? 'text-red-500' : 'text-neutral-400'}`}>Vencimiento</Text>
                        <Text className={`font-bold text-sm mt-1 ${isOverdue ? 'text-red-600' : 'text-neutral-900'}`}>{formatDate(invoice.dueDate)}</Text>
                    </View>
                </View>

                {/* Cliente (si no soy cliente) */}
                {role !== 'client' && invoice.clientName && (
                    <View className="mx-4 mt-4 bg-white rounded-2xl p-4" style={{ elevation: 2 }}>
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="business-outline" size={18} color="#6B7280" />
                            <Text className="text-neutral-400 text-xs uppercase ml-2 font-bold">Cliente</Text>
                        </View>
                        <View className="flex-row items-center">
                            <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mr-3">
                                <Ionicons name="person" size={24} color="#3B82F6" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-neutral-900 font-bold text-base">{invoice.clientName}</Text>
                                {invoice.rucCliente && (
                                    <Text className="text-neutral-500 text-sm">RUC: {invoice.rucCliente}</Text>
                                )}
                            </View>
                        </View>
                    </View>
                )}

                {/* Información detallada */}
                <View className="mx-4 mt-4 bg-white rounded-2xl p-4" style={{ elevation: 2 }}>
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
                        <Text className="text-neutral-400 text-xs uppercase ml-2 font-bold">Información</Text>
                    </View>

                    {/* Pedido relacionado */}
                    {invoice.codigoPedido && (
                        <Pressable
                            onPress={handleViewOrder}
                            className="flex-row justify-between items-center py-3 border-b border-neutral-100"
                        >
                            <View className="flex-row items-center gap-2">
                                <Ionicons name="cart-outline" size={18} color="#9CA3AF" />
                                <Text className="text-neutral-500">Pedido</Text>
                            </View>
                            <View className="flex-row items-center gap-1">
                                <Text className="text-blue-600 font-bold">#{invoice.codigoPedido}</Text>
                                <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
                            </View>
                        </Pressable>
                    )}

                    {/* Vendedor */}
                    {invoice.vendedorNombre && (
                        <View className="flex-row justify-between items-center py-3 border-b border-neutral-100">
                            <View className="flex-row items-center gap-2">
                                <Ionicons name="person-outline" size={18} color="#9CA3AF" />
                                <Text className="text-neutral-500">Vendedor</Text>
                            </View>
                            <Text className="text-neutral-900 font-medium">{invoice.vendedorNombre}</Text>
                        </View>
                    )}

                    {/* Estado SRI */}
                    {invoice.estadoSri && (
                        <View className="flex-row justify-between items-center py-3 border-b border-neutral-100">
                            <View className="flex-row items-center gap-2">
                                <Ionicons name="shield-checkmark-outline" size={18} color="#9CA3AF" />
                                <Text className="text-neutral-500">Estado SRI</Text>
                            </View>
                            <View className={`flex-row items-center gap-1 px-2 py-1 rounded-full ${invoice.estadoSri === 'AUTORIZADO' ? 'bg-green-100' : 'bg-neutral-100'}`}>
                                <Ionicons
                                    name={invoice.estadoSri === 'AUTORIZADO' ? 'checkmark-circle' : 'time'}
                                    size={14}
                                    color={invoice.estadoSri === 'AUTORIZADO' ? '#16A34A' : '#6B7280'}
                                />
                                <Text className={`text-xs font-bold ${invoice.estadoSri === 'AUTORIZADO' ? 'text-green-700' : 'text-neutral-600'}`}>
                                    {invoice.estadoSri}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Items */}
                    {invoice.itemsCount !== undefined && invoice.itemsCount > 0 && (
                        <View className="flex-row justify-between items-center py-3">
                            <View className="flex-row items-center gap-2">
                                <Ionicons name="cube-outline" size={18} color="#9CA3AF" />
                                <Text className="text-neutral-500">Productos</Text>
                            </View>
                            <Text className="text-neutral-900 font-medium">{invoice.itemsCount} items</Text>
                        </View>
                    )}
                </View>

                {/* Resumen de montos */}
                <View className="mx-4 mt-4 bg-white rounded-2xl p-4" style={{ elevation: 2 }}>
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="calculator-outline" size={18} color="#6B7280" />
                        <Text className="text-neutral-400 text-xs uppercase ml-2 font-bold">Resumen</Text>
                    </View>

                    {invoice.subtotal !== undefined && invoice.subtotal > 0 && (
                        <View className="flex-row justify-between py-2">
                            <Text className="text-neutral-500">Subtotal</Text>
                            <Text className="text-neutral-700 font-medium">{formatCurrency(invoice.subtotal)}</Text>
                        </View>
                    )}

                    {invoice.impuestos !== undefined && invoice.impuestos > 0 && (
                        <View className="flex-row justify-between py-2">
                            <Text className="text-neutral-500">IVA (12%)</Text>
                            <Text className="text-neutral-700 font-medium">{formatCurrency(invoice.impuestos)}</Text>
                        </View>
                    )}

                    <View className="flex-row justify-between py-3 border-t border-neutral-100 mt-2">
                        <Text className="text-neutral-900 font-bold text-base">Total Factura</Text>
                        <Text className="text-neutral-900 font-bold text-lg">{formatCurrency(invoice.total)}</Text>
                    </View>

                    {!isPaid && (
                        <View className="flex-row justify-between py-3 bg-red-50 -mx-4 px-4 mt-2 rounded-b-xl">
                            <Text className="text-red-700 font-bold">Saldo Pendiente</Text>
                            <Text className="text-red-700 font-bold text-lg">{formatCurrency(invoice.balance)}</Text>
                        </View>
                    )}
                </View>

                {/* Detalle de productos */}
                {invoice.detalles && invoice.detalles.length > 0 && (
                    <View className="mx-4 mt-4 bg-white rounded-2xl p-4" style={{ elevation: 2 }}>
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                <Ionicons name="list-outline" size={18} color="#6B7280" />
                                <Text className="text-neutral-400 text-xs uppercase ml-2 font-bold">Productos</Text>
                            </View>
                            <View className="bg-neutral-100 px-2 py-1 rounded-full">
                                <Text className="text-neutral-600 text-xs font-bold">{invoice.detalles.length} items</Text>
                            </View>
                        </View>

                        {invoice.detalles.map((item, idx) => (
                            <View
                                key={idx}
                                className={`py-3 ${idx < invoice.detalles!.length - 1 ? 'border-b border-neutral-100' : ''}`}
                            >
                                <View className="flex-row justify-between items-start">
                                    <View className="flex-1 pr-3">
                                        <Text className="text-neutral-900 font-medium text-sm" numberOfLines={2}>
                                            {item.descripcion}
                                        </Text>
                                        <View className="flex-row items-center mt-1 gap-2">
                                            <View className="bg-neutral-100 px-2 py-0.5 rounded">
                                                <Text className="text-neutral-600 text-xs">
                                                    {item.cantidad} x {formatCurrency(item.precio_unitario)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    <Text className="text-neutral-900 font-bold text-sm">
                                        {formatCurrency(item.total_linea)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Botones de acción */}
                <View className="mx-4 mt-6 mb-8 gap-3">
                    {invoice.pdfUrl && (
                        <Pressable
                            onPress={handleDownload}
                            className="flex-row items-center justify-center bg-brand-red py-4 rounded-xl"
                            style={{ elevation: 2 }}
                        >
                            <Ionicons name="download-outline" size={22} color="white" />
                            <Text className="text-white font-bold text-base ml-2">Descargar PDF</Text>
                        </Pressable>
                    )}

                    {invoice.pedidoId && (
                        <Pressable
                            onPress={handleViewOrder}
                            className="flex-row items-center justify-center bg-white border-2 border-neutral-200 py-4 rounded-xl"
                        >
                            <Ionicons name="cart-outline" size={22} color="#374151" />
                            <Text className="text-neutral-700 font-bold text-base ml-2">Ver Pedido Relacionado</Text>
                        </Pressable>
                    )}
                </View>
            </ScrollView>
        </View>
    )
}
