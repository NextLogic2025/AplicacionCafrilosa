import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'
import { SearchBar } from '../../../components/ui/SearchBar'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { PromotionService, PromotionCampaign } from '../../../services/api/PromotionService'

import { CategoryFilter } from '../../../components/ui/CategoryFilter'
import { Switch, Alert } from 'react-native'

export function SupervisorPromotionsScreen() {
    const navigation = useNavigation<any>()
    const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'GLOBAL' | 'POR_LISTA' | 'POR_CLIENTE'>('all')

    const fetchData = async () => {
        setLoading(true)
        try {
            const data = await PromotionService.getCampaigns()
            setCampaigns(data) // Backend returns all non-deleted
        } catch (error) {
            console.error('Error fetching campaigns:', error)
        } finally {
            setLoading(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchData()
        }, [])
    )

    const handleToggleStatus = async (campaign: PromotionCampaign) => {
        try {
            // Optimistic Update
            setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, activo: !c.activo } : c))
            await PromotionService.updateCampaign(campaign.id, { activo: !campaign.activo })
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el estado')
            // Revert
            setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, activo: campaign.activo } : c))
        }
    }

    const filteredCampaigns = campaigns.filter(c => {
        const matchesSearch = c.nombre.toLowerCase().includes(searchQuery.toLowerCase())
        if (!matchesSearch) return false

        if (filter === 'active') return c.activo
        if (filter === 'inactive') return !c.activo
        if (filter === 'GLOBAL') return c.alcance === 'GLOBAL'
        if (filter === 'POR_LISTA') return c.alcance === 'POR_LISTA'
        if (filter === 'POR_CLIENTE') return c.alcance === 'POR_CLIENTE'
        return true
    })

    const renderItem = (item: PromotionCampaign) => (
        <TouchableOpacity
            className="bg-white p-4 mb-3 rounded-xl shadow-sm border border-neutral-100"
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SupervisorPromotionForm', { campaign: item })}
        >
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-2">
                    <Text className="font-bold text-neutral-900 text-base">{item.nombre}</Text>
                    {item.descripcion && (
                        <Text className="text-neutral-500 text-xs mt-1" numberOfLines={2}>{item.descripcion}</Text>
                    )}
                </View>
                <Switch
                    trackColor={{ false: '#767577', true: '#bbf7d0' }}
                    thumbColor={item.activo ? '#16a34a' : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={() => handleToggleStatus(item)}
                    value={item.activo}
                />
            </View>

            {/* Info Row */}
            <View className="flex-row flex-wrap gap-2 mt-2 pt-2 border-t border-dashed border-neutral-100">
                <View className="flex-row items-center bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                    <Ionicons name="calendar-outline" size={12} color="#2563EB" />
                    <Text className="text-blue-700 text-[10px] font-bold ml-1">
                        {new Date(item.fecha_inicio).toLocaleDateString()} - {new Date(item.fecha_fin).toLocaleDateString()}
                    </Text>
                </View>

                <View className="flex-row items-center bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                    <Ionicons name="pricetag-outline" size={12} color="#9333ea" />
                    <Text className="text-purple-700 text-[10px] font-bold ml-1">
                        {item.tipo_descuento === 'PORCENTAJE' ? `${item.valor_descuento}%` : `$${item.valor_descuento}`}
                    </Text>
                </View>

                <View className="flex-row items-center bg-orange-50 px-2 py-1 rounded-md border border-orange-100">
                    <Ionicons name="people-outline" size={12} color="#ea580c" />
                    <Text className="text-orange-700 text-[10px] font-bold ml-1">
                        {item.alcance}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Promociones" variant="standard" onBackPress={() => navigation.goBack()} />

            <View className="bg-white shadow-sm z-10 pb-2">
                <View className="px-5 py-4 flex-row items-center">
                    <View className="flex-1 mr-3">
                        <SearchBar
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Buscar campaña..."
                            onClear={() => setSearchQuery('')}
                        />
                    </View>
                    <TouchableOpacity
                        className="w-12 h-12 rounded-xl items-center justify-center shadow-lg bg-red-600"
                        onPress={() => navigation.navigate('SupervisorPromotionForm')}
                    >
                        <Ionicons name="add" size={28} color="white" />
                    </TouchableOpacity>
                </View>

                <CategoryFilter
                    categories={[
                        { id: 'all', name: 'Todas' },
                        { id: 'active', name: 'Activas' },
                        { id: 'inactive', name: 'Desactivadas' },
                        { id: 'GLOBAL', name: 'Global' },
                        { id: 'POR_LISTA', name: 'Por Lista' },
                        { id: 'POR_CLIENTE', name: 'Por Cliente' },
                    ]}
                    selectedId={filter}
                    onSelect={(id) => setFilter(id as any)}
                />
            </View>

            <View className="flex-1 px-5 mt-4">
                <GenericList
                    items={filteredCampaigns}
                    isLoading={loading}
                    onRefresh={fetchData}
                    renderItem={renderItem}
                    emptyState={{
                        icon: 'pricetags-outline',
                        title: 'Sin Promociones',
                        message: 'No hay campañas que coincidan con los filtros.'
                    }}
                />
            </View>
        </View>
    )
}
