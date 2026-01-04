
import React, { useState, useEffect } from 'react'
import { View, TouchableOpacity, Text } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'
import { SearchBar } from '../../../components/ui/SearchBar'
import { ZoneService, Zone } from '../../../services/api/ZoneService'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

export function SupervisorZonesScreen() {
    const navigation = useNavigation<any>()
    const [zones, setZones] = useState<Zone[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filteredZones, setFilteredZones] = useState<Zone[]>([])

    const fetchZones = async () => {
        setLoading(true)
        try {
            const data = await ZoneService.getZones()
            setZones(data)
            setFilteredZones(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchZones()
    }, [])

    useEffect(() => {
        if (!searchQuery) {
            setFilteredZones(zones)
        } else {
            const query = searchQuery.toLowerCase()
            const filtered = zones.filter(z =>
                z.nombre.toLowerCase().includes(query) ||
                z.codigo.toLowerCase().includes(query) ||
                (z.ciudad && z.ciudad.toLowerCase().includes(query))
            )
            setFilteredZones(filtered)
        }
    }, [searchQuery, zones])

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Zonas Comerciales" variant="standard" onBackPress={() => navigation.goBack()} />

            <View className="px-5 py-4 bg-white shadow-sm z-10">
                <View className="flex-row items-center">
                    <View className="flex-1 mr-3">
                        <SearchBar
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Buscar zona..."
                            onClear={() => setSearchQuery('')}
                        />
                    </View>
                    <TouchableOpacity
                        className="w-12 h-12 rounded-xl items-center justify-center shadow-sm"
                        style={{ backgroundColor: BRAND_COLORS.red }}
                        onPress={() => navigation.navigate('SupervisorZoneDetail', { zone: null })}
                    >
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <View className="flex-1 px-4 pt-4">
                <GenericList
                    items={filteredZones}
                    isLoading={loading}
                    onRefresh={fetchZones}
                    renderItem={(item: Zone) => (
                        <TouchableOpacity
                            className="bg-white p-4 mb-3 rounded-2xl border border-neutral-100 flex-row items-center shadow-sm"
                            onPress={() => navigation.navigate('SupervisorZoneDetail', { zone: item })}
                        >
                            <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mr-4">
                                <Ionicons name="map-outline" size={24} color={'#3b82f6'} />
                            </View>
                            <View className="flex-1">
                                <Text className="font-bold text-neutral-900 text-base">{item.nombre}</Text>
                                <Text className="text-neutral-500 text-sm">Código: {item.codigo} • {item.ciudad || 'N/A'}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    )}
                    emptyState={{
                        icon: 'map-outline',
                        title: 'Sin Resultados',
                        message: 'No se encontraron zonas con el filtro actual.'
                    }}
                />
            </View>
        </View>
    )
}
