import React, { useCallback, useState } from 'react'
import { View, FlatList, ActivityIndicator, Text, Pressable } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../shared/types'
import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { TicketCard } from '../../../../components/ui/TicketCard'
import { SupportService, Ticket } from '../../../../services/api/SupportService'

export function ClientSupportScreen() {
    const navigation = useNavigation()
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)

    const fetchTickets = async () => {
        setLoading(true)
        try {
            const data = await SupportService.getTickets()
            setTickets(data)
        } finally {
            setLoading(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchTickets()
            return () => { }
        }, [])
    )

    const stats = {
        open: tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length,
        closed: tickets.filter(t => t.status === 'closed').length
    }

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header title="Soporte" variant="standard" onBackPress={() => navigation.goBack()} />

            <View className="flex-1">
                {/* Estadísticas */}
                <View className="flex-row px-5 py-4 gap-3 bg-white border-b border-neutral-100 z-10">
                    <View className="flex-1 bg-neutral-50 p-3 rounded-xl border border-neutral-100 items-center">
                        <Text className="text-yellow-600 text-xs font-medium uppercase mb-1">Abiertos</Text>
                        <Text className="text-neutral-900 text-xl font-bold">{stats.open}</Text>
                    </View>
                    <View className="flex-1 bg-neutral-50 p-3 rounded-xl border border-neutral-100 items-center">
                        <Text className="text-green-600 text-xs font-medium uppercase mb-1">Cerrados</Text>
                        <Text className="text-neutral-900 text-xl font-bold">{stats.closed}</Text>
                    </View>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                    </View>
                ) : (
                    <FlatList
                        data={tickets}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TicketCard ticket={item} onPress={() => { }} />
                        )}
                        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <EmptyState
                                icon="chatbubbles-outline"
                                title="Sin tickets de soporte"
                                description="No tienes solicitudes de soporte activas."
                                actionLabel="Crear Ticket"
                                // @ts-ignore
                                onAction={() => navigation.navigate('CreateTicket')}
                                style={{ marginTop: 20 }}
                            />
                        }
                        refreshing={loading}
                        onRefresh={fetchTickets}
                    />
                )}
            </View>

            {/* FAB para crear ticket (si hay lista, mostramos botón flotante extra o usamos EmptyState acción) */}
            {tickets.length > 0 && (
                <Pressable
                    // @ts-ignore
                    onPress={() => navigation.navigate('CreateTicket')}
                    className="absolute bottom-6 right-6 h-14 w-14 bg-brand-red rounded-full items-center justify-center shadow-lg shadow-red-500/40"
                    style={{ elevation: 5 }}
                >
                    <Ionicons name="add" size={30} color="white" />
                </Pressable>
            )}
        </View>
    )
}
