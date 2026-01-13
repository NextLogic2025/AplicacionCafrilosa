import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { ClientService, type ClientBranch } from '../../../../services/api/ClientService'
import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'

export function ClientSucursalesScreen() {
    const navigation = useNavigation<any>()
    const [branches, setBranches] = useState<ClientBranch[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const loadBranches = async () => {
        try {
            const clientData = await ClientService.getMyClientData()
            if (clientData) {
                const data = await ClientService.getClientBranches(clientData.id)
                setBranches(data)
            }
        } catch (error) {
            console.error('Error loading branches:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadBranches()
        }, [])
    )

    const handleRefresh = () => {
        setRefreshing(true)
        loadBranches()
    }

    const renderItem = ({ item }: { item: ClientBranch }) => (
        <TouchableOpacity
            className="bg-white p-4 rounded-xl mb-3 border border-neutral-100 shadow-sm flex-row items-center justify-between"
            onPress={() => navigation.navigate('ClientDetallesSucursales' as never, { branchId: item.id } as never)}
        >
            <View className="flex-1">
                <View className="flex-row items-center mb-1">
                    <Ionicons name="business" size={18} color={BRAND_COLORS.red} />
                    <Text className="font-bold text-neutral-800 ml-2 text-base">{item.nombre_sucursal}</Text>
                </View>
                <Text className="text-neutral-500 text-sm ml-6" numberOfLines={1}>{item.direccion_entrega}</Text>
                {item.contacto_nombre && (
                    <Text className="text-neutral-400 text-xs ml-6 mt-1">Contacto: {item.contacto_nombre}</Text>
                )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </TouchableOpacity>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Mis Sucursales" variant="standard" onBackPress={() => navigation.goBack()} />

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                </View>
            ) : (
                <FlatList
                    data={branches}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[BRAND_COLORS.red]} />}
                    ListEmptyComponent={
                        <EmptyState
                            icon="business-outline"
                            title="Sin Sucursales"
                            description="No tienes sucursales registradas. Crea una nueva para gestionar tus entregas."
                        />
                    }
                />
            )}

            <TouchableOpacity
                className="absolute bottom-6 right-6 w-14 h-14 bg-red-600 rounded-full items-center justify-center shadow-lg elevation-5"
                onPress={() => navigation.navigate('CrearClienteSucursales' as never)}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
        </View>
    )
}
