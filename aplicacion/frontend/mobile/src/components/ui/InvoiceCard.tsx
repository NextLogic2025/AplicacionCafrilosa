import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Invoice } from '../../services/api/InvoiceService'
import { BRAND_COLORS } from '../../shared/types'

interface InvoiceCardProps {
    invoice: Invoice
    onPress?: () => void
}

const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
        case 'paid': return 'bg-green-100 text-green-800'
        case 'pending': return 'bg-yellow-100 text-yellow-800'
        case 'overdue': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}

const getStatusLabel = (status: Invoice['status']) => {
    switch (status) {
        case 'paid': return 'PAGADO'
        case 'pending': return 'POR VENCER'
        case 'overdue': return 'VENCIDO'
        default: return status
    }
}

export function InvoiceCard({ invoice, onPress }: InvoiceCardProps) {
    const statusStyle = getStatusColor(invoice.status)
    const isPaid = invoice.status === 'paid'

    return (
        <Pressable
            onPress={onPress}
            className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-black/5 border border-neutral-100"
        >
            <View className="flex-row justify-between items-start mb-3">
                <View>
                    <Text className="text-neutral-500 text-xs font-bold uppercase">Factura</Text>
                    <Text className="text-neutral-900 font-bold text-lg">#{invoice.number}</Text>
                </View>
                <View className={`px-2.5 py-1 rounded-full ${statusStyle.split(' ')[0]}`}>
                    <Text className={`text-[10px] font-bold uppercase tracking-wide ${statusStyle.split(' ')[1]}`}>
                        {getStatusLabel(invoice.status)}
                    </Text>
                </View>
            </View>

            <View className="flex-row justify-between items-end">
                <View className="flex-1">
                    {!isPaid && (
                        <View className="mb-1">
                            <Text className="text-neutral-400 text-xs">Vence el: <Text className="text-neutral-600 font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</Text></Text>
                        </View>
                    )}
                    <Text className="text-neutral-500 text-xs">Total: <Text className="font-medium">${invoice.total.toFixed(2)}</Text></Text>
                </View>

                <View className="items-end">
                    <Text className="text-neutral-400 text-xs mb-0.5">Saldo Pendiente</Text>
                    <Text className={`text-xl font-bold ${invoice.balance > 0 ? 'text-brand-red' : 'text-green-600'}`}>
                        ${invoice.balance.toFixed(2)}
                    </Text>
                </View>
            </View>
        </Pressable>
    )
}
