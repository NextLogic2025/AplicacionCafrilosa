import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Alert, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { SearchBar } from '../../../../components/ui/SearchBar'
import { BRAND_COLORS } from '../../../../shared/types'
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

    const [filterMode, setFilterMode] = useState<string>('active')

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

            const zoneMap = new Map()
            zonesData.forEach(z => zoneMap.set(z.id, z.nombre))

            const vendorNameMap = new Map()
            vendorsData.forEach(v => vendorNameMap.set(v.id, v.name))

            const userNameMap = new Map()
            usersData.forEach(u => userNameMap.set(u.id, u.name))

            const zoneToVendorMap = new Map()
            assignmentsData.filter(a => a.es_principal).forEach(a => {
                const vName = a.nombre_vendedor_cache || vendorNameMap.get(a.vendedor_usuario_id)
                if (vName) zoneToVendorMap.set(Number(a.zona_id), vName)
            })

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

    const filteredClients = clients.filter(c => {
        const matchesSearch = c.razon_social.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.identificacion.includes(searchQuery)

        if (!matchesSearch) return false

        if (filterMode === 'active') {
            return !c.bloqueado
        } else if (filterMode === 'blocked') {
            return c.bloqueado
        } else if (filterMode.startsWith('list_')) {
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

    const filterCategories = [
        { id: 'active', name: 'Activos' },
        { id: 'blocked', name: 'Suspendidos' },
        ...priceLists.map(l => ({ id: `list_${l.id}`, name: l.nombre }))
    ]

    const renderItem = ({ item }: { item: any }) => {
        const displayName = item.usuario_principal_nombre || item._linkedUserName || 'Usuario no asignado'
        const commercialName = item.nombre_comercial || item.razon_social
        const isBlocked = item.bloqueado

        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => (navigation as any).navigate('SupervisorClientDetail', { client: item })}
                style={[styles.card, isBlocked && styles.cardDisabled]}
            >
                <View style={[styles.accent, isBlocked && styles.accentDisabled]} />
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.avatarContainer}>
                            <View style={[styles.avatar, isBlocked && styles.avatarDisabled]}>
                                <Ionicons name="business" size={22} color={isBlocked ? '#9CA3AF' : BRAND_COLORS.red} />
                            </View>
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={[styles.clientName, isBlocked && styles.textDisabled]} numberOfLines={1}>
                                {displayName}
                            </Text>
                            <Text style={styles.clientMeta} numberOfLines={1}>{commercialName}</Text>
                            <View style={styles.idRow}>
                                <Ionicons name="card-outline" size={12} color="#9CA3AF" />
                                <Text style={styles.clientId}>{item.identificacion}</Text>
                            </View>
                        </View>
                        <View style={[styles.statusBadge, isBlocked ? styles.statusBadgeBlocked : styles.statusBadgeActive]}>
                            <View style={[styles.statusDot, isBlocked ? styles.statusDotBlocked : styles.statusDotActive]} />
                            <Text style={[styles.statusText, isBlocked ? styles.statusTextBlocked : styles.statusTextActive]}>
                                {isBlocked ? 'Suspendido' : 'Activo'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.badgeRow}>
                        <View style={[styles.badge, styles.badgeBlue]}>
                            <Ionicons name="pricetag" size={13} color="#2563EB" />
                            <Text style={[styles.badgeText, styles.badgeTextBlue]}>{getListName(item.lista_precios_id)}</Text>
                        </View>
                        {(item.zona_comercial_nombre || item._zoneName) && (
                            <View style={[styles.badge, styles.badgeOrange]}>
                                <Ionicons name="map-outline" size={13} color="#EA580C" />
                                <Text style={[styles.badgeText, styles.badgeTextOrange]}>{item.zona_comercial_nombre || item._zoneName}</Text>
                            </View>
                        )}
                        {(item.vendedor_nombre || item._vendorName) && (
                            <View style={[styles.badge, styles.badgeGreen]}>
                                <Ionicons name="person-circle-outline" size={13} color="#059669" />
                                <Text style={[styles.badgeText, styles.badgeTextGreen]}>{item.vendedor_nombre || item._vendorName}</Text>
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
                        className="w-14 h-14 rounded-2xl items-center justify-center shadow-lg"
                        style={{ backgroundColor: BRAND_COLORS.red }}
                        onPress={() => (navigation as any).navigate('SupervisorClientForm')}
                    >
                        <Ionicons name="add" size={28} color="white" />
                    </TouchableOpacity>
                </View>

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
        backgroundColor: BRAND_COLORS.red
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
        backgroundColor: '#FEF2F2',
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
    clientName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2
    },
    textDisabled: {
        color: '#6B7280'
    },
    clientMeta: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4
    },
    idRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    clientId: {
        fontSize: 11,
        color: '#9CA3AF',
        marginLeft: 4
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20
    },
    statusBadgeActive: {
        backgroundColor: '#ECFDF5'
    },
    statusBadgeBlocked: {
        backgroundColor: '#FEF2F2'
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 5
    },
    statusDotActive: {
        backgroundColor: '#10B981'
    },
    statusDotBlocked: {
        backgroundColor: BRAND_COLORS.red
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600'
    },
    statusTextActive: {
        color: '#059669'
    },
    statusTextBlocked: {
        color: BRAND_COLORS.red
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
    badgeGreen: {
        backgroundColor: '#ECFDF5'
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
    badgeTextGreen: {
        color: '#047857'
    }
})
