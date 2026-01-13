import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { InvoiceService, type Invoice } from '../../../../services/api/InvoiceService'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Ionicons } from '@expo/vector-icons'

export function SellerInvoicesScreen() {
    const navigation = useNavigation()
    const [loading, setLoading] = useState(false)
    const [invoices, setInvoices] = useState<Invoice[]>([])

    useEffect(() => {
        loadInvoices()
    }, [])

    const loadInvoices = async () => {
        setLoading(true)
        try {
            const data = await InvoiceService.getInvoices()
            setInvoices(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Facturas por Cliente" variant="standard" onBackPress={() => navigation.goBack()} notificationRoute="SellerNotifications" />

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                </View>
            ) : (
                <FlatList
                    data={invoices}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={
                        <EmptyState
                            icon="document-text-outline"
                            title="Sin Facturas"
                            description="No hay facturas pendientes o recientes."
                            actionLabel="Recargar"
                            onAction={loadInvoices}
                        />
                    }
                    renderItem={({ item }) => (
                        <View className="bg-white p-4 rounded-xl border border-neutral-100 mb-3 shadow-sm">
                            <View className="flex-row justify-between mb-2">
                                <View>
                                    <Text className="font-bold text-neutral-900 text-base">{item.clientName || 'Cliente'}</Text>
                                    <Text className="text-neutral-500 text-sm">Factura: {item.number}</Text>
                                </View>
                                <View>
                                    <View className={`px-2 py-1 rounded ${item.status === 'paid' ? 'bg-green-100' : item.status === 'overdue' ? 'bg-red-100' : 'bg-amber-100'}`}>
                                        <Text className={`text-[10px] font-bold uppercase ${item.status === 'paid' ? 'text-green-700' : item.status === 'overdue' ? 'text-red-700' : 'text-amber-700'}`}>
                                            {item.status === 'paid' ? 'PAGADO' : item.status === 'overdue' ? 'VENCIDO' : 'PENDIENTE'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-neutral-100">
                                <View>
                                    <Text className="text-neutral-400 text-xs">Vencimiento</Text>
                                    <Text className="text-neutral-600 text-sm font-medium">{item.dueDate}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-neutral-400 text-xs">Total</Text>
                                    <Text className="text-neutral-900 font-bold text-base">${item.total.toFixed(2)}</Text>
                                </View>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    )
}
