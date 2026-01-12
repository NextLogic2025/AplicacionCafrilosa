import React, { useCallback, useState } from 'react'
import { View, FlatList, ActivityIndicator, Text } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { InvoiceCard } from '../../../../components/ui/InvoiceCard'
import { InvoiceService, Invoice } from '../../../../services/api/InvoiceService'

export function ClientInvoicesScreen() {
    const navigation = useNavigation()
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)

    const fetchInvoices = async () => {
        setLoading(true)
        try {
            const data = await InvoiceService.getInvoices()
            setInvoices(data)
        } finally {
            setLoading(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchInvoices()
            return () => { }
        }, [])
    )

    // Estadísticas
    const stats = {
        overdue: invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.balance, 0),
        pending: invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.balance, 0)
    }

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header title="Mis Facturas" variant="standard" onBackPress={() => navigation.goBack()} />

            <View className="flex-1">
                {/* Estadísticas de Deuda */}
                <View className="flex-row px-5 py-4 gap-3 bg-white border-b border-neutral-100 z-10">
                    <View className="flex-1 bg-neutral-50 p-3 rounded-xl border border-neutral-100 items-center">
                        <Text className="text-yellow-600 text-xs font-medium uppercase mb-1">Pendientes</Text>
                        <Text className="text-neutral-900 text-xl font-bold">{invoices.filter(i => i.status === 'pending' || i.status === 'overdue').length}</Text>
                    </View>
                    <View className="flex-1 bg-neutral-50 p-3 rounded-xl border border-neutral-100 items-center">
                        <Text className="text-green-600 text-xs font-medium uppercase mb-1">Pagadas</Text>
                        <Text className="text-neutral-900 text-xl font-bold">{invoices.filter(i => i.status === 'paid').length}</Text>
                    </View>
                </View>

                {/* Info Pago */}
                <View className="bg-blue-50 mx-5 mt-4 p-4 rounded-xl border border-blue-100 flex-row items-center gap-3">
                    <View className="bg-blue-100 p-2 rounded-full">
                        <Ionicons name="information-circle" size={20} color="#1E40AF" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-blue-900 font-bold text-xs uppercase mb-0.5">Pago Físico / Transferencia</Text>
                        <Text className="text-blue-700 text-xs">
                            Realiza tu pago al conductor o transfiere a la cuenta Cta. Cte. Banco Pichincha #1234567890.
                        </Text>
                    </View>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                    </View>
                ) : (
                    <FlatList
                        data={invoices}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <InvoiceCard
                                invoice={item}
                                // @ts-ignore
                                onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })}
                            />
                        )}
                        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <EmptyState
                                icon="document-text-outline"
                                title="Sin facturas pendientes"
                                description="No tienes facturas activas o historial reciente."
                                actionLabel="Actualizar"
                                onAction={fetchInvoices}
                                style={{ marginTop: 20 }}
                            />
                        }
                        refreshing={loading}
                        onRefresh={fetchInvoices}
                    />
                )}
            </View>
        </View>
    )
}
