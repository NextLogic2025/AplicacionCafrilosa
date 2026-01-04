import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'
import { SearchBar } from '../../../components/ui/SearchBar'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { ClientService, Client } from '../../../services/api/ClientService'
import { PriceService, PriceList } from '../../../services/api/PriceService'
import { ZoneService } from '../../../services/api/ZoneService'
import { AssignmentService } from '../../../services/api/AssignmentService'
import { UserService } from '../../../services/api/UserService'
import { CategoryFilter } from '../../../components/ui/CategoryFilter'

export function SupervisorClientsScreen() {
    const navigation = useNavigation<any>()
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [priceLists, setPriceLists] = useState<PriceList[]>([])
    const [selectedListId, setSelectedListId] = useState<number | null>(null)

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch Users as well to resolve "Nombre de la cuenta" (usuario_principal_id)
            const [clientsData, listsData, zonesData, assignmentsData, vendorsData, usersData] = await Promise.all([
                ClientService.getClients(),
                PriceService.getLists(),
                ZoneService.getZones(),
                AssignmentService.getAllAssignments(),
                UserService.getVendors(),
                UserService.getUsers()
            ])

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
            const enhancedClients = clientsData.map(c => {
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

    useFocusEffect(
        useCallback(() => {
            fetchData()
        }, [])
    )

    const filteredClients = clients.filter(c => {
        const matchesSearch = c.razon_social.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.identificacion.includes(searchQuery)
        const matchesList = selectedListId ? c.lista_precios_id === selectedListId : true
        return matchesSearch && matchesList
    })

    const getListName = (id: number) => {
        return priceLists.find(l => l.id === id)?.nombre || 'General'
    }

    const renderItem = (item: any) => (
        <TouchableOpacity
            className="bg-white p-4 mb-3 rounded-xl shadow-sm border border-neutral-100"
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SupervisorClientForm', { client: item })}
        >
            {/* Header: Name and Status */}
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-2">
                    <Text className="font-bold text-neutral-900 text-base" numberOfLines={1}>{item.razon_social}</Text>

                    {/* Linked Account Name - Prominent */}
                    {item._linkedUserName && (
                        <View className="flex-row items-center mt-1">
                            <Ionicons name="person" size={12} color="#7e22ce" />
                            <Text className="text-purple-700 text-xs font-bold ml-1">{item._linkedUserName}</Text>
                        </View>
                    )}

                    {item.nombre_comercial && (
                        <Text className="text-neutral-400 text-[10px] italic mt-0.5" numberOfLines={1}>{item.nombre_comercial}</Text>
                    )}
                </View>
                <View className={`px-2 py-1 rounded-md ${item.bloqueado ? 'bg-red-100' : 'bg-green-100'}`}>
                    <Text className={`text-[10px] font-bold uppercase ${item.bloqueado ? 'text-red-700' : 'text-green-700'}`}>
                        {item.bloqueado ? 'Bloqueado' : 'Activo'}
                    </Text>
                </View>
            </View>

            {/* Row 1: Identification */}
            <View className="flex-row flex-wrap gap-2 mb-2">
                <View className="bg-neutral-50 px-2 py-1 rounded-md border border-neutral-200 flex-row items-center">
                    <Ionicons name="card-outline" size={12} color="#6b7280" />
                    <Text className="text-neutral-600 text-[10px] font-bold ml-1">{item.identificacion}</Text>
                </View>
            </View>

            {/* Row 2: Price List & Operational Context (Zone/Vendor) */}
            <View className="flex-row flex-wrap gap-2 pt-2 border-t border-dashed border-neutral-100">
                {/* Price List Badge - Highlighted */}
                <View className="bg-teal-50 px-2 py-1 rounded-md border border-teal-100 flex-row items-center">
                    <Ionicons name="pricetag" size={12} color="#0d9488" />
                    <Text className="text-teal-700 text-[10px] font-bold ml-1">
                        {getListName(item.lista_precios_id)}
                    </Text>
                </View>

                {item._zoneName && (
                    <View className="bg-orange-50 px-2 py-1 rounded-md border border-orange-100 flex-row items-center">
                        <Ionicons name="map-outline" size={12} color="#ea580c" />
                        <Text className="text-orange-700 text-[10px] font-bold ml-1">{item._zoneName}</Text>
                    </View>
                )}

                {item._vendorName && (
                    <View className="bg-blue-50 px-2 py-1 rounded-md border border-blue-100 flex-row items-center">
                        <Ionicons name="person-circle-outline" size={12} color="#2563EB" />
                        <Text className="text-blue-700 text-[10px] font-bold ml-1">{item._vendorName}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Gestión de Clientes" variant="standard" onBackPress={() => navigation.goBack()} />

            <View className="px-5 py-4 bg-white shadow-sm z-10">
                <View className="flex-row items-center mb-3">
                    <View className="flex-1 mr-3">
                        <SearchBar
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Buscar cliente..." // RUC o Razón Social
                            onClear={() => setSearchQuery('')}
                        />
                    </View>
                    <TouchableOpacity
                        className="w-12 h-12 rounded-xl items-center justify-center shadow-lg"
                        style={{ backgroundColor: BRAND_COLORS.red }}
                        onPress={() => navigation.navigate('SupervisorClientForm')}
                    >
                        <Ionicons name="add" size={28} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Filter Chips */}
                <View className="mb-2">
                    <CategoryFilter
                        categories={[
                            { id: 'all', name: 'Todos' },
                            ...priceLists.map(l => ({ id: l.id, name: l.nombre }))
                        ]}
                        selectedId={selectedListId || 'all'}
                        onSelect={(id) => setSelectedListId(id === 'all' ? null : Number(id))}
                    />
                </View>
            </View>

            <View className="flex-1 px-5 mt-2">
                <GenericList
                    items={filteredClients}
                    isLoading={loading}
                    onRefresh={fetchData}
                    renderItem={renderItem}
                    emptyState={{
                        icon: 'people-outline',
                        title: 'Sin Clientes',
                        message: 'No se encontraron clientes con los filtros seleccionados.'
                    }}
                />
            </View>
        </View>
    )
}
