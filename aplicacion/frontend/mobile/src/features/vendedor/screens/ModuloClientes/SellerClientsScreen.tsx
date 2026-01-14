import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, TouchableOpacity, TextInput } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../shared/types'
import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { LoadingScreen } from '../../../../components/ui/LoadingScreen'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { ClientService, type Client } from '../../../../services/api/ClientService'
import { SellerStackParamList } from '../../../../navigation/SellerNavigator'

/**
 * SellerClientsScreen - Pantalla de Mis Clientes
 * 
 * Muestra los clientes asignados al vendedor autenticado
 * Endpoint: GET /api/clientes/mis
 */
export function SellerClientsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<SellerStackParamList>>()

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [clients, setClients] = useState<Client[]>([])
    const [filteredClients, setFilteredClients] = useState<Client[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [priceLists, setPriceLists] = useState<Map<number, string>>(new Map())

    // Cargar al entrar en foco
    useFocusEffect(
        useCallback(() => {
            loadInitialData()
        }, [])
    )

    // Filtrar cuando cambia búsqueda
    useEffect(() => {
        filterClients()
    }, [searchQuery, clients])

    const loadInitialData = async () => {
        setLoading(true)
        try {
            const [clientsData, listsData] = await Promise.all([
                ClientService.getMyClients(),
                ClientService.getPriceLists()
            ])
            
            setClients(clientsData)
            setFilteredClients(clientsData)

            // Crear mapa de listas de precios
            const listsMap = new Map<number, string>()
            listsData.forEach(list => listsMap.set(list.id, list.nombre))
            setPriceLists(listsMap)
        } catch (error) {
            console.error('Error loading clients:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleRefresh = () => {
        setRefreshing(true)
        loadInitialData()
    }

    const filterClients = () => {
        if (!searchQuery.trim()) {
            setFilteredClients(clients)
            return
        }
        const query = searchQuery.toLowerCase()
        const filtered = clients.filter(c =>
            c.razon_social.toLowerCase().includes(query) ||
            c.nombre_comercial?.toLowerCase().includes(query) ||
            c.identificacion.includes(query)
        )
        setFilteredClients(filtered)
    }

    const getPriceListName = (id: number | null) => {
        if (!id) return 'Sin Lista'
        return priceLists.get(id) || 'Sin Lista'
    }

    const getStats = () => {
        const total = clients.length
        const activos = clients.filter(c => !c.bloqueado).length
        const bloqueados = clients.filter(c => c.bloqueado).length
        return { total, activos, bloqueados }
    }

    const stats = getStats()

    const handleClientPress = (client: Client) => {
        navigation.navigate('SellerClientDetail', { clientId: client.id })
    }

    const renderClientCard = ({ item }: { item: Client }) => {
        const priceListName = getPriceListName(item.lista_precios_id)
        const zoneName = item.zona_comercial_nombre || 'Sin Zona'

        return (
            <TouchableOpacity
                className="bg-white mx-4 mb-3 rounded-2xl border border-neutral-100 overflow-hidden"
                style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}
                activeOpacity={0.7}
                onPress={() => handleClientPress(item)}
            >
                {/* Header de la tarjeta */}
                <View className="p-4 border-b border-neutral-50">
                    <View className="flex-row items-start justify-between">
                        {/* Avatar e Info Principal */}
                        <View className="flex-row items-center flex-1 mr-3">
                            <View className="w-12 h-12 rounded-xl bg-red-50 items-center justify-center mr-3">
                                <Ionicons name="business" size={22} color={BRAND_COLORS.red} />
                            </View>
                            <View className="flex-1">
                                {/* Nombre del contacto/usuario principal */}
                                {item.usuario_principal_nombre && (
                                    <Text className="text-sm font-bold text-neutral-900" numberOfLines={1}>
                                        {item.usuario_principal_nombre}
                                    </Text>
                                )}
                                <Text className={`${item.usuario_principal_nombre ? 'text-xs text-neutral-500' : 'text-base font-bold text-neutral-900'}`} numberOfLines={1}>
                                    {item.nombre_comercial || item.razon_social}
                                </Text>
                                {item.nombre_comercial && !item.usuario_principal_nombre && (
                                    <Text className="text-xs text-neutral-500" numberOfLines={1}>
                                        {item.razon_social}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Badge de Estado */}
                        <StatusBadge
                            label={item.bloqueado ? 'Bloqueado' : 'Activo'}
                            variant={item.bloqueado ? 'error' : 'success'}
                            size="sm"
                            icon={item.bloqueado ? 'lock-closed' : 'checkmark-circle'}
                        />
                    </View>
                </View>

                {/* Info adicional */}
                <View className="p-4 bg-neutral-50/50">
                    <View className="flex-row flex-wrap gap-y-2">
                        {/* RUC */}
                        <View className="flex-row items-center w-1/2">
                            <Ionicons name="card-outline" size={14} color="#6B7280" />
                            <Text className="text-xs text-neutral-600 ml-1.5 font-medium">RUC:</Text>
                            <Text className="text-xs text-neutral-800 ml-1 font-semibold">{item.identificacion}</Text>
                        </View>

                        {/* Zona */}
                        <View className="flex-row items-center w-1/2">
                            <Ionicons name="location-outline" size={14} color="#6B7280" />
                            <Text className="text-xs text-neutral-600 ml-1.5 font-medium">Zona:</Text>
                            <Text className="text-xs text-neutral-800 ml-1 font-semibold" numberOfLines={1}>{zoneName}</Text>
                        </View>

                        {/* Lista de Precios */}
                        <View className="flex-row items-center w-full">
                            <Ionicons name="pricetag-outline" size={14} color="#6B7280" />
                            <Text className="text-xs text-neutral-600 ml-1.5 font-medium">Lista:</Text>
                            <View className="ml-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100">
                                <Text className="text-[10px] font-bold text-blue-700">{priceListName}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Footer - Ver detalles */}
                <TouchableOpacity 
                    className="flex-row items-center justify-between px-4 py-3 bg-white border-t border-neutral-100"
                    onPress={() => handleClientPress(item)}
                    activeOpacity={0.7}
                >
                    <Text className="text-sm font-semibold text-red-600">Ver detalles</Text>
                    <Ionicons name="chevron-forward" size={18} color={BRAND_COLORS.red} />
                </TouchableOpacity>
            </TouchableOpacity>
        )
    }

    if (loading) {
        return <LoadingScreen />
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Mis Clientes" variant="standard" />

            {/* Barra de búsqueda */}
            <View className="px-4 py-3 bg-white border-b border-neutral-100">
                <View className="flex-row items-center bg-neutral-100 rounded-xl px-3 py-2.5">
                    <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                    <TextInput
                        className="flex-1 ml-2 text-base text-neutral-900"
                        placeholder="Buscar por nombre o RUC..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Stats Cards */}
            <View className="flex-row px-4 py-4 gap-3">
                <View className="flex-1 bg-white p-3 rounded-xl border border-neutral-100 items-center">
                    <Ionicons name="people" size={22} color={BRAND_COLORS.red} />
                    <Text className="text-2xl font-bold text-neutral-900 mt-1">{stats.total}</Text>
                    <Text className="text-[10px] text-neutral-500 font-medium">Total Clientes</Text>
                </View>
                <View className="flex-1 bg-white p-3 rounded-xl border border-neutral-100 items-center">
                    <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                    <Text className="text-2xl font-bold text-neutral-900 mt-1">{stats.activos}</Text>
                    <Text className="text-[10px] text-neutral-500 font-medium">Activos</Text>
                </View>
                <View className="flex-1 bg-white p-3 rounded-xl border border-neutral-100 items-center">
                    <Ionicons name="lock-closed" size={22} color="#DC2626" />
                    <Text className="text-2xl font-bold text-neutral-900 mt-1">{stats.bloqueados}</Text>
                    <Text className="text-[10px] text-neutral-500 font-medium">Bloqueados</Text>
                </View>
            </View>

            {/* Lista de clientes */}
            <FlatList
                data={filteredClients}
                keyExtractor={item => item.id}
                renderItem={renderClientCard}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[BRAND_COLORS.red]}
                        tintColor={BRAND_COLORS.red}
                    />
                }
                ListEmptyComponent={
                    <EmptyState
                        icon="people-outline"
                        title={searchQuery ? "Sin resultados" : "No tienes clientes asignados"}
                        description={searchQuery 
                            ? "No se encontraron clientes con ese criterio de búsqueda"
                            : "Cuando te asignen clientes, aparecerán aquí"
                        }
                    />
                }
            />
        </View>
    )
}
