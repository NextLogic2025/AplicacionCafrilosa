import React, { useCallback, useState } from 'react'
import { View, FlatList, ActivityIndicator, Text } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../ui/Header'
import { EmptyState } from '../ui/EmptyState'
import { InvoiceCard } from '../ui/InvoiceCard'
import { InvoiceService, Invoice } from '../../services/api/InvoiceService'
import { BRAND_COLORS } from '../../shared/types'

interface InvoiceListTemplateProps {
    role: 'client' | 'supervisor' | 'warehouse' | 'driver'
    title?: string
    onInvoicePress?: (invoice: Invoice) => void
    customHeaderRight?: React.ReactNode
}

export function InvoiceListTemplate({ role, title = 'Facturas', onInvoicePress, customHeaderRight }: InvoiceListTemplateProps) {
    const navigation = useNavigation()
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)

    const fetchInvoices = async () => {
        setLoading(true)
        try {
            // El servicio usará el token actual, y el backend filtrará según el rol del usuario logueado.
            // No es necesario pasar rol explícito al servicio a menos que se requiera filtrado adicional.
            const data = await InvoiceService.getInvoices()
            setInvoices(data)
        } catch (err) {
            console.error('Error fetching invoices', err)
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

    // Estadísticas simples
    const stats = {
        overdue: invoices.filter(i => i.status === 'overdue').length,
        pending: invoices.filter(i => i.status === 'pending').length,
        paid: invoices.filter(i => i.status === 'paid').length
    }

    const renderHeader = () => {
        if (role === 'client') {
            return (
                <View>
                    <View className="flex-row px-5 py-4 gap-3 bg-white border-b border-neutral-100 z-10">
                        <View className="flex-1 bg-neutral-50 p-3 rounded-xl border border-neutral-100 items-center">
                            <Text className="text-yellow-600 text-xs font-medium uppercase mb-1">Pendientes</Text>
                            <Text className="text-neutral-900 text-xl font-bold">{stats.pending + stats.overdue}</Text>
                        </View>
                        <View className="flex-1 bg-neutral-50 p-3 rounded-xl border border-neutral-100 items-center">
                            <Text className="text-green-600 text-xs font-medium uppercase mb-1">Pagadas</Text>
                            <Text className="text-neutral-900 text-xl font-bold">{stats.paid}</Text>
                        </View>
                    </View>
                    <View className="bg-blue-50 mx-5 mt-4 p-4 rounded-xl border border-blue-100 flex-row items-center gap-3">
                        <View className="bg-blue-100 p-2 rounded-full">
                            <Ionicons name="information-circle" size={20} color="#1E40AF" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-blue-900 font-bold text-xs uppercase mb-0.5">Información de Pago</Text>
                            <Text className="text-blue-700 text-xs">
                                Realiza tu pago al conductor o transferencia bancaria.
                            </Text>
                        </View>
                    </View>
                </View>
            )
        }

        // Para roles internos (Supervisor, Bodeguero, etc)
        return (
            <View className="flex-row px-5 py-4 gap-3 bg-white border-b border-neutral-100 z-10">
                <View className="flex-1 bg-red-50 p-3 rounded-xl border border-red-100 items-center">
                    <Text className="text-red-600 text-xs font-medium uppercase mb-1">Vencidas</Text>
                    <Text className="text-neutral-900 text-xl font-bold">{stats.overdue}</Text>
                </View>
                <View className="flex-1 bg-yellow-50 p-3 rounded-xl border border-yellow-100 items-center">
                    <Text className="text-yellow-600 text-xs font-medium uppercase mb-1">Por Vencer</Text>
                    <Text className="text-neutral-900 text-xl font-bold">{stats.pending}</Text>
                </View>
                <View className="flex-1 bg-green-50 p-3 rounded-xl border border-green-100 items-center">
                    <Text className="text-green-600 text-xs font-medium uppercase mb-1">Pagadas</Text>
                    <Text className="text-neutral-900 text-xl font-bold">{stats.paid}</Text>
                </View>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header
                title={title}
                variant="standard"
                onBackPress={() => navigation.goBack()}
                rightElement={customHeaderRight}
            />

            <View className="flex-1">
                {renderHeader()}

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
                                onPress={() => onInvoicePress ? onInvoicePress(item) : undefined}
                            />
                        )}
                        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <EmptyState
                                icon="document-text-outline"
                                title="Sin facturas"
                                description="No se encontraron facturas registradas."
                                actionLabel="Recargar"
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
