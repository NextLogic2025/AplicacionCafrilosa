import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Alert, FlatList, ActivityIndicator, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { SearchBar } from '../../../../components/ui/SearchBar'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { ClientService, Client } from '../../../../services/api/ClientService'
import { PriceService, PriceList } from '../../../../services/api/PriceService'
import { ZoneService } from '../../../../services/api/ZoneService'
import { AssignmentService } from '../../../../services/api/AssignmentService'
import { UserService } from '../../../../services/api/UserService'
import { CategoryFilter } from '../../../../components/ui/CategoryFilter'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'

export function SupervisorClientsScreen({ navigation }: any) {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [priceLists, setPriceLists] = useState<PriceList[]>([])

    // Unified Filter ID: 'active' | 'blocked' | 'list_ID'
    const [filterMode, setFilterMode] = useState<string>('active')

    // Feedback State
    const [feedbackVisible, setFeedbackVisible] = useState(false)
    const [feedbackConfig, setFeedbackConfig] = useState<{
        type: FeedbackType,
        title: string,
        message: string,
        onConfirm?: () => void,
        showCancel?: boolean,
        confirmText?: string
    }>({ type: 'info', title: '', message: '' })

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch All Data Including Blocked
            const [activeClients, blockedClients, listsData, zonesData, assignmentsData, vendorsData, usersData] = await Promise.all([
                ClientService.getClients(),
                ClientService.getBlockedClients(),
                PriceService.getLists(),
                ZoneService.getZones(),
                AssignmentService.getAllAssignments(),
                UserService.getVendors(),
                UserService.getUsers()
            ])

            const allClientsRaw = [...activeClients, ...blockedClients]

            // 1. Build Lookup Maps
            const zoneMap = new Map()
            zonesData.forEach(z => zoneMap.set(z.id, z.nombre))

            const vendorNameMap = new Map()
            vendorsData.forEach(v => vendorNameMap.set(v.id, v.name))

            const userNameMap = new Map()
            usersData.forEach(u => userNameMap.set(u.id, u.name))

            // Zone ID -> Vendor Name
            const zoneToVendorMap = new Map()
            assignmentsData.filter(a => a.es_principal).forEach(a => {
                const vName = a.nombre_vendedor_cache || vendorNameMap.get(a.vendedor_usuario_id)
                if (vName) zoneToVendorMap.set(Number(a.zona_id), vName)
            })

            // 2. Enhance Clients
            const enhancedClients = allClientsRaw.map(c => {
                const zoneName = c.zona_comercial_id ? zoneMap.get(c.zona_comercial_id) : null
                const vendorName = c.zona_comercial_id ? zoneToVendorMap.get(c.zona_comercial_id) : null
                const linkedUserName = c.usuario_principal_id ? userNameMap.get(c.usuario_principal_id) : null

                return {
                    ...c,
                    _zoneName: zoneName,
                    _vendorName: vendorName,
                    _linkedUserName: linkedUserName
                }
            })

            setClients(enhancedClients)
            setPriceLists(listsData)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        const unsubscribe = navigation.addListener('focus', () => {
            fetchData()
        })
        return unsubscribe
    }, [navigation])

    // Main Filter Logic
    const filteredClients = clients.filter(c => {
        // 1. Search (Always applies)
        const matchesSearch = c.razon_social.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.identificacion.includes(searchQuery)

        if (!matchesSearch) return false

        // 2. Mode Filter
        if (filterMode === 'active') {
            return !c.bloqueado
        } else if (filterMode === 'blocked') {
            return c.bloqueado
        } else if (filterMode.startsWith('list_')) {
            // Price List Filter (Implies Active)
            const listId = Number(filterMode.replace('list_', ''))
            return c.lista_precios_id === listId && !c.bloqueado
        }

        return true
    })

    const getListName = (id: number) => {
        return priceLists.find(l => l.id === id)?.nombre || 'General'
    }

    const confirmToggleStatus = (client: Client) => {
        const isBlocked = client.bloqueado
        const actionVerb = isBlocked ? 'Activar' : 'Suspender'

        setFeedbackConfig({
            type: 'warning',
            title: `¿${actionVerb} Cliente?`,
            message: `¿Estás seguro de que deseas ${actionVerb.toLowerCase()} al cliente ${client.razon_social}?`,
            showCancel: true,
            confirmText: 'Sí, continuar',
            onConfirm: () => executeToggleStatus(client)
        })
        setFeedbackVisible(true)
    }

    const executeToggleStatus = async (client: Client) => {
        setFeedbackVisible(false)
        setLoading(true)

        try {
            if (client.bloqueado) {
                await ClientService.unblockClient(client.id)
                // Success Modal Config
                setTimeout(() => {
                    setFeedbackConfig({
                        type: 'success',
                        title: 'Cliente Activado',
                        message: 'El cliente ha sido activado correctamente.',
                        showCancel: false,
                        confirmText: 'Entendido',
                        onConfirm: () => setFeedbackVisible(false)
                    })
                    setFeedbackVisible(true)
                }, 300)
            } else {
                await ClientService.deleteClient(client.id)
                // Success Modal Config
                setTimeout(() => {
                    setFeedbackConfig({
                        type: 'success',
                        title: 'Cliente Suspendido',
                        message: 'El cliente ha sido suspendido correctamente.',
                        showCancel: false,
                        confirmText: 'Entendido',
                        onConfirm: () => setFeedbackVisible(false)
                    })
                    setFeedbackVisible(true)
                }, 300)
            }
            fetchData()
        } catch (e) {
            console.error(e)
            setTimeout(() => {
                setFeedbackConfig({
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudo actualizar el estado del cliente.',
                    showCancel: false,
                    confirmText: 'Cerrar',
                    onConfirm: () => setFeedbackVisible(false)
                })
                setFeedbackVisible(true)
            }, 300)
        } finally {
            setLoading(false)
        }
    }

    // Prepare Filter Categories
    const filterCategories = [
        { id: 'active', name: 'Activos' },
        { id: 'blocked', name: 'Suspendidos' },
        ...priceLists.map(l => ({ id: `list_${l.id}`, name: l.nombre }))
    ]

    const renderItem = ({ item }: { item: any }) => {
        // Usar el nombre del usuario principal si está disponible (viene del backend)
        const displayName = item.usuario_principal_nombre || item._linkedUserName || 'Usuario no asignado'
        const commercialName = item.nombre_comercial || item.razon_social

        return (
            <TouchableOpacity
                className="bg-white mb-3 rounded-2xl overflow-hidden"
                activeOpacity={0.7}
                onPress={() => (navigation as any).navigate('SupervisorClientDetail', { client: item })}
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                    borderWidth: 1,
                    borderColor: '#f3f4f6'
                }}
            >
                {/* Header: Nombre del Usuario en Grande */}
                <View className="px-4 pt-4 pb-3" style={{ backgroundColor: '#fafafa' }}>
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1 mr-3">
                            {/* Nombre del Usuario - Grande y destacado */}
                            <Text className="font-bold text-neutral-900 text-xl mb-1.5" numberOfLines={1}>
                                {displayName}
                            </Text>

                            {/* Nombre Comercial/Razón Social - Más pequeño */}
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="business-outline" size={14} color="#9ca3af" style={{ marginRight: 6 }} />
                                <Text className="text-neutral-500 text-sm font-medium" numberOfLines={1}>
                                    {commercialName}
                                </Text>
                            </View>

                            {/* Identificación */}
                            <View className="flex-row items-center">
                                <Ionicons name="card-outline" size={12} color="#6b7280" style={{ marginRight: 4 }} />
                                <Text className="text-neutral-600 text-xs font-semibold">{item.identificacion}</Text>
                            </View>
                        </View>

                        {/* Switch Button - Estilo iOS Moderno */}
                        <TouchableOpacity
                            onPress={() => confirmToggleStatus(item)}
                            activeOpacity={0.8}
                            style={{
                                width: 51,
                                height: 31,
                                borderRadius: 15.5,
                                backgroundColor: item.bloqueado ? '#D1D5DB' : '#34D399',
                                padding: 2,
                                justifyContent: 'center'
                            }}
                        >
                            <View
                                style={{
                                    width: 27,
                                    height: 27,
                                    borderRadius: 13.5,
                                    backgroundColor: '#FFFFFF',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 2,
                                    elevation: 3,
                                    transform: [{ translateX: item.bloqueado ? 0 : 20 }]
                                }}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Body Content - Info Badges */}
                <View className="px-4 pb-4 pt-2">
                    <View className="flex-row flex-wrap">
                        {/* Lista de Precios */}
                        <View className="bg-teal-50 px-3 py-2 rounded-xl border border-teal-200 flex-row items-center mr-2 mb-2">
                            <Ionicons name="pricetag" size={14} color="#0d9488" />
                            <Text className="text-teal-700 text-xs font-bold ml-1.5">
                                {getListName(item.lista_precios_id)}
                            </Text>
                        </View>

                        {/* Zona Comercial */}
                        {(item.zona_comercial_nombre || item._zoneName) && (
                            <View className="bg-orange-50 px-3 py-2 rounded-xl border border-orange-200 flex-row items-center mr-2 mb-2">
                                <Ionicons name="map-outline" size={14} color="#ea580c" />
                                <Text className="text-orange-700 text-xs font-bold ml-1.5">
                                    {item.zona_comercial_nombre || item._zoneName}
                                </Text>
                            </View>
                        )}

                        {/* Vendedor Asignado */}
                        {(item.vendedor_nombre || item._vendorName) && (
                            <View className="bg-blue-50 px-3 py-2 rounded-xl border border-blue-200 flex-row items-center mr-2 mb-2">
                                <Ionicons name="person-circle-outline" size={14} color="#2563EB" />
                                <Text className="text-blue-700 text-xs font-bold ml-1.5">
                                    {item.vendedor_nombre || item._vendorName}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Gestión de Clientes" variant="standard" onBackPress={() => navigation.goBack()} />

            <View className="px-5 py-4 bg-white shadow-sm z-10">
                <View className="flex-row items-center mb-3">
                    <View className="flex-1 mr-3">
                        <SearchBar
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Buscar cliente..."
                            onClear={() => setSearchQuery('')}
                        />
                    </View>
                    <TouchableOpacity
                        className="w-12 h-12 rounded-xl items-center justify-center shadow-lg"
                        style={{ backgroundColor: BRAND_COLORS.red }}
                        onPress={() => (navigation as any).navigate('SupervisorClientForm')}
                    >
                        <Ionicons name="add" size={28} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Simplified Chips Logic */}
                <View className="mb-2">
                    <CategoryFilter
                        categories={filterCategories}
                        selectedId={filterMode}
                        onSelect={(id) => setFilterMode(String(id))}
                    />
                </View>
            </View>

            <View className="flex-1 px-5 mt-2">
                {loading && clients.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                    </View>
                ) : (
                    <FlatList
                        data={filteredClients}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={BRAND_COLORS.red} />
                        }
                        ListEmptyComponent={
                            <View className="items-center justify-center py-10">
                                <View className="p-4 rounded-full mb-4 bg-red-50">
                                    <Ionicons name="people-outline" size={40} color={BRAND_COLORS.red} />
                                </View>
                                <Text className="text-lg font-bold text-neutral-900 mb-2">Sin Clientes</Text>
                                <Text className="text-neutral-500 text-sm text-center">No se encontraron clientes con los filtros seleccionados.</Text>
                            </View>
                        }
                    />
                )}
            </View>

            <FeedbackModal
                visible={feedbackVisible}
                type={feedbackConfig.type}
                title={feedbackConfig.title}
                message={feedbackConfig.message}
                onClose={() => setFeedbackVisible(false)}
                onConfirm={feedbackConfig.onConfirm}
                showCancel={feedbackConfig.showCancel}
                confirmText={feedbackConfig.confirmText}
            />
        </View>
    )
}
