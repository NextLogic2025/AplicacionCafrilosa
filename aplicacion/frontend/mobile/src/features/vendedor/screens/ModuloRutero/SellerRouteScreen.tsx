import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { RouteVisitCard } from '../../../../components/ui/RouteVisitCard'
import { RouteService, RoutePlan } from '../../../../services/api/RouteService'
import { ClientService, Client } from '../../../../services/api/ClientService'
import { UserService, UserProfile } from '../../../../services/api/UserService'
import { SellerStackParamList } from '../../../../navigation/SellerNavigator'
import { SectionHeader } from '../../../../components/ui/SectionHeader'

/**
 * SellerRouteScreen - Pantalla de Rutero del Vendedor
 *
 * Muestra la agenda semanal de visitas planificadas a clientes.
 * El rutero es la planificación de qué clientes visitar cada día de la semana.
 *
 * Características:
 * - Carga rutero desde GET /api/rutero/mio (solo del vendedor autenticado)
 * - Agrupa visitas por día de la semana
 * - Resalta las visitas programadas para el día actual
 * - Muestra orden sugerido, hora estimada y prioridad
 * - Navegación al detalle del cliente
 * - Pull-to-refresh para recargar datos
 *
 * Backend:
 * - Endpoint: GET /api/rutero/mio
 * - Roles permitidos: admin, supervisor, vendedor
 * - Retorna rutero planificado con JOIN a clientes asignados
 */
