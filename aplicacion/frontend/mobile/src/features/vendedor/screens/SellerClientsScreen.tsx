import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator, TextInput, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Header } from '../../../components/ui/Header'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ClientService, type Client } from '../../../services/api/ClientService'
import { SellerStackParamList } from '../../../navigation/SellerNavigator'

export function SellerClientsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<SellerStackParamList>>()
    const [loading, setLoading] = useState(false)
    const [clients, setClients] = useState<Client[]>([])
    const [search, setSearch] = useState('')

    useEffect(() => {
        loadClients()
    }, [])

    const loadClients = async () => {
        setLoading(true)
        try {
            const data = await ClientService.getMyClients(search)
            setClients(data)
        } catch (error) {
            console.error('Error loading clients', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header title="Mis Clientes" variant="standard" />

            <View className="px-5 py-3 bg-white border-b border-neutral-100 z-10 space-y-3">
                <Pressable
                    className="flex-row items-center justify-center bg-brand-red rounded-xl py-2.5"
                    onPress={() => { /* debug log removed */ }}
                >
                    <Ionicons name="person-add-outline" size={18} color="white" style={{ marginRight: 8 }} />
                    <Text className="text-white font-bold text-sm">Registrar Prospecto</Text>
                </Pressable>

                <View className="flex-row items-center bg-neutral-100 rounded-xl px-4 h-12">
                    <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
                    <TextInput
                        placeholder="Buscar cliente..."
                        className="flex-1 text-neutral-900 font-medium"
                        placeholderTextColor="#9CA3AF"
                        value={search}
                        onChangeText={setSearch}
                        onSubmitEditing={loadClients}
                    />
                </View>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                </View>
            ) : (
                <FlatList
                    data={clients}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={
                        <EmptyState
                            icon="people-outline"
                            title="Sin Clientes"
                            description="No se encontraron clientes asignados."
                            actionLabel="Recargar"
                            onAction={loadClients}
                        />
                    }
                    renderItem={({ item }) => (
                        <Pressable
                            className="bg-white p-4 rounded-xl border border-neutral-100 mb-3 shadow-sm flex-row justify-between items-center active:bg-neutral-50"
                            onPress={() => navigation.navigate('SellerClientDetail', { clientId: item.id })}
                        >
                            <View className="flex-1 mr-2">
                                <Text className="font-bold text-neutral-900 text-base">{item.businessName}</Text>
                                <Text className="text-neutral-500 text-sm">{item.name}</Text>
                                <View className="flex-row items-center mt-1">
                                    <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                                    <Text className="text-neutral-400 text-xs ml-1 mr-3">{item.zone || 'Sin Zona'}</Text>
                                    <Ionicons name="wallet-outline" size={12} color="#9CA3AF" />
                                    <Text className="text-neutral-400 text-xs ml-1">
                                        Crédito: {((item.creditUsed / item.creditLimit) * 100).toFixed(0)}%
                                    </Text>
                                </View>
                            </View>
                            <View>
                                {item.status === 'blocked' ? (
                                    <View className="bg-red-100 px-2 py-1 rounded">
                                        <Text className="text-red-700 text-[10px] font-bold">BLOQ</Text>
                                    </View>
                                ) : (
                                    <View className="bg-green-100 px-2 py-1 rounded">
                                        <Text className="text-green-700 text-[10px] font-bold">ACT</Text>
                                    </View>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" className="ml-2" />
                        </Pressable>
                    )}
                />
            )}
        </View>
    )
}
