import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, Switch, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { SearchBar } from '../../../../components/ui/SearchBar'
import { BRAND_COLORS } from '../../../../shared/types'
import { PromotionService, PromotionCampaign } from '../../../../services/api/PromotionService'
import { CategoryFilter } from '../../../../components/ui/CategoryFilter'

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
        const alcanceLabel = item.alcance === 'GLOBAL' ? 'Global' :
            item.alcance === 'POR_LISTA' ? 'Por Lista' :
            'Por Cliente'

        const alcanceIcon = item.alcance === 'GLOBAL' ? 'globe-outline' :
            item.alcance === 'POR_LISTA' ? 'list-outline' : 'person-outline'

        const dateLabel = item.fecha_inicio && item.fecha_fin
            ? `${new Date(item.fecha_inicio).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })} - ${new Date(item.fecha_fin).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}`
            : 'Sin fechas'

        const discountLabel = item.tipo_descuento === 'PORCENTAJE'
            ? `${item.valor_descuento ?? 0}% OFF`
            : `$${(item.valor_descuento ?? 0).toLocaleString()} OFF`

        const isActive = item.activo

        return (
            <TouchableOpacity
                style={[styles.card, !isActive && styles.cardDisabled]}
                activeOpacity={0.85}
                onPress={() => (navigation as any).navigate('SupervisorPromotionForm', { campaign: item })}
            >
                <View style={[styles.accent, !isActive && styles.accentDisabled]} />
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.avatarContainer}>
                            <View style={[styles.avatar, !isActive && styles.avatarDisabled]}>
                                <Ionicons name="megaphone" size={22} color={isActive ? '#7C3AED' : '#9CA3AF'} />
                            </View>
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={[styles.promoTitle, !isActive && styles.textDisabled]} numberOfLines={1}>
                                {item.nombre}
                            </Text>
                            <View style={styles.discountRow}>
                                <View style={styles.discountBadge}>
                                    <Text style={styles.discountText}>{discountLabel}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.switchContainer}>
                            <View style={[styles.statusBadge, isActive ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                                <View style={[styles.statusDot, isActive ? styles.statusDotActive : styles.statusDotInactive]} />
                                <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                                    {isActive ? 'Activa' : 'Inactiva'}
                                </Text>
                            </View>
                            <Switch
                                trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
                                thumbColor={isActive ? '#16A34A' : '#9CA3AF'}
                                ios_backgroundColor="#E5E7EB"
                                onValueChange={() => handleToggleStatus(item)}
                                value={isActive}
                                style={styles.switch}
                            />
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.badgeRow}>
                        <View style={[styles.badge, styles.badgeBlue]}>
                            <Ionicons name="calendar-outline" size={13} color="#2563EB" />
                            <Text style={[styles.badgeText, styles.badgeTextBlue]}>{dateLabel}</Text>
                        </View>
                        <View style={[styles.badge, styles.badgeOrange]}>
                            <Ionicons name={alcanceIcon as any} size={13} color="#EA580C" />
                            <Text style={[styles.badgeText, styles.badgeTextOrange]}>{alcanceLabel}</Text>
                        </View>
                        <View style={[styles.badge, styles.badgePurple]}>
                            <Ionicons name="pricetag-outline" size={13} color="#7C3AED" />
                            <Text style={[styles.badgeText, styles.badgeTextPurple]}>
                                {item.tipo_descuento === 'PORCENTAJE' ? 'Porcentaje' : 'Monto Fijo'}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Gestión de Promociones" variant="standard" onBackPress={() => navigation.goBack()} />

            <View className="px-5 py-4 bg-white shadow-sm z-10">
                <View className="flex-row items-center mb-3">
                    <View className="flex-1 mr-3">
                        <SearchBar
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Buscar promoción..."
                            onClear={() => setSearchQuery('')}
                        />
                    </View>
                    <TouchableOpacity
                        className="w-14 h-14 rounded-2xl items-center justify-center shadow-lg"
                        style={{ backgroundColor: '#7C3AED' }}
                        onPress={() => (navigation as any).navigate('SupervisorPromotionForm')}
                    >
                        <Ionicons name="add" size={28} color="white" />
                    </TouchableOpacity>
                </View>

                <View className="mb-2">
                    <CategoryFilter
                        categories={[
                            { id: 'all', name: 'Todas' },
                            { id: 'active', name: 'Activas' },
                            { id: 'inactive', name: 'Inactivas' },
                            { id: 'GLOBAL', name: 'Global' },
                            { id: 'POR_LISTA', name: 'Por Lista' },
                            { id: 'POR_CLIENTE', name: 'Por Cliente' },
                        ]}
                        selectedId={filter}
                        onSelect={(id) => setFilter(id as any)}
                    />
                </View>
            </View>

            <View className="flex-1 px-5 mt-2">
                {loading && campaigns.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#7C3AED" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredCampaigns}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => renderItem(item)}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#7C3AED" />
                        }
                        ListEmptyComponent={
                            <View className="items-center justify-center py-10">
                                <View className="p-4 rounded-full mb-4 bg-purple-50">
                                    <Ionicons name="megaphone-outline" size={40} color="#7C3AED" />
                                </View>
                                <Text className="text-lg font-bold text-neutral-900 mb-2">Sin Promociones</Text>
                                <Text className="text-neutral-500 text-sm text-center">No hay campañas que coincidan con los filtros.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 14,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        flexDirection: 'row'
    },
    cardDisabled: {
        opacity: 0.7,
        backgroundColor: '#FAFAFA'
    },
    accent: {
        width: 5,
        backgroundColor: '#7C3AED'
    },
    accentDisabled: {
        backgroundColor: '#D1D5DB'
    },
    cardContent: {
        flex: 1,
        padding: 16
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    avatarContainer: {
        marginRight: 12
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: '#F5F3FF',
        alignItems: 'center',
        justifyContent: 'center'
    },
    avatarDisabled: {
        backgroundColor: '#F3F4F6'
    },
    headerInfo: {
        flex: 1,
        marginRight: 8
    },
    promoTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 6
    },
    textDisabled: {
        color: '#6B7280'
    },
    discountRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    discountBadge: {
        backgroundColor: '#7C3AED',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6
    },
    discountText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700'
    },
    switchContainer: {
        alignItems: 'flex-end'
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        marginBottom: 6
    },
    statusBadgeActive: {
        backgroundColor: '#ECFDF5'
    },
    statusBadgeInactive: {
        backgroundColor: '#F3F4F6'
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4
    },
    statusDotActive: {
        backgroundColor: '#10B981'
    },
    statusDotInactive: {
        backgroundColor: '#9CA3AF'
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600'
    },
    statusTextActive: {
        color: '#059669'
    },
    statusTextInactive: {
        color: '#6B7280'
    },
    switch: {
        transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }]
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        marginRight: 8,
        marginBottom: 4
    },
    badgeBlue: {
        backgroundColor: '#EFF6FF'
    },
    badgeOrange: {
        backgroundColor: '#FFF7ED'
    },
    badgePurple: {
        backgroundColor: '#F5F3FF'
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 5
    },
    badgeTextBlue: {
        color: '#1D4ED8'
    },
    badgeTextOrange: {
        color: '#C2410C'
    },
    badgeTextPurple: {
        color: '#6D28D9'
    }
})
