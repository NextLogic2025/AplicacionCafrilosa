import React, { useState, useCallback, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../shared/types'
import { ClientService, type ClientBranch } from '../../../../services/api/ClientService'
import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { SearchBar } from '../../../../components/ui/SearchBar'
import { CategoryFilter } from '../../../../components/ui/CategoryFilter'

// # Definición de categorías para el filtro
const FILTER_CATEGORIES = [
    { id: 'actives', name: 'Activas' },
    { id: 'inactives', name: 'Inactivas' }
]

export function ClientSucursalesScreen() {
    const navigation = useNavigation<any>()
    const [branches, setBranches] = useState<ClientBranch[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [selectedFilter, setSelectedFilter] = useState<string | number>('actives')
    const [searchQuery, setSearchQuery] = useState('')

    const loadBranches = async () => {
        setLoading(true)
        try {
            const clientData = await ClientService.getMyClientData()
            if (clientData) {
                let data: ClientBranch[] = []

                if (selectedFilter === 'actives') {
                    data = await ClientService.getClientBranches(clientData.id)
                } else {
                    data = await ClientService.getDeactivatedClientBranches(clientData.id)
                }
                setBranches(data)
            }
        } catch (error) {
            console.error('Error cargando sucursales:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadBranches()
        }, [selectedFilter]) 
    )

    const handleRefresh = () => {
        setRefreshing(true)
        loadBranches()
    }

    const filteredBranches = useMemo(() => {
        if (!searchQuery) return branches
        return branches.filter(b =>
            b.nombre_sucursal.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.direccion_entrega.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.contacto_nombre && b.contacto_nombre.toLowerCase().includes(searchQuery.toLowerCase()))
        )
    }, [branches, searchQuery])

    const renderItem = ({ item }: { item: ClientBranch }) => (
        <TouchableOpacity
            className={`p-4 rounded-2xl mb-3 border shadow-sm flex-row items-center justify-between ${item.activo ? 'bg-white border-neutral-100' : 'bg-neutral-50 border-neutral-200'
                }`}
            onPress={() => navigation.navigate('ClientDetallesSucursales' as never, { branchId: item.id } as never)}
        >
            <View className="flex-1">
                <View className="flex-row items-center mb-1.5">
                    {/* # Icono de estado (activo/inactivo) */}
                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${item.activo ? 'bg-red-50' : 'bg-neutral-200'
                        }`}>
                        <Ionicons
                            name="business"
                            size={16}
                            color={item.activo ? BRAND_COLORS.red : '#9CA3AF'}
                        />
                    </View>
                    <Text className={`font-bold text-base flex-1 ${item.activo ? 'text-neutral-800' : 'text-neutral-500'
                        }`}>
                        {item.nombre_sucursal}
                    </Text>
                    {!item.activo && (
                        <View className="bg-neutral-200 px-2 py-0.5 rounded-md ml-2">
                            <Text className="text-[10px] font-bold text-neutral-500 uppercase">Inactiva</Text>
                        </View>
                    )}
                </View>

                <View className="pl-11">
                    <Text className="text-neutral-500 text-xs mb-1" numberOfLines={1}>
                        {item.direccion_entrega}
                    </Text>
                    {item.contacto_nombre && (
                        <Text className="text-neutral-400 text-[10px]">
                            Contacto: {item.contacto_nombre}
                        </Text>
                    )}
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </TouchableOpacity>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Mis Sucursales" variant="standard" onBackPress={() => navigation.goBack()} />

            <View className="bg-white pb-2 border-b border-neutral-100 z-10">
                <View className="px-4 py-2 flex-row items-center gap-3">
                    <View className="flex-1">
                        <SearchBar
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onClear={() => setSearchQuery('')}
                            placeholder="Buscar sucursal..."
                        />
                    </View>
                    <TouchableOpacity
                        className="w-12 h-12 bg-red-600 rounded-xl items-center justify-center shadow-sm active:bg-red-700 mt-1"
                        onPress={() => navigation.navigate('CrearClienteSucursales' as never)}
                    >
                        <Ionicons name="add" size={28} color="white" />
                    </TouchableOpacity>
                </View>

                <CategoryFilter
                    categories={FILTER_CATEGORIES}
                    selectedId={selectedFilter}
                    onSelect={setSelectedFilter}
                />
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                </View>
            ) : (
                <FlatList
                    data={filteredBranches}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[BRAND_COLORS.red]} />}
                    ListEmptyComponent={
                        <EmptyState
                            icon="business-outline"
                            title={selectedFilter === 'actives' ? "Sin Sucursales Activas" : "Sin Sucursales Inactivas"}
                            description={selectedFilter === 'actives'
                                ? "No tienes sucursales registradas. Crea una nueva para gestionar tus entregas."
                                : "No tienes sucursales desactivadas en este momento."
                            }
                        />
                    }
                />
            )}

        </View>
    )
}
