import React, { useState, useCallback, useMemo } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../../components/ui/Header'
import { SearchBar } from '../../../../components/ui/SearchBar'
import { GenericList } from '../../../../components/ui/GenericList'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { DashboardCard } from '../../../../components/ui/DashboardCard'
import { PickingService, type Picking } from '../../../../services/api/PickingService'

const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatDateShort = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
}

export function WarehousePickingHistoryScreen() {
    const navigation = useNavigation<any>()
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [pickings, setPickings] = useState<Picking[]>([])

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            // Obtener mis pickings y filtrar solo COMPLETADOS
            const data = await PickingService.listMine()
            const completados = data.filter(p => p.estado === 'COMPLETADO')
            // Ordenar por fecha más reciente
            completados.sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime()
                const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime()
                return dateB - dateA
            })
            setPickings(completados)
        } catch (error) {
            console.error('Error loading history:', error)
            setPickings([])
        } finally {
            setLoading(false)
        }
    }, [])

    useFocusEffect(
        useCallback(() => {
            loadData()
            return () => { }
        }, [loadData]),
    )

    const filteredPickings = useMemo(() => {
        if (!search) return pickings

        const term = search.toLowerCase()
        return pickings.filter(picking => {
            const idMatch = picking.id.toLowerCase().includes(term)
            const pedidoMatch = picking.pedidoId?.toLowerCase().includes(term) || false
            const productMatch = picking.items?.some(item =>
                item.nombreProducto?.toLowerCase().includes(term)
            ) || false
            return idMatch || pedidoMatch || productMatch
        })
    }, [pickings, search])

    const totals = useMemo(() => {
        const totalUnidades = pickings.reduce((acc, p) => {
            return acc + (p.items?.reduce((sum, item) => sum + (item.cantidadPickeada || 0), 0) || 0)
        }, 0)
        const totalProductos = pickings.reduce((acc, p) => acc + (p.items?.length || 0), 0)

        return {
            completados: pickings.length,
            unidades: totalUnidades,
            productos: totalProductos,
        }
    }, [pickings])

    const getTotalPickeado = (picking: Picking) => {
        return picking.items?.reduce((acc, item) => acc + (item.cantidadPickeada || 0), 0) || 0
    }

    const renderPickingCard = (item: Picking) => {
        const itemCount = item.items?.length || 0
        const totalQty = getTotalPickeado(item)

        return (
            <Pressable
                onPress={() => navigation.navigate('WarehousePickingDetail', { pickingId: item.id })}
                className="bg-white rounded-2xl border border-neutral-100 overflow-hidden mb-3"
                style={{ elevation: 2 }}
            >
                <View className="p-4">
                    {/* Header */}
                    <View className="flex-row items-start justify-between">
                        <View className="flex-row items-center flex-1">
                            <View
                                className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                                style={{ backgroundColor: '#D1FAE5' }}
                            >
                                <Ionicons name="checkmark-circle-outline" size={24} color="#059669" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-bold text-neutral-900">
                                    Picking #{item.id.slice(0, 8).toUpperCase()}
                                </Text>
                                <Text className="text-xs text-neutral-500 mt-0.5">
                                    Completado el {formatDateShort(item.updatedAt || item.createdAt)}
                                </Text>
                            </View>
                        </View>
                        <StatusBadge label="Completado" variant="success" size="sm" />
                    </View>

                    {/* Pedido reference */}
                    {item.pedidoId && (
                        <View className="mt-2 flex-row items-center">
                            <Ionicons name="document-text-outline" size={14} color="#6B7280" />
                            <Text className="text-xs text-neutral-500 ml-1">
                                Pedido #{item.pedidoId.slice(0, 8).toUpperCase()}
                            </Text>
                        </View>
                    )}

                    {/* Stats */}
                    <View className="flex-row mt-3 gap-2">
                        <View className="flex-row items-center bg-green-50 px-3 py-1.5 rounded-full">
                            <Ionicons name="cube-outline" size={14} color="#059669" />
                            <Text className="text-xs font-semibold text-green-700 ml-1">
                                {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
                            </Text>
                        </View>
                        <View className="flex-row items-center bg-green-50 px-3 py-1.5 rounded-full">
                            <Ionicons name="checkmark-done-outline" size={14} color="#059669" />
                            <Text className="text-xs font-semibold text-green-700 ml-1">
                                {totalQty} unidades pickeadas
                            </Text>
                        </View>
                    </View>

                    {/* Items preview */}
                    {item.items && item.items.length > 0 && (
                        <View className="mt-3 pt-3 border-t border-neutral-100">
                            {item.items.slice(0, 2).map((it, idx) => (
                                <View key={idx} className="flex-row items-center justify-between py-1">
                                    <Text className="text-sm text-neutral-700 flex-1" numberOfLines={1}>
                                        {it.nombreProducto || `Producto ${idx + 1}`}
                                    </Text>
                                    <View className="flex-row items-center ml-2">
                                        <Text className="text-sm font-semibold text-green-600">
                                            {it.cantidadPickeada || 0}
                                        </Text>
                                        <Text className="text-xs text-neutral-400 ml-1">
                                            /{it.cantidadSolicitada}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                            {item.items.length > 2 && (
                                <Text className="text-xs text-neutral-400 mt-1">
                                    +{item.items.length - 2} productos más...
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Footer */}
                <View className="flex-row items-center justify-center py-3 border-t border-neutral-100 bg-neutral-50">
                    <Text className="text-sm font-semibold text-neutral-500">Ver Detalle</Text>
                    <Ionicons name="chevron-forward" size={16} color="#6B7280" style={{ marginLeft: 4 }} />
                </View>
            </Pressable>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title="Historial de Picking"
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            {/* KPIs */}
            <View className="mx-4 mt-4">
                <View className="flex-row justify-between">
                    <DashboardCard
                        label="Completados"
                        value={totals.completados}
                        icon="checkmark-done-circle"
                        color="#059669"
                        columns={3}
                    />
                    <DashboardCard
                        label="Productos"
                        value={totals.productos}
                        icon="cube"
                        color="#2563EB"
                        columns={3}
                    />
                    <DashboardCard
                        label="Unidades"
                        value={totals.unidades}
                        icon="layers"
                        color="#7C3AED"
                        columns={3}
                    />
                </View>
            </View>

            {/* Search */}
            <View className="bg-white px-4 pb-4 pt-4 mt-4 border-b border-neutral-100">
                <SearchBar
                    placeholder="Buscar en historial..."
                    value={search}
                    onChangeText={setSearch}
                    onClear={() => setSearch('')}
                />
            </View>

            {/* List */}
            <GenericList
                items={filteredPickings}
                isLoading={loading}
                onRefresh={loadData}
                emptyState={{
                    icon: 'time-outline',
                    title: 'Sin Historial',
                    message: 'Tus pickings completados aparecerán aquí.',
                }}
                renderItem={renderPickingCard}
            />
        </View>
    )
}
