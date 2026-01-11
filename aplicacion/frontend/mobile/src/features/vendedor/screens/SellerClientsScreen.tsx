import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { SearchBar } from '../../../components/ui/SearchBar'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ClientService, type Client, type PriceList, type CommercialZone } from '../../../services/api/ClientService'
import { SellerStackParamList } from '../../../navigation/SellerNavigator'

/**
 * SellerClientsScreen - Pantalla de Clientes del Vendedor
 *
 * Muestra la lista de clientes asignados al vendedor autenticado
 *
 * Características:
 * - Carga clientes desde GET /api/clientes/mis (filtra por vendedor_asignado_id)
 * - Búsqueda local por razón social, nombre comercial o identificación
 * - Pull-to-refresh para recargar datos
 * - Navegación al detalle del cliente
 * - Badges de estado (bloqueado/activo) y crédito
 * - Información de zona y lista de precios
 *
 * Backend:
 * - Endpoint: GET /api/clientes/mis
 * - Roles permitidos: vendedor, admin, supervisor
 * - Sin paginación (retorna todos los clientes del vendedor)
 */
export function SellerClientsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<SellerStackParamList>>()

    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [clients, setClients] = useState<Client[]>([])
    const [filteredClients, setFilteredClients] = useState<Client[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // Cachés para nombres de listas y zonas
    const [priceLists, setPriceLists] = useState<Map<number, string>>(new Map())
    const [zones, setZones] = useState<Map<number, string>>(new Map())

    // Cargar clientes al montar o al volver al foco
    useFocusEffect(
        useCallback(() => {
            loadClients()
        }, [])
    )

    // Cargar listas de precios y zonas (para mostrar nombres en lugar de IDs)
    useEffect(() => {
        loadMetadata()
    }, [])

    // Filtrar clientes cuando cambia la búsqueda
    useEffect(() => {
        filterClients()
    }, [searchQuery, clients])

    const loadMetadata = async () => {
        try {
            // Cargar listas de precios
            const lists = await ClientService.getPriceLists()
            const listsMap = new Map<number, string>()
            lists.forEach(list => listsMap.set(list.id, list.nombre))
            setPriceLists(listsMap)

            // Cargar zonas comerciales
            const zonesData = await ClientService.getCommercialZones()
            const zonesMap = new Map<number, string>()
            zonesData.forEach(zone => zonesMap.set(zone.id, zone.nombre))
            setZones(zonesMap)
        } catch (error) {
            console.error('Error loading metadata:', error)
        }
    }

    const loadClients = async () => {
        setLoading(true)
        try {
            const data = await ClientService.getMyClients()
            setClients(data)
            setFilteredClients(data)
        } catch (error) {
            console.error('Error loading clients:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleRefresh = () => {
        setRefreshing(true)
        loadClients()
    }

    const filterClients = () => {
        if (!searchQuery.trim()) {
            setFilteredClients(clients)
            return
        }

        const query = searchQuery.toLowerCase()
        const filtered = clients.filter(client =>
            client.razon_social.toLowerCase().includes(query) ||
            (client.nombre_comercial?.toLowerCase().includes(query)) ||
            client.identificacion.toLowerCase().includes(query)
        )
        setFilteredClients(filtered)
    }

    const handleClientPress = (client: Client) => {
        navigation.navigate('SellerClientDetail', { clientId: client.id })
    }

    const renderClientCard = ({ item }: { item: Client }) => {
        const creditPercentage = item.tiene_credito && item.limite_credito > 0
            ? (item.saldo_actual / item.limite_credito) * 100
            : 0

        const priceListName = item.lista_precios_id
            ? priceLists.get(item.lista_precios_id) || 'Sin Lista'
            : 'Sin Lista'

        const zoneName = item.zona_comercial_id
            ? zones.get(item.zona_comercial_id) || 'Sin Zona'
            : 'Sin Zona'

        return (
            <TouchableOpacity
                style={styles.clientCard}
                onPress={() => handleClientPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={styles.avatarCircle}>
                            <Ionicons name="business" size={24} color="#DC2626" />
                        </View>
                        <View style={styles.clientInfo}>
                            <Text style={styles.clientName} numberOfLines={1}>
                                {item.nombre_comercial || item.razon_social}
                            </Text>
                            <Text style={styles.clientSubtitle} numberOfLines={1}>
                                {item.razon_social}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.statusBadge}>
                        {item.bloqueado ? (
                            <View style={styles.blockedBadge}>
                                <Ionicons name="lock-closed" size={12} color="#DC2626" />
                                <Text style={styles.blockedText}>Bloqueado</Text>
                            </View>
                        ) : (
                            <View style={styles.activeBadge}>
                                <View style={styles.activeDot} />
                                <Text style={styles.activeText}>Activo</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.cardBody}>
                    {/* Identificación */}
                    <View style={styles.infoRow}>
                        <Ionicons name="card-outline" size={16} color="#6B7280" />
                        <Text style={styles.infoLabel}>RUC:</Text>
                        <Text style={styles.infoValue}>{item.identificacion}</Text>
                    </View>

                    {/* Zona Comercial */}
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={16} color="#6B7280" />
                        <Text style={styles.infoLabel}>Zona:</Text>
                        <Text style={styles.infoValue}>{zoneName}</Text>
                    </View>

                    {/* Lista de Precios */}
                    <View style={styles.infoRow}>
                        <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
                        <Text style={styles.infoLabel}>Lista:</Text>
                        <Text style={styles.infoValue}>{priceListName}</Text>
                    </View>

                    {/* Información de Crédito */}
                    {item.tiene_credito && (
                        <View style={styles.creditContainer}>
                            <View style={styles.creditHeader}>
                                <Ionicons name="wallet-outline" size={16} color="#6B7280" />
                                <Text style={styles.creditLabel}>Crédito:</Text>
                                <Text style={styles.creditValue}>
                                    ${item.saldo_actual.toFixed(2)} / ${item.limite_credito.toFixed(2)}
                                </Text>
                            </View>
                            <View style={styles.creditBarContainer}>
                                <View
                                    style={[
                                        styles.creditBar,
                                        {
                                            width: `${Math.min(creditPercentage, 100)}%`,
                                            backgroundColor: creditPercentage > 90 ? '#DC2626' : creditPercentage > 70 ? '#F59E0B' : '#10B981'
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={styles.creditPercentage}>
                                {creditPercentage.toFixed(0)}% utilizado
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.viewDetailsText}>Ver detalles</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <Header title="Mis Clientes" variant="standard" />

            {/* Barra de búsqueda */}
            <View style={styles.searchContainer}>
                <SearchBar
                    placeholder="Buscar por nombre o RUC..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onClear={() => setSearchQuery('')}
                />
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Ionicons name="people" size={20} color="#DC2626" />
                    <Text style={styles.statValue}>{clients.length}</Text>
                    <Text style={styles.statLabel}>Total Clientes</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.statValue}>
                        {clients.filter(c => !c.bloqueado).length}
                    </Text>
                    <Text style={styles.statLabel}>Activos</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="lock-closed" size={20} color="#EF4444" />
                    <Text style={styles.statValue}>
                        {clients.filter(c => c.bloqueado).length}
                    </Text>
                    <Text style={styles.statLabel}>Bloqueados</Text>
                </View>
            </View>

            {/* Lista de clientes */}
            {loading && !refreshing ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#DC2626" />
                    <Text style={{ marginTop: 12, color: '#9CA3AF', fontSize: 14 }}>
                        Cargando clientes...
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredClients}
                    keyExtractor={(item) => item.id}
                    renderItem={renderClientCard}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}
                    ListEmptyComponent={
                        <EmptyState
                            icon={searchQuery ? 'search-outline' : 'people-outline'}
                            title={searchQuery ? 'No se encontraron clientes' : 'Sin clientes asignados'}
                            description={
                                searchQuery
                                    ? 'Intenta con otros términos de búsqueda'
                                    : 'No tienes clientes asignados en tu zona'
                            }
                            actionLabel={searchQuery ? 'Limpiar búsqueda' : 'Recargar'}
                            onAction={searchQuery ? () => setSearchQuery('') : loadClients}
                            style={{ marginTop: 40 }}
                        />
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#DC2626"
                            colors={['#DC2626']}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    searchContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginTop: 4
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 2
    },
    clientCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden'
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    clientInfo: {
        flex: 1
    },
    clientName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2
    },
    clientSubtitle: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280'
    },
    statusBadge: {
        marginLeft: 12
    },
    blockedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4
    },
    blockedText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#DC2626'
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981'
    },
    activeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#059669'
    },
    cardBody: {
        padding: 16,
        gap: 10
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280'
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        flex: 1
    },
    creditContainer: {
        marginTop: 8,
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    creditHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8
    },
    creditLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280'
    },
    creditValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        textAlign: 'right'
    },
    creditBarContainer: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 6
    },
    creditBar: {
        height: '100%',
        borderRadius: 4
    },
    creditPercentage: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textAlign: 'right'
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6'
    },
    viewDetailsText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#DC2626'
    }
})