export function SellerRouteScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<SellerStackParamList>>()

    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [routePlans, setRoutePlans] = useState<RoutePlan[]>([])
    const [clients, setClients] = useState<Map<string, Client>>(new Map())
    const [userNames, setUserNames] = useState<Map<string, string>>(new Map())
    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay()) // 0=Domingo, 6=Sábado

    // Cargar rutero al montar o al volver al foco
    useFocusEffect(
        useCallback(() => {
            loadRoute()
        }, [])
    )

    const loadRoute = async () => {
        setLoading(true)
        try {
            // Cargar rutero primero
            const routes = await RouteService.getMyRoute()
            setRoutePlans(routes)

            // Intentar cargar nombres de usuarios
            // NOTA: El endpoint /usuarios/vendedores tiene @Roles('admin', 'supervisor')
            // y NO incluye 'vendedor', por lo que puede fallar con 403 Forbidden
            // Si falla, simplemente no mostramos los nombres de contacto
            try {
                const users = await UserService.getUsers()
                const usersMap = new Map<string, string>()
                users.forEach(u => usersMap.set(u.id, u.name))
                setUserNames(usersMap)
            } catch (userError) {
                console.log('No se pudo cargar información de usuarios (permisos insuficientes)')
                // No hacer nada - userNames queda vacío
            }

            // Cargar información de clientes para enriquecer el rutero
            const uniqueClientIds = [...new Set(routes.map(r => r.cliente_id))]
            const clientsMap = new Map<string, Client>()

            // Cargar clientes en paralelo
            await Promise.all(
                uniqueClientIds.map(async (clientId) => {
                    try {
                        const client = await ClientService.getClient(clientId)
                        clientsMap.set(clientId, client)
                    } catch (error) {
                        console.error(`Error loading client ${clientId}:`, error)
                    }
                })
            )

            setClients(clientsMap)
        } catch (error) {
            console.error('Error loading route:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleRefresh = () => {
        setRefreshing(true)
        loadRoute()
    }

    const handleClientPress = (clientId: string) => {
        // SellerClientDetail was removed; go to clients list instead
        navigation.navigate('SellerTabs', { screen: 'SellerClients' })
    }

    // Filtrar visitas por día seleccionado
    const getVisitsForDay = (day: number) => {
        return routePlans
            .filter(route => route.activo && route.dia_semana === day)
            .sort((a, b) => (a.orden_sugerido || 0) - (b.orden_sugerido || 0))
    }

    const visitsForSelectedDay = getVisitsForDay(selectedDay)

    // Días de la semana para selector
    const weekDays = [
        { id: 1, name: 'Lun', fullName: 'Lunes' },
        { id: 2, name: 'Mar', fullName: 'Martes' },
        { id: 3, name: 'Mié', fullName: 'Miércoles' },
        { id: 4, name: 'Jue', fullName: 'Jueves' },
        { id: 5, name: 'Vie', fullName: 'Viernes' },
        { id: 6, name: 'Sáb', fullName: 'Sábado' },
        { id: 0, name: 'Dom', fullName: 'Domingo' }
    ]

    const currentDayOfWeek = new Date().getDay()

    // Estadísticas del rutero
    const totalVisits = routePlans.filter(r => r.activo).length
    const todayVisits = getVisitsForDay(currentDayOfWeek).length
    const highPriorityVisits = routePlans.filter(r => r.activo && r.prioridad_visita === 'ALTA').length

    const renderVisitCard = ({ item }: { item: RoutePlan }) => {
        const client = clients.get(item.cliente_id)
        const ownerName = client?.usuario_principal_id ? userNames.get(client.usuario_principal_id) : null
        const isToday = item.dia_semana === currentDayOfWeek

        return (
            <RouteVisitCard
                clientName={client?.nombre_comercial || client?.razon_social || 'Cliente desconocido'}
                ownerName={ownerName}
                time={item.hora_estimada_arribo || undefined}
                dayOfWeek={item.dia_semana}
                priority={item.prioridad_visita as 'ALTA' | 'MEDIA' | 'BAJA' | 'NORMAL'}
                frequency={item.frecuencia as 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'}
                order={item.orden_sugerido}
                onPress={() => handleClientPress(item.cliente_id)}
                isToday={isToday}
            />
        )
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <Header title="Mi Rutero" variant="standard" />

            {/* Estadísticas */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Ionicons name="map" size={20} color="#DC2626" />
                    <Text style={styles.statValue}>{totalVisits}</Text>
                    <Text style={styles.statLabel}>Total Visitas</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="today" size={20} color="#10B981" />
                    <Text style={styles.statValue}>{todayVisits}</Text>
                    <Text style={styles.statLabel}>Hoy</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="flag" size={20} color="#EF4444" />
                    <Text style={styles.statValue}>{highPriorityVisits}</Text>
                    <Text style={styles.statLabel}>Prioritarias</Text>
                </View>
            </View>

            {/* Selector de días */}
            <View style={styles.daySelector}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={weekDays}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.daySelectorContent}
                    renderItem={({ item }) => {
                        const isSelected = selectedDay === item.id
                        const isCurrentDay = currentDayOfWeek === item.id
                        const visitsCount = getVisitsForDay(item.id).length

                        return (
                            <TouchableOpacity
                                style={[
                                    styles.dayButton,
                                    isSelected && styles.dayButtonSelected,
                                    isCurrentDay && styles.dayButtonToday
                                ]}
                                onPress={() => setSelectedDay(item.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.dayButtonText,
                                    isSelected && styles.dayButtonTextSelected
                                ]}>
                                    {item.name}
                                </Text>
                                {visitsCount > 0 && (
                                    <View style={[
                                        styles.dayBadge,
                                        isSelected && styles.dayBadgeSelected
                                    ]}>
                                        <Text style={[
                                            styles.dayBadgeText,
                                            isSelected && styles.dayBadgeTextSelected
                                        ]}>
                                            {visitsCount}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )
                    }}
                />
            </View>

            {/* Lista de visitas */}
            {loading && !refreshing ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#DC2626" />
                    <Text style={{ marginTop: 12, color: '#9CA3AF', fontSize: 14 }}>
                        Cargando rutero...
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={visitsForSelectedDay}
                    keyExtractor={(item) => item.id}
                    renderItem={renderVisitCard}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}
                    ListHeaderComponent={
                        visitsForSelectedDay.length > 0 ? (
                            <SectionHeader
                                title={`${weekDays.find(d => d.id === selectedDay)?.fullName || 'Día'}`}
                                subtitle={`${visitsForSelectedDay.length} visita${visitsForSelectedDay.length !== 1 ? 's' : ''} programada${visitsForSelectedDay.length !== 1 ? 's' : ''}`}
                            />
                        ) : null
                    }
                    ListEmptyComponent={
                        <EmptyState
                            icon="calendar-outline"
                            title="Sin visitas programadas"
                            description={`No tienes visitas planificadas para el ${weekDays.find(d => d.id === selectedDay)?.fullName.toLowerCase()}`}
                            actionLabel="Recargar"
                            onAction={loadRoute}
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

            {/* Botón flotante de mapa */}
            <TouchableOpacity
                style={styles.mapFab}
                onPress={() => navigation.navigate('SellerRouteMap')}
                activeOpacity={0.8}
            >
                <Ionicons name="map" size={24} color="white" />
                <Text style={styles.mapFabText}>Mapa</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        paddingBottom: 8,
        gap: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    statCard: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB'
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
        marginTop: 2,
        textAlign: 'center'
    },
    daySelector: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingTop: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    daySelectorContent: {
        paddingHorizontal: 16,
        gap: 8
    },
    dayButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        minWidth: 60,
        position: 'relative'
    },
    dayButtonSelected: {
        backgroundColor: '#DC2626',
        borderColor: '#DC2626'
    },
    dayButtonToday: {
        borderColor: '#F59E0B',
        borderWidth: 2
    },
    dayButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151'
    },
    dayButtonTextSelected: {
        color: '#FFFFFF'
    },
    dayBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#DC2626',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        borderWidth: 2,
        borderColor: '#FFFFFF'
    },
    dayBadgeSelected: {
        backgroundColor: '#FFFFFF'
    },
    dayBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFFFFF'
    },
    dayBadgeTextSelected: {
        color: '#DC2626'
    },
    mapFab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: '#DC2626',
        borderRadius: 30,
        paddingHorizontal: 20,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8
    },
    mapFabText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700'
    }
})
