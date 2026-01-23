import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Invoice } from '../../services/api/InvoiceService'

interface InvoiceCardProps {
    invoice: Invoice
    onPress?: () => void
    showClient?: boolean
}

const STATUS_CONFIG = {
    paid: {
        label: 'PAGADO',
        bgColor: '#DCFCE7',
        textColor: '#166534',
        icon: 'checkmark-circle' as const,
        iconColor: '#22C55E'
    },
    pending: {
        label: 'PENDIENTE',
        bgColor: '#FEF3C7',
        textColor: '#92400E',
        icon: 'time' as const,
        iconColor: '#F59E0B'
    },
    overdue: {
        label: 'VENCIDO',
        bgColor: '#FEE2E2',
        textColor: '#991B1B',
        icon: 'alert-circle' as const,
        iconColor: '#EF4444'
    }
}

const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`
}

const formatDate = (dateStr: string) => {
    try {
        return new Date(dateStr).toLocaleDateString('es-EC', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
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

export function InvoiceCard({ invoice, onPress, showClient = true }: InvoiceCardProps) {
    const config = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.pending
    const isPaid = invoice.status === 'paid'
    const isOverdue = invoice.status === 'overdue'
    const daysOverdue = isOverdue ? getDaysOverdue(invoice.dueDate) : 0

    return (
        <Pressable
            onPress={onPress}
            className="bg-white rounded-2xl mb-4 overflow-hidden"
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3
            }}
        >
            {/* Header con estado */}
            <View
                className="flex-row items-center justify-between px-4 py-2.5"
                style={{ backgroundColor: config.bgColor }}
            >
                <View className="flex-row items-center gap-2">
                    <Ionicons name={config.icon} size={16} color={config.iconColor} />
                    <Text style={{ color: config.textColor }} className="text-xs font-bold uppercase tracking-wider">
                        {config.label}
                    </Text>
                    {isOverdue && daysOverdue > 0 && (
                        <View className="bg-red-600 px-2 py-0.5 rounded-full ml-1">
                            <Text className="text-white text-[10px] font-bold">{daysOverdue} días mora</Text>
                        </View>
                    )}
                </View>
                {invoice.estadoSri && (
                    <View className="flex-row items-center gap-1">
                        <Ionicons
                            name={invoice.estadoSri === 'AUTORIZADO' ? 'shield-checkmark' : 'shield-outline'}
                            size={12}
                            color={invoice.estadoSri === 'AUTORIZADO' ? '#059669' : '#6B7280'}
                        />
                        <Text className="text-[10px] text-neutral-500 font-medium">SRI</Text>
                    </View>
                )}
            </View>

            {/* Body principal */}
            <View className="p-4">
                {/* Número de factura y monto */}
                <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                        <Text className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                            Factura
                        </Text>
                        <Text className="text-neutral-900 font-bold text-lg" numberOfLines={1}>
                            {invoice.number}
                        </Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                            Total
                        </Text>
                        <Text className="text-neutral-900 font-bold text-lg">
                            {formatCurrency(invoice.total)}
                        </Text>
                    </View>
                </View>

                {/* Info del cliente (si aplica) */}
                {showClient && invoice.clientName && (
                    <View className="flex-row items-center gap-2 mb-3 pb-3 border-b border-neutral-100">
                        <View className="w-8 h-8 rounded-full bg-neutral-100 items-center justify-center">
                            <Ionicons name="business-outline" size={16} color="#6B7280" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-neutral-800 font-semibold text-sm" numberOfLines={1}>
                                {invoice.clientName}
                            </Text>
                            {invoice.rucCliente && (
                                <Text className="text-neutral-400 text-xs">
                                    RUC: {invoice.rucCliente}
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Información adicional en grid */}
                <View className="flex-row flex-wrap gap-y-2">
                    {/* Fecha emisión */}
                    <View className="w-1/2 pr-2">
                        <View className="flex-row items-center gap-1.5">
                            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                            <Text className="text-neutral-400 text-[10px] uppercase">Emisión</Text>
                        </View>
                        <Text className="text-neutral-700 font-medium text-sm mt-0.5">
                            {formatDate(invoice.issueDate)}
                        </Text>
                    </View>

                    {/* Fecha vencimiento */}
                    <View className="w-1/2 pl-2">
                        <View className="flex-row items-center gap-1.5">
                            <Ionicons name="hourglass-outline" size={14} color={isOverdue ? '#EF4444' : '#9CA3AF'} />
                            <Text className={`text-[10px] uppercase ${isOverdue ? 'text-red-500' : 'text-neutral-400'}`}>
                                Vencimiento
                            </Text>
                        </View>
                        <Text className={`font-medium text-sm mt-0.5 ${isOverdue ? 'text-red-600' : 'text-neutral-700'}`}>
                            {formatDate(invoice.dueDate)}
                        </Text>
                    </View>

                    {/* Pedido relacionado */}
                    {invoice.codigoPedido && (
                        <View className="w-1/2 pr-2 mt-2">
                            <View className="flex-row items-center gap-1.5">
                                <Ionicons name="cart-outline" size={14} color="#9CA3AF" />
                                <Text className="text-neutral-400 text-[10px] uppercase">Pedido</Text>
                            </View>
                            <Text className="text-neutral-700 font-medium text-sm mt-0.5">
                                #{invoice.codigoPedido}
                            </Text>
                        </View>
                    )}

                    {/* Items */}
                    {invoice.itemsCount !== undefined && invoice.itemsCount > 0 && (
                        <View className="w-1/2 pl-2 mt-2">
                            <View className="flex-row items-center gap-1.5">
                                <Ionicons name="cube-outline" size={14} color="#9CA3AF" />
                                <Text className="text-neutral-400 text-[10px] uppercase">Productos</Text>
                            </View>
                            <Text className="text-neutral-700 font-medium text-sm mt-0.5">
                                {invoice.itemsCount} {invoice.itemsCount === 1 ? 'item' : 'items'}
                            </Text>
                        </View>
                    )}

                    {/* Vendedor */}
                    {invoice.vendedorNombre && (
                        <View className="w-full mt-2">
                            <View className="flex-row items-center gap-1.5">
                                <Ionicons name="person-outline" size={14} color="#9CA3AF" />
                                <Text className="text-neutral-400 text-[10px] uppercase">Vendedor</Text>
                            </View>
                            <Text className="text-neutral-700 font-medium text-sm mt-0.5">
                                {invoice.vendedorNombre}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Footer con saldo */}
            {!isPaid && invoice.balance > 0 && (
                <View className="bg-neutral-50 px-4 py-3 flex-row items-center justify-between border-t border-neutral-100">
                    <View className="flex-row items-center gap-2">
                        <Ionicons name="wallet-outline" size={18} color="#6B7280" />
                        <Text className="text-neutral-600 font-medium text-sm">Saldo Pendiente</Text>
                    </View>
                    <Text className="text-red-600 font-bold text-lg">
                        {formatCurrency(invoice.balance)}
                    </Text>
                </View>
            )}

            {/* Footer pagado */}
            {isPaid && (
                <View className="bg-green-50 px-4 py-3 flex-row items-center justify-center gap-2 border-t border-green-100">
                    <Ionicons name="checkmark-done-circle" size={20} color="#16A34A" />
                    <Text className="text-green-700 font-bold text-sm">Factura Completamente Pagada</Text>
                </View>
            )}
        </Pressable>
    )
}
