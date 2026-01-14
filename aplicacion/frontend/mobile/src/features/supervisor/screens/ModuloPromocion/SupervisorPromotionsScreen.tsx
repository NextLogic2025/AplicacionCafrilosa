import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { GenericList } from '../../../../components/ui/GenericList'
import { SearchBar } from '../../../../components/ui/SearchBar'
import { BRAND_COLORS } from '../../../../shared/types'
import { PromotionService, PromotionCampaign } from '../../../../services/api/PromotionService'

import { CategoryFilter } from '../../../../components/ui/CategoryFilter'
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
            setCampaigns(data)
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
            setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, activo: !c.activo } : c))
            await PromotionService.updateCampaign(campaign.id, { activo: !campaign.activo })
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el estado')
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

    const renderItem = (item: PromotionCampaign) => {
        const alcanceLabel = item.alcance === 'GLOBAL' ? 'GLOBAL' :
                            item.alcance === 'POR_LISTA' ? 'POR_LISTA' :
                            'POR_CLIENTE'

        return (
            <TouchableOpacity
                className="bg-white mb-3 rounded-xl shadow-sm border border-neutral-100"
                style={{ minHeight: 140 }}
                activeOpacity={0.7}
                onPress={() => (navigation as any).navigate('SupervisorPromotionForm', { campaign: item })}
            >
                <View className="flex-row justify-between items-center px-4 pt-4 pb-2">
                    <View className="flex-1 mr-3">
                        <Text className="font-bold text-neutral-900 text-base" numberOfLines={1}>
                            {item.nombre}
                        </Text>
                        <Text className="text-neutral-500 text-xs mt-1">Gestión Móvil</Text>
                    </View>
                    <Switch
                        trackColor={{ false: '#D1D5DB', true: '#bbf7d0' }}
                        thumbColor={item.activo ? '#16a34a' : '#9CA3AF'}
                        ios_backgroundColor="#D1D5DB"
                        onValueChange={() => handleToggleStatus(item)}
                        value={item.activo}
                    />
                </View>

                <View className="px-4 pb-4">
                    <View className="mb-2">
                        <View className="flex-row items-center bg-blue-50 px-3 py-2 rounded-lg border border-blue-100" style={{ height: 32 }}>
                            <Ionicons name="calendar-outline" size={14} color="#2563EB" />
                            <Text className="text-blue-700 text-xs font-semibold ml-2 flex-1" numberOfLines={1}>
                                {item.fecha_inicio && item.fecha_fin
                                    ? `${new Date(item.fecha_inicio).toLocaleDateString()} - ${new Date(item.fecha_fin).toLocaleDateString()}`
                                    : 'Sin fechas'}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row">
                        <View className="flex-1 mr-2">
                            <View className="flex-row items-center bg-purple-50 px-3 py-2 rounded-lg border border-purple-100" style={{ height: 32 }}>
                                <Ionicons name="pricetag-outline" size={14} color="#9333ea" />
                                <Text className="text-purple-700 text-xs font-semibold ml-2" numberOfLines={1}>
                                    {item.tipo_descuento === 'PORCENTAJE'
                                        ? `${item.valor_descuento ?? 0}%`
                                        : `$${(item.valor_descuento ?? 0).toLocaleString()}`}
                                </Text>
                            </View>
                        </View>
                        <View className="flex-1 ml-2">
                            <View className="flex-row items-center bg-orange-50 px-3 py-2 rounded-lg border border-orange-100" style={{ height: 32 }}>
                                <Ionicons name="people-outline" size={14} color="#ea580c" />
                                <Text className="text-orange-700 text-xs font-semibold ml-2" numberOfLines={1}>
                                    {alcanceLabel}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

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
                        onPress={() => (navigation as any).navigate('SupervisorPromotionForm')}
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
