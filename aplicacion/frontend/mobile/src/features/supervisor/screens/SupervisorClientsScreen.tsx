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
            const [clientsData, listsData] = await Promise.all([
                ClientService.getClients(),
                PriceService.getLists()
            ])
            setClients(clientsData)
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

    const renderItem = (item: Client) => (
        <TouchableOpacity
            className="bg-white p-4 mb-3 rounded-xl shadow-sm border border-neutral-100"
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SupervisorClientForm', { client: item })}
        >
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                    <Text className="font-bold text-neutral-900 text-base">{item.razon_social}</Text>
                    {item.nombre_comercial && (
                        <Text className="text-neutral-500 text-sm italic">{item.nombre_comercial}</Text>
                    )}
                </View>
                <View className={`px-2 py-1 rounded-md ${item.bloqueado ? 'bg-red-100' : 'bg-green-100'}`}>
                    <Text className={`text-[10px] font-bold uppercase ${item.bloqueado ? 'text-red-700' : 'text-green-700'}`}>
                        {item.bloqueado ? 'Bloqueado' : 'Activo'}
                    </Text>
                </View>
            </View>

            <View className="flex-row items-center mt-1">
                <Ionicons name="card-outline" size={14} color="#6b7280" />
                <Text className="text-neutral-500 text-xs ml-1 mr-4">{item.identificacion}</Text>

                <Ionicons name="pricetag-outline" size={14} color="#6b7280" />
                <Text className="text-neutral-500 text-xs ml-1">{getListName(item.lista_precios_id)}</Text>
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
                        className="w-12 h-12 rounded-xl items-center justify-center shadow-sm"
                        style={{ backgroundColor: BRAND_COLORS.red }}
                        onPress={() => navigation.navigate('SupervisorClientForm')}
                    >
                        <Ionicons name="add" size={24} color="white" />
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
