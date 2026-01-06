import React, { useState, useCallback } from 'react'
import { CategoryFilter } from '../../../components/ui/CategoryFilter'

import { View, TouchableOpacity, Text } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'
import { SearchBar } from '../../../components/ui/SearchBar'
import { ZoneService, Zone } from '../../../services/api/ZoneService'
import { AssignmentService } from '../../../services/api/AssignmentService'
import { UserService } from '../../../services/api/UserService'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

export function SupervisorZonesScreen() {
    const navigation = useNavigation<any>()
    const [zones, setZones] = useState<any[]>([])
    const [filteredZones, setFilteredZones] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

    const fetchData = async () => {
        setLoading(true)
        try {
            const [zonesData, assignmentsData, vendorsData] = await Promise.all([
                ZoneService.getZones(),
                AssignmentService.getAllAssignments(),
                UserService.getVendors()
            ])

            // Create Vendor Lookup Map: ID -> Name
            const vendorMap = new Map<string, string>()
            vendorsData.forEach(v => vendorMap.set(v.id, v.name))

            // Enhance Zones with Vendor Name
            const enhancedZones = zonesData.map(zone => {
                // Find principal assignment for this zone
                const assignment = assignmentsData.find(a => Number(a.zona_id) === Number(zone.id) && a.es_principal)
                let vendorName = null

                if (assignment) {
                    vendorName = assignment.nombre_vendedor_cache || vendorMap.get(assignment.vendedor_usuario_id) || 'Desconocido'
                }

                return {
                    ...zone,
                    vendorName
                }
            })

            setZones(enhancedZones)
            setFilteredZones(enhancedZones)

        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchData()
        }, [])
    )

    // Filter effect
    React.useEffect(() => {
        let result = zones

        // 1. Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(z =>
                z.nombre.toLowerCase().includes(query) ||
                z.codigo.toLowerCase().includes(query) ||
                (z.vendorName && z.vendorName.toLowerCase().includes(query)) ||
                (z.ciudad && z.ciudad.toLowerCase().includes(query))
            )
        }

        // 2. Status Filter
        if (statusFilter !== 'all') {
            const isActive = statusFilter === 'active'
            // Check explicit true/false or truthy/falsy
            result = result.filter(z => (z.activo === true) === isActive)
        }

        setFilteredZones(result)
    }, [searchQuery, zones, statusFilter])



    // ... existing code ...

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Zonas Comerciales" variant="standard" onBackPress={() => navigation.goBack()} />

            <View className="bg-white shadow-sm z-10 pb-0">
                <View className="px-5 py-2 flex-row items-center">
                    <View className="flex-1 mr-3">
                        <SearchBar
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Buscar zona, código o vendedor..."
                            onClear={() => setSearchQuery('')}
                        />
                    </View>
                    <TouchableOpacity
                        className="w-12 h-12 rounded-xl items-center justify-center shadow-lg"
                        style={{ backgroundColor: BRAND_COLORS.red }}
                        onPress={() => navigation.navigate('SupervisorZoneDetail', { zone: null })}
                    >
                        <Ionicons name="add" size={28} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Filter Chips via CategoryFilter */}
                <View className="mb-2">
                    <CategoryFilter
                        categories={[
                            { id: 'all', name: 'Todas' },
                            { id: 'active', name: 'Activas' },
                            { id: 'inactive', name: 'Inactivas' }
                        ]}
                        selectedId={statusFilter}
                        onSelect={(id: number | string) => setStatusFilter(id as any)}
                    />
                </View>
            </View>

            <View className="flex-1 px-4 pt-4">
                <GenericList
                    items={filteredZones}
                    isLoading={loading}
                    onRefresh={fetchData}
                    renderItem={(item: any) => (
                        <TouchableOpacity
                            className={`p-4 mb-3 rounded-2xl border flex-row items-center shadow-sm active:bg-neutral-50 ${!item.activo ? 'bg-neutral-50 border-neutral-200 opacity-80' : 'bg-white border-neutral-100'}`}
                            onPress={() => navigation.navigate('SupervisorZoneDetail', { zone: item })}
                        >
                            {/* Icon Container */}
                            <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${!item.activo ? 'bg-neutral-200' : (item.vendorName ? 'bg-blue-50' : 'bg-neutral-100')}`}>
                                <Ionicons
                                    name={!item.activo ? "close-circle-outline" : (item.vendorName ? "map" : "map-outline")}
                                    size={24}
                                    color={!item.activo ? '#9CA3AF' : (item.vendorName ? '#3b82f6' : '#9ca3af')}
                                />
                            </View>

                            {/* Content */}
                            <View className="flex-1">
                                <View className="flex-row justify-between items-start mb-1">
                                    <Text className={`font-bold text-base flex-1 mr-2 ${!item.activo ? 'text-neutral-500 line-through' : 'text-neutral-900'}`} numberOfLines={1}>
                                        {item.nombre}
                                    </Text>

                                    <View className="items-end gap-1">
                                        <View className="bg-neutral-100 px-2 py-0.5 rounded-md self-end">
                                            <Text className="text-[10px] font-bold text-neutral-500">{item.codigo}</Text>
                                        </View>

                                        {/* Status Badge */}
                                        <View className={`px-2 py-0.5 rounded-full ${item.activo ? 'bg-green-100' : 'bg-orange-100'}`}>
                                            <Text className={`text-[10px] font-bold ${item.activo ? 'text-green-700' : 'text-orange-700'}`}>
                                                {item.activo ? 'ACTIVO' : 'INACTIVO'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <Text className="text-neutral-500 text-xs mb-1">
                                    <Ionicons name="location-outline" size={12} color="#6b7280" /> {item.ciudad || 'Sin ciudad'}
                                </Text>

                                {item.vendorName ? (
                                    <View className="flex-row items-center mt-1">
                                        <Ionicons name="person-circle-outline" size={14} color={!item.activo ? '#9CA3AF' : "#2563EB"} />
                                        <Text className={`text-xs font-bold ml-1 ${!item.activo ? 'text-neutral-400' : 'text-blue-600'}`}>{item.vendorName}</Text>
                                    </View>
                                ) : (
                                    <Text className="text-neutral-400 text-xs italic mt-1">Sin Vendedor Asignado</Text>
                                )}
                            </View>

                            <Ionicons name="chevron-forward" size={20} color="#d1d5db" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    )}
                    emptyState={{
                        icon: 'map-outline',
                        title: 'Sin Resultados',
                        message: 'No se encontraron zonas coinciden con tu búsqueda.'
                    }}
                />
            </View>

            {/* Map FAB */}
            <TouchableOpacity
                className="absolute bottom-24 right-6 w-14 h-14 rounded-full items-center justify-center shadow-xl z-50 transform active:scale-95"
                style={{ backgroundColor: BRAND_COLORS.red }}
                onPress={() => navigation.navigate('SupervisorZoneMap')}
            >
                <Ionicons name="map" size={28} color="white" />
            </TouchableOpacity>
        </View>
    )
}
