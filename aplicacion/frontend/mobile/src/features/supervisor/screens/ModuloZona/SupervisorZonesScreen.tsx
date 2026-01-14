import React, { useState, useCallback } from 'react'
import { CategoryFilter } from '../../../../components/ui/CategoryFilter'

import { View, TouchableOpacity, Text } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Header } from '../../../../components/ui/Header'
import { GenericList } from '../../../../components/ui/GenericList'
import { SearchBar } from '../../../../components/ui/SearchBar'
import { ZoneService, Zone } from '../../../../services/api/ZoneService'
import { AssignmentService } from '../../../../services/api/AssignmentService'
import { UserService } from '../../../../services/api/UserService'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../shared/types'

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
                            className={`mb-3 rounded-2xl overflow-hidden shadow-md active:scale-[0.98] ${!item.activo ? 'opacity-80' : ''}`}
                            style={{
                                backgroundColor: '#FFFFFF',
                                shadowColor: !item.activo ? '#9CA3AF' : BRAND_COLORS.red,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 8,
                                elevation: 4
                            }}
                            onPress={() => navigation.navigate('SupervisorZoneDetail', { zone: item })}
                        >
                            {/* Header Color Strip */}
                            <View
                                className="h-2"
                                style={{
                                    backgroundColor: !item.activo
                                        ? '#9CA3AF'
                                        : (item.vendorName ? '#10B981' : BRAND_COLORS.red)
                                }}
                            />

                            <View className="p-4">
                                {/* Top Row: Zone Name + Status */}
                                <View className="flex-row justify-between items-start mb-3">
                                    <View className="flex-1 mr-3">
                                        <Text
                                            className={`font-bold text-lg mb-1 ${!item.activo ? 'text-neutral-500 line-through' : 'text-neutral-900'}`}
                                            numberOfLines={2}
                                        >
                                            {item.nombre}
                                        </Text>

                                        {/* Código Badge */}
                                        <View className="self-start bg-neutral-100 px-3 py-1 rounded-lg">
                                            <Text className="text-xs font-bold text-neutral-600 uppercase tracking-wide">
                                                {item.codigo}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Status Badge */}
                                    <View className={`px-3 py-1.5 rounded-full ${item.activo ? 'bg-green-100' : 'bg-orange-100'}`}>
                                        <Text className={`text-xs font-bold ${item.activo ? 'text-green-700' : 'text-orange-700'}`}>
                                            {item.activo ? 'ACTIVA' : 'INACTIVA'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Location Section */}
                                <View className="bg-neutral-50 px-3 py-2.5 rounded-xl mb-3 border border-neutral-100">
                                    <View className="flex-row items-center">
                                        <View className="w-8 h-8 bg-white rounded-full items-center justify-center mr-2.5 border border-neutral-200">
                                            <Ionicons name="location" size={16} color={BRAND_COLORS.red} />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide mb-0.5">
                                                Ubicación
                                            </Text>
                                            <Text className="text-sm font-bold text-neutral-800">
                                                {item.ciudad || 'Sin ciudad'}
                                            </Text>
                                            {item.macrorregion && (
                                                <Text className="text-xs text-neutral-500 mt-0.5">
                                                    {item.macrorregion}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                {/* Vendor Section */}
                                {item.vendorName ? (
                                    <View
                                        className="bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2.5 rounded-xl border border-green-200"
                                        style={{ backgroundColor: '#ECFDF5' }}
                                    >
                                        <View className="flex-row items-center">
                                            <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-2.5 border border-green-300">
                                                <Ionicons name="person" size={16} color="#10B981" />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-[10px] text-green-700 font-semibold uppercase tracking-wide mb-0.5">
                                                    Vendedor Asignado
                                                </Text>
                                                <Text className="text-sm font-bold text-green-900">
                                                    {item.vendorName}
                                                </Text>
                                            </View>
                                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                        </View>
                                    </View>
                                ) : (
                                    <View className="bg-orange-50 px-3 py-2.5 rounded-xl border border-orange-200">
                                        <View className="flex-row items-center">
                                            <View className="w-8 h-8 bg-orange-100 rounded-full items-center justify-center mr-2.5 border border-orange-300">
                                                <Ionicons name="person-outline" size={16} color="#F97316" />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-[10px] text-orange-700 font-semibold uppercase tracking-wide mb-0.5">
                                                    Estado de Asignación
                                                </Text>
                                                <Text className="text-sm font-bold text-orange-900">
                                                    Sin Vendedor Asignado
                                                </Text>
                                            </View>
                                            <Ionicons name="alert-circle" size={20} color="#F97316" />
                                        </View>
                                    </View>
                                )}

                                {/* Footer: View Details Arrow */}
                                <View className="flex-row items-center justify-end mt-3 pt-3 border-t border-neutral-100">
                                    <Text className="text-xs font-bold text-neutral-500 mr-1">Ver Detalles</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
                                </View>
                            </View>
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
